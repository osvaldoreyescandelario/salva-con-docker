const { pool } = require("../config/db");
const { runQuery } = require("../utils/dbUtils");

const {
  auditAction,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES
} = require("../middlewares/audit");
const {
  findObjectByKeyAndId,
  normalizeDate
} = require("../utils/childrenHelpers");

exports.children = async (req, res) => {
  const sql = "SELECT dni, fullname FROM mgifixed";

  // Tomar el usuario que viene del front, si no viene, usar 'system'
  const currentUserId = req.query.userid || "system";

  try {
    // Ejecutar la consulta usando el usuario real
    const [results] = await runQuery(sql, [], req, {
      username: currentUserId
    });

    // Auditoría de lectura de datos
    await auditAction({
      req,
      actor: { username: currentUserId }, // ahora se usa el usuario real
      action: AUDIT_ACTIONS.READ_SENSITIVE, // es información de niños
      entity: AUDIT_ENTITIES.CHILD,
      description: `Consulta de lista de niños (dni y fullname), ${results.length} registros`,
      metadata: { count: results.length }
    });

    res.json(results);
  } catch (error) {
    console.error("Error en la consulta /api/children:", error);
    res.status(500).json({ error: "Error en la base de datos" });
  }
};

exports.getChild = async (req, res) => {
  const code = req.params.code;
  const conn = await pool.getConnection();

  // Tomamos el usuario que hace la petición
  const auditUserId = req.query.userid || "desconocido";
  const auditActor = { username: auditUserId }; // actor_id será auditUserId

  try {
    // 1️⃣ Buscar en mgifixed
    const [fixedRows] = await conn.execute(
      `SELECT dni, fullname, birthdate, sex, skincolor, photo
       FROM mgifixed
       WHERE dni = ?`,
      [code]
    );

    if (fixedRows.length === 0) {
      // Registrar auditoría de intento fallido de lectura
      await auditAction({
        req,
        actor: auditActor,
        action: AUDIT_ACTIONS.READ_SENSITIVE,
        entity: AUDIT_ENTITIES.CHILD,
        entityId: code,
        description: "Intento de lectura de niño que no existe",
        metadata: { table: "mgifixed" }
      });

      return res.json({
        success: false,
        message: "No existe un registro con ese DNI"
      });
    }

    const child = fixedRows[0];

    // 2️⃣ Buscar en mgivar
    const [varRows] = await conn.execute(
      `SELECT *
       FROM mgivar
       WHERE dni = ?
       ORDER BY savedate ASC`,
      [code]
    );

    // Añadir key a cada fila de varRows
    const data = varRows.map((row) => [{ ...row, key: "2.1" }]);

    // 🧾 Auditoría de lectura exitosa
    await auditAction({
      req,
      actor: auditActor,
      action: AUDIT_ACTIONS.READ_SENSITIVE,
      entity: AUDIT_ENTITIES.CHILD,
      entityId: code,
      description: "Lectura de datos completos del niño",
      metadata: {
        tables: ["mgifixed", "mgivar"],
        varRowsCount: varRows.length
      }
    });

    res.json({
      success: true,
      childrenData: {
        dni: child.dni,
        fullname: child.fullname,
        birthdate: child.birthdate,
        sex: child.sex,
        skincolor: child.skincolor,
        photo: child.photo,
        data
      }
    });
  } catch (err) {
    console.error("❌ Error en /api/getchild:", err.message);

    // Auditoría de error inesperado
    await auditAction({
      req,
      actor: auditActor,
      action: AUDIT_ACTIONS.READ_SENSITIVE,
      entity: AUDIT_ENTITIES.CHILD,
      entityId: code,
      description: "Error al leer datos del niño",
      metadata: { error: err.message }
    });

    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updateChild = async (req, res) => {
  const { currentId, childrenData } = req.body;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const birthdate = normalizeDate(childrenData.birthdate);
    const savedateFixed = normalizeDate(childrenData.savedate);

    // 🔹 Obtener estado previo
    const [oldFixed] = await conn.execute(
      "SELECT * FROM mgifixed WHERE dni = ?",
      [childrenData.dni]
    );
    const [oldVar] = await conn.execute("SELECT * FROM mgivar WHERE id = ?", [
      currentId
    ]);

    // 🔹 Actualizar mgifixed
    const fixedSql = `
      UPDATE mgifixed
      SET fullname = ?, birthdate = ?, sex = ?, skincolor = ?, savedate = ?
      WHERE dni = ?
    `;
    await conn.execute(fixedSql, [
      childrenData.fullname,
      birthdate,
      childrenData.sex,
      childrenData.skincolor,
      savedateFixed,
      childrenData.dni
    ]);

    // 🔹 Actualizar mgivar
    const mgiObj = findObjectByKeyAndId(childrenData.data, "2.1", currentId);
    if (!mgiObj)
      throw new Error(`No se encontró objeto con key='2.1' y id=${currentId}`);
    const savedate = normalizeDate(mgiObj.savedate);

    const varSql = `
      UPDATE mgivar
      SET cage=?, mage=?, address=?, province=?, municipality=?, councill=?, zone=?,
          personincharge=?, parentalrelationship=?, anotherrelation=?, tel=?,
          startdate=?, edulevel=?, degree=?, eduinstitution=?, institution=?,
          repetition=?, repetitioncount=?, objovercome=?, savedate=?
      WHERE id=?
    `;

    await conn.execute(varSql, [
      mgiObj.cage,
      mgiObj.mage,
      mgiObj.address,
      mgiObj.province,
      mgiObj.municipality,
      mgiObj.councill,
      mgiObj.zone,
      mgiObj.personincharge,
      mgiObj.parentalrelationship,
      mgiObj.anotherrelation,
      mgiObj.tel,
      mgiObj.startdate,
      mgiObj.edulevel,
      mgiObj.degree,
      mgiObj.eduinstitution,
      mgiObj.institution,
      mgiObj.repetition,
      mgiObj.repetitioncount,
      mgiObj.objovercome,
      savedate,
      mgiObj.id
    ]);

    // 🔹 Auditoría usando auditAction
    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.CHILD,
      entityId: childrenData.dni,
      description: `Actualización de datos de mgifixed + mgivar para dni=${childrenData.dni}`,
      oldState: { mgifixed: oldFixed[0], mgivar: oldVar[0] },
      newState: childrenData
    });

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updatechild:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.checkChild = async (req, res) => {
  const { cnumber } = req.body;
  if (!cnumber)
    return res
      .status(400)
      .json({ message: "Falta el número de carnet (cnumber)" });

  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    const [rows] = await conn.execute(
      "SELECT * FROM mgifixed WHERE dni = ? LIMIT 1",
      [cnumber]
    );

    // Auditoría centralizada
    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.SELECT,
      entity: AUDIT_ENTITIES.ME21,
      entityId: cnumber.toString(),
      description: `Consulta de existencia de niño con dni=${cnumber}`,
      oldState: null,
      newState: { input: req.body, result: rows.length > 0 ? rows[0] : null }
    });

    res.json(
      rows.length > 0 ? { exists: true, child: rows[0] } : { exists: false }
    );
  } catch (err) {
    console.error("❌ Error en /api/checkchild:", err);
    res.status(500).json({ message: "Error interno en el servidor" });
  } finally {
    conn.release();
  }
};

exports.deleteMgivar = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    // 🔎 Obtener registro antes de eliminarlo
    const [rows] = await conn.execute("SELECT * FROM mgivar WHERE id = ?", [
      id
    ]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "🛑 No existe un registro con ese ID." });
    }

    const oldRecord = rows[0];

    // 🔹 Eliminar el registro
    await conn.execute("DELETE FROM mgivar WHERE id = ?", [id]);

    // 🧾 Auditoría centralizada
    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.DELETE,
      entity: AUDIT_ENTITIES.MGIVAR,
      entityId: id.toString(),
      description: `Eliminación de registro mgivar con id=${id}`,
      oldState: oldRecord,
      newState: null
    });

    await conn.commit();
    res.json({ message: `Registro con ID=${id} eliminado.` });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/delmgivar:", err);
    res.status(500).json({ message: "Error al borrar el registro." });
  } finally {
    conn.release();
  }
};

exports.getChildPhoto = async (req, res) => {
  const dni = req.params.dni;
  const conn = await pool.getConnection();

  // Tomamos el usuario real que hace la petición
  const auditUsername = req.query.userid || "desconocido";

  try {
    const sql = "SELECT photo FROM mgifixed WHERE dni=? LIMIT 1";
    const [results] = await conn.execute(sql, [dni]);

    // 🧾 Auditoría: lectura de foto
    try {
      await auditAction({
        req,
        actor: { username: auditUsername },
        action: "SELECT",
        entity: "mgifixed",
        entityId: dni.toString(),
        description: `Solicitud de foto para niño con dni=${dni}`,
        oldState: null,
        newState: { photoRequested: true }
      });
    } catch (auditErr) {
      console.error("❌ Error al registrar auditoría de foto:", auditErr);
    }

    if (results.length === 0 || !results[0].photo) {
      return res.json({ photo: null });
    }

    const base64Photo = Buffer.from(results[0].photo).toString("base64");
    res.json({ photo: `data:image/jpeg;base64,${base64Photo}` });
  } catch (err) {
    console.error("❌ Error en /api/children/:dni/photo:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error en la base de datos" });
  } finally {
    conn.release();
  }
};

exports.updatePhoto = async (req, res) => {
  const cnumber = req.body.cnumber;
  const photo = req.file ? req.file.buffer : null;

  if (!cnumber || !photo) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  const conn = await pool.getConnection();

  try {
    // 🔎 Obtener la foto anterior para auditoría
    const [existingRows] = await conn.execute(
      "SELECT photo FROM mgifixed WHERE dni = ? LIMIT 1",
      [cnumber]
    );
    const oldPhoto = existingRows.length > 0 ? existingRows[0].photo : null;

    // 🔹 Actualizar la foto
    await conn.execute("UPDATE mgifixed SET photo = ? WHERE dni = ?", [
      photo,
      cnumber
    ]);

    // 🧾 Auditoría usando auditAction
    await auditAction({
      req,
      actor: req.user,
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.PHOTO,
      entityId: cnumber,
      description: "Actualización de la fotografía del niño",
      oldState: { photo: oldPhoto ? "[BINARY DATA]" : null },
      newState: { photo: "[BINARY DATA]" },
      metadata: { table: "mgifixed" }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al actualizar foto:", err);

    // Auditoría de error
    await auditAction({
      req,
      actor: req.user,
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.PHOTO,
      entityId: cnumber,
      description: "Error al actualizar la fotografía del niño",
      metadata: { table: "mgifixed", error: err.message }
    });

    res
      .status(500)
      .json({ success: false, message: "Error al actualizar la foto" });
  } finally {
    conn.release();
  }
};

exports.countMgivarByDni = async (req, res) => {
  const { dni } = req.body;

  if (!dni || typeof dni !== "string") {
    return res.status(400).json({
      success: false,
      message: "DNI requerido"
    });
  }

  const conn = await pool.getConnection();

  try {
    const [result] = await conn.execute(
      "SELECT COUNT(*) as count FROM mgivar WHERE dni = ?",
      [dni]
    );

    const count = result[0].count;

    res.json({
      success: true,
      dni,
      count, // Ej: 3
      message: `Encontrados ${count} registros para DNI ${dni}`
    });
  } catch (err) {
    console.error("Error contando mgivar:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    conn.release();
  }
};

exports.delMgivarById = async (req, res) => {
  let conn;
  let userid;

  try {
    const mgivarId = Number.parseInt(req.params.id);
    if (Number.isNaN(mgivarId) || mgivarId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "ID mgivar inválido" });
    }

    userid = req.user?.username || req.body.userid;
    if (!userid) {
      return res
        .status(400)
        .json({ success: false, message: "Usuario no definido" });
    }

    conn = await pool.getConnection();

    // 1️⃣ Verificar si el mgivar existe
    const [rows] = await conn.execute(
      `SELECT id, dni, cage, province, municipality, username 
       FROM mgivar WHERE id = ?`,
      [mgivarId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Mgivar no encontrado" });
    }

    const mgivar = rows[0];

    // 2️⃣ ✅ CASCADE ya borra todas las tablas hijas AUTOMÁTICAMENTE
    await conn.execute(`DELETE FROM mgivar WHERE id = ?`, [mgivarId]);

    // 3️⃣ Registrar AUDITORÍA (igual que deletealarmas)
    await auditAction({
      req,
      actor: { username: userid },
      action: AUDIT_ACTIONS.DELETE,
      entity: AUDIT_ENTITIES.ME31,
      entityId: mgivarId,
      description: `Mgivar eliminado: DNI "${mgivar.dni}" (${mgivar.province} - ${mgivar.municipality})`,
      metadata: {
        dni: mgivar.dni,
        cage: mgivar.cage,
        province: mgivar.province,
        municipality: mgivar.municipality
      }
    });

    res.json({
      success: true,
      message: `Mgivar ${mgivarId} (DNI: ${mgivar.dni}) eliminado correctamente. Todas las tablas hijas borradas por CASCADE.`
    });
  } catch (err) {
    console.error("❌ DELETE MGIVAR ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.getMgiFixedByDni = async (req, res) => {
  const conn = await pool.getConnection();
  const { dni } = req.params;

  try {
    const [rows] = await conn.execute(
      "SELECT fullname FROM mgifixed WHERE dni = ? LIMIT 1",
      [dni]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No existe un registro con ese DNI"
      });
    }

    return res.json({
      success: true,
      dni,
      fullname: rows[0].fullname
    });
  } catch (err) {
    console.error("❌ Error en /api/mgifixed/:dni:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.delMgiFixedByDni = async (req, res) => {
  let conn;
  let userid;

  try {
    const dni = req.params.dni.trim();
    if (!dni || dni.length < 11) {
      return res.status(400).json({ success: false, message: "DNI inválido" });
    }

    userid = req.user?.username || req.body.userid;
    if (!userid) {
      return res
        .status(400)
        .json({ success: false, message: "Usuario no definido" });
    }

    conn = await pool.getConnection();

    // 1️⃣ Verificar si el mgifixed existe
    const [rows] = await conn.execute(
      `SELECT dni, fullname, birthdate, sex, skincolor, username 
       FROM mgifixed WHERE dni = ?`,
      [dni]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Mgifixed no encontrado" });
    }

    const mgifixed = rows[0];

    // 2️⃣ ✅ CASCADE borra mgivar → CASCADE borra TODAS las tablas hijas
    await conn.execute(`DELETE FROM mgifixed WHERE dni = ?`, [dni]);

    // 3️⃣ Registrar AUDITORÍA (misma estructura deletealarmas)
    await auditAction({
      req,
      actor: { username: userid },
      action: AUDIT_ACTIONS.DELETE,
      entity: AUDIT_ENTITIES.ME21,
      entityId: dni,
      description: `Mgifixed eliminado: "${mgifixed.fullname}" (${mgifixed.dni})`,
      metadata: {
        dni: mgifixed.dni,
        fullname: mgifixed.fullname,
        sex: mgifixed.sex,
        skincolor: mgifixed.skincolor
      }
    });

    res.json({
      success: true,
      message: `Mgifixed ${dni} ("${mgifixed.fullname}") eliminado. Todas las tablas relacionadas borradas por CASCADE.`
    });
  } catch (err) {
    console.error("❌ DELETE MGIFIXED ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.batchMgiFixed = async (req, res) => {
  const conn = await pool.getConnection();
  const { dnis } = req.body; // Esperamos: { dnis: ["14032532026","18081450203", ...] }

  if (!Array.isArray(dnis) || dnis.length === 0) {
    conn.release();
    return res.status(400).json({
      success: false,
      message: "Se requiere un array de DNIs"
    });
  }

  try {
    // Ejecutar una sola query usando IN (?) para todos los DNIs
    const [rows] = await conn.query(
      "SELECT dni, fullname FROM mgifixed WHERE dni IN (?)",
      [dnis]
    );

    // Mapear los resultados para devolver todos los DNIs solicitados
    // Si algún DNI no existe, le ponemos 'Nombre no encontrado'
    const resultados = dnis.map((dni) => {
      const fila = rows.find((r) => r.dni === dni);
      return { dni, fullname: fila ? fila.fullname : "Nombre no encontrado" };
    });

    return res.json(resultados);
  } catch (err) {
    console.error("❌ Error en /api/mgifixed/batch:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};
