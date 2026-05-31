const { pool } = require("../config/db");
const {
  auditAction,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES
} = require("../middlewares/audit");

// Funciones auxiliares (antes estaban globales)
function getScopeDisplay(type, valor) {
  const map = {
    self: "Solo para mí",
    municipio: valor ? `Municipio ${valor}` : "Mi municipio",
    provincia: valor ? `Provincia ${valor}` : "Mi provincia",
    global: "Todos los usuarios",
    rol: valor ? `Rol ${valor}` : "Por rol"
  };
  return map[type] || "General";
}

function formatTimeAgo(minutes) {
  const m = Number.parseInt(minutes);
  if (m < 1) return "Ahora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} días`;
}

exports.getContador = async (req, res) => {
  const userid = req.query.userid || req.user?.username;
  if (!userid)
    return res
      .status(400)
      .json({ success: false, message: "Usuario no definido" });

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT COUNT(*) AS unread FROM alarms_users au JOIN alarms a ON a.ida = au.alarms_ida WHERE au.userid = ? AND au.read = 0 AND a.active = 1 AND au.scheduledate <= NOW() AND (a.endingdate IS NULL OR a.endingdate >= NOW())`,
      [userid]
    );
    res.json({ success: true, unread: Number(rows[0]?.unread || 0) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.getLista = async (req, res) => {
  let conn;
  try {
    const userid = req.query.userid || req.user?.username;

    // Sanitizar y asegurar límite válido
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const safeLimit =
      Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 50
        ? rawLimit
        : 10;

    if (!userid) {
      return res.status(400).json({
        success: false,
        message: "Usuario no definido"
      });
    }

    conn = await pool.getConnection();

    // ⚠️ LIMIT interpolado intencionalmente (MySQL no admite LIMIT ?)
    const [rows] = await conn.execute(
      `
      SELECT 
        au.id,
        au.read,
        au.scheduledate,
        a.title,
        a.msg,
        a.type,
        a.scope_type,
        a.scope_valor
      FROM alarms_users au
      JOIN alarms a ON a.ida = au.alarms_ida
      WHERE au.userid = ?
        AND a.active = 1
        AND au.scheduledate <= NOW()
        AND (a.endingdate IS NULL OR a.endingdate >= NOW())
      ORDER BY au.scheduledate DESC
      LIMIT ${safeLimit}
      `,
      [userid]
    );

    const data = rows.map((row) => {
      const minutesAgo = row.scheduledate
        ? Math.round((Date.now() - new Date(row.scheduledate)) / 60000)
        : 0;

      return {
        id: row.id,
        title: row.title,
        message: row.msg,
        type: row.type,
        read: Boolean(row.read),
        scope_display: getScopeDisplay(row.scope_type, row.scope_valor),
        time_ago: formatTimeAgo(minutesAgo)
      };
    });

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("LISTA ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    if (conn) conn.release();
  }
};

exports.leerAlarma = async (req, res) => {
  let conn;
  let userid;

  try {
    // 1. Validar ID de alarms_users
    const alarmUserId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(alarmUserId) || alarmUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: `ID inválido: ${req.params.id}`
      });
    }

    // 2. Usuario
    userid = req.body.userid || req.user?.username || req.query.userid;
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: "Usuario no definido"
      });
    }

    conn = await pool.getConnection();

    // 3. Obtener alarms_ida asociado (y validar pertenencia)
    const [[alarmRow]] = await conn.execute(
      `SELECT alarms_ida, \`read\`
       FROM alarms_users
       WHERE id = ? AND userid = ?`,
      [alarmUserId, userid]
    );

    if (!alarmRow) {
      return res.status(404).json({
        success: false,
        message: "Alarma no encontrada para este usuario"
      });
    }

    // 4. Marcar como leída (solo si no lo estaba)
    let affectedRows = 0;
    if (alarmRow.read === 0) {
      const [updateResult] = await conn.execute(
        `UPDATE alarms_users
         SET \`read\` = 1, readdate = NOW()
         WHERE id = ?`,
        [alarmUserId]
      );
      affectedRows = updateResult.affectedRows;
    }

    const alarmsId = alarmRow.alarms_ida;

    // 5. Verificar si quedan usuarios pendientes
    const [[{ pendientes }]] = await conn.execute(
      `SELECT COUNT(*) AS pendientes
       FROM alarms_users
       WHERE alarms_ida = ? AND \`read\` = 0`,
      [alarmsId]
    );

    if (pendientes === 0) {
      await conn.execute(`UPDATE alarms SET active = 0 WHERE ida = ?`, [
        alarmsId
      ]);
    }

    // 6. Auditoría éxito (ID CORRECTO)
    await auditAction({
      req,
      actor: { username: userid },
      action: AUDIT_ACTIONS.ALARM_READ,
      entity: AUDIT_ENTITIES.ALARM,
      entityId: alarmsId,
      description: `Alarma ${alarmsId} marcada como leída`,
      metadata: {
        alarmUserId,
        affectedRows,
        pendientesRestantes: pendientes
      }
    });

    res.json({
      success: true,
      affectedRows,
      alarmId: alarmsId,
      pendientesRestantes: pendientes
    });
  } catch (err) {
    console.error("❌ LEER ERROR:", err.message);

    // Auditoría error (si hay usuario)
    if (userid) {
      try {
        await auditAction({
          req,
          actor: { username: userid },
          action: AUDIT_ACTIONS.ALARM_READ,
          entity: AUDIT_ENTITIES.ALARM,
          description: "Error al marcar alarma como leída",
          metadata: { error: err.message }
        });
      } catch (_) {}
    }

    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    if (conn) conn.release();
  }
};

exports.alarmasleerTodas = async (req, res) => {
  let conn;
  let userid;

  try {
    userid = req.body.userid || req.user?.username || req.query.userid;
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: "Usuario no definido"
      });
    }

    conn = await pool.getConnection();

    // 1️⃣ Marcar como leídas SOLO alarmas vigentes
    const [updateResult] = await conn.execute(
      `
      UPDATE alarms_users au
      JOIN alarms a ON a.ida = au.alarms_ida
      SET au.\`read\` = 1,
          au.readdate = NOW()
      WHERE au.userid = ?
        AND au.\`read\` = 0
        AND a.active = 1
        AND a.startdate <= NOW()
        AND (a.endingdate IS NULL OR a.endingdate >= NOW())
      `,
      [userid]
    );

    // 2️⃣ Alarmas vigentes afectadas
    const [alarmsAffected] = await conn.execute(
      `
      SELECT DISTINCT au.alarms_ida
      FROM alarms_users au
      JOIN alarms a ON a.ida = au.alarms_ida
      WHERE au.userid = ?
        AND a.active = 1
      `,
      [userid]
    );

    // 3️⃣ Desactivar alarmas solo si ya no quedan pendientes
    for (const row of alarmsAffected) {
      const [[{ pendientes }]] = await conn.execute(
        `
        SELECT COUNT(*) AS pendientes
        FROM alarms_users au
        JOIN alarms a ON a.ida = au.alarms_ida
        WHERE au.alarms_ida = ?
          AND au.\`read\` = 0
          AND a.active = 1
          AND a.startdate <= NOW()
          AND (a.endingdate IS NULL OR a.endingdate >= NOW())
        `,
        [row.alarms_ida]
      );

      if (pendientes === 0) {
        await conn.execute(`UPDATE alarms SET active = 0 WHERE ida = ?`, [
          row.alarms_ida
        ]);
      }
    }

    // 4️⃣ Auditoría correcta
    await auditAction({
      req,
      actor: { username: userid },
      action: AUDIT_ACTIONS.ALARM_READ_ALL,
      entity: AUDIT_ENTITIES.ALARM,
      description: "Todas las alarmas vigentes marcadas como leídas",
      metadata: {
        affectedRows: updateResult.affectedRows,
        userid
      }
    });

    res.json({
      success: true,
      affectedRows: updateResult.affectedRows
    });
  } catch (err) {
    console.error("❌ TODAS LEER ERROR:", err.message);

    if (userid) {
      try {
        await auditAction({
          req,
          actor: { username: userid },
          action: AUDIT_ACTIONS.ALARM_READ_ALL,
          entity: AUDIT_ENTITIES.ALARM,
          description: "Error al marcar alarmas como leídas",
          metadata: { error: err.message, userid }
        });
      } catch (_) {}
    }

    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    if (conn) conn.release();
  }
};

exports.crearAlarma = async (req, res) => {
  let conn;
  let userid;

  try {
    const {
      title,
      msg,
      type,
      scope_type,
      scope_valor,
      username,
      startdate,
      endingdate
    } = req.body;

    if (!title || !msg || !type || !scope_type || !startdate || !endingdate) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos"
      });
    }

    userid = req.user?.username || username || req.body.userid;
    if (!userid) {
      return res
        .status(400)
        .json({ success: false, message: "Usuario no definido" });
    }

    conn = await pool.getConnection();

    // Convertir las fechas a formato MySQL
    const formatMySQLDate = (d) =>
      d ? new Date(d).toISOString().slice(0, 19).replaceAll("T", " ") : null; //antes era replace

    // Insertar alarma principal con startdate y endingdate del frontend
    const [alarmResult] = await conn.execute(
      `INSERT INTO alarms 
        (title, msg, type, startdate, endingdate, scope_type, scope_valor, username, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        title,
        msg,
        type,
        formatMySQLDate(startdate),
        formatMySQLDate(endingdate),
        scope_type,
        scope_valor || null,
        userid
      ]
    );

    const alarmsId = alarmResult.insertId;
    let affectedRows = 0;
    let usuariosAfectados = [];

    // ======== LOGICA DE scope_type (igual que antes, sin cambios) ========
    if (scope_type === "self") {
      await conn.execute(
        `INSERT INTO alarms_users (alarms_ida, userid, scheduledate, \`read\`) 
         VALUES (?, ?, NOW(), 0)`,
        [alarmsId, userid]
      );
      affectedRows = 1;
      usuariosAfectados.push(userid);
    } else if (scope_type === "municipio") {
      if (!scope_valor)
        throw new Error("Falta municipio para scope_type='municipio'");
      const [usersResult] = await conn.execute(
        `SELECT userid FROM users WHERE municipality = ? AND active = 1`,
        [scope_valor]
      );
      for (const u of usersResult) {
        await conn.execute(
          `INSERT IGNORE INTO alarms_users (alarms_ida, userid, scheduledate, \`read\`) 
           VALUES (?, ?, NOW(), 0)`,
          [alarmsId, u.userid]
        );
      }
      affectedRows = usersResult.length;
      usuariosAfectados = usersResult.map((u) => u.userid);
    } else if (scope_type === "provincia") {
      if (!scope_valor)
        throw new Error("Falta provincia para scope_type='provincia'");
      const [usersResult] = await conn.execute(
        `SELECT userid FROM users WHERE province = ? AND active = 1`,
        [scope_valor]
      );
      for (const u of usersResult) {
        await conn.execute(
          `INSERT IGNORE INTO alarms_users (alarms_ida, userid, scheduledate, \`read\`) 
           VALUES (?, ?, NOW(), 0)`,
          [alarmsId, u.userid]
        );
      }
      affectedRows = usersResult.length;
      usuariosAfectados = usersResult.map((u) => u.userid);
    } else if (scope_type === "global") {
      const [usersResult] = await conn.execute(
        `SELECT userid FROM users WHERE active = 1`
      );
      for (const u of usersResult) {
        await conn.execute(
          `INSERT IGNORE INTO alarms_users (alarms_ida, userid, scheduledate, \`read\`) 
           VALUES (?, ?, NOW(), 0)`,
          [alarmsId, u.userid]
        );
      }
      affectedRows = usersResult.length;
      usuariosAfectados = usersResult.map((u) => u.userid);
    } else if (scope_type === "rol") {
      if (!scope_valor)
        throw new Error("Debes indicar el rol destino para scope_type='rol'");
      const [roleUsers] = await conn.execute(
        `
        SELECT DISTINCT aur.userid 
        FROM auxusersrol aur 
        JOIN auxrols r ON aur.rol_id = r.idr 
        WHERE r.name = ?`,
        [scope_valor]
      );
      for (const u of roleUsers) {
        await conn.execute(
          `INSERT IGNORE INTO alarms_users (alarms_ida, userid, scheduledate, \`read\`) 
           VALUES (?, ?, NOW(), 0)`,
          [alarmsId, u.userid]
        );
      }
      affectedRows = roleUsers.length;
      usuariosAfectados = roleUsers.map((u) => u.userid);
    } else {
      throw new Error(`scope_type inválido: ${scope_type}`);
    }

    // Auditoría
    await auditAction({
      req,
      actor: { username: userid },
      action: AUDIT_ACTIONS.ALARM_CREATE,
      entity: AUDIT_ENTITIES.ALARM,
      entityId: alarmsId,
      description: `Alarma creada: "${title}" (${type}) alcance=${scope_type}`,
      metadata: {
        affectedUsers: affectedRows,
        usuariosAfectados: usuariosAfectados.slice(0, 10)
      }
    });

    res.json({ success: true, alarmId: alarmsId, affectedUsers: affectedRows });
  } catch (err) {
    console.error("❌ CREAR ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.contadores = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    // 1. Contar activas (active=1)
    const [activas] = await conn.execute(
      `SELECT COUNT(*) as total 
       FROM alarms 
       WHERE active = 1`
    );

    // 2. Contar leídas (active=0)
    const [leidas] = await conn.execute(
      `SELECT COUNT(*) as total 
       FROM alarms 
       WHERE active = 0`
    );

    // 3. Contar emitidas HOY (DATE(created_at) = CURDATE())
    const [hoy] = await conn.execute(
      `SELECT COUNT(*) as total 
       FROM alarms 
       WHERE DATE(created_at) = CURDATE()`
    );

    res.json({
      success: true,
      data: {
        activas: activas[0].total,
        leidas: leidas[0].total,
        hoy: hoy[0].total
      }
    });
  } catch (err) {
    console.error("CONTADORES ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.alarmasadmin = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.execute(`
      SELECT 
        ida,
        title,
        msg,
        type,
        DATE(created_at) as date,
        CASE 
          WHEN active = 1 THEN 'Pendiente'
          WHEN active = 0 THEN 'Leída'
          ELSE 'Desconocido'
        END as state,
        startdate,
        endingdate,
        daysinterval,
        scope_type,
        scope_valor
      FROM alarms 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error("ALARMAS ADMIN ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.alarmasusuarios = async (req, res) => {
  let conn;
  try {
    const { ida } = req.params;

    if (!ida) {
      return res.status(400).json({
        success: false,
        message: "IDA de alarma requerido"
      });
    }

    conn = await pool.getConnection();

    const [rows] = await conn.execute(
      `
      SELECT
        userid,
        \`read\`,
        readdate
      FROM alarms_users
      WHERE alarms_ida = ?
      ORDER BY userid
    `,
      [ida]
    );

    // 🔁 Normalizar datos para el frontend
    const data = rows.map((r) => ({
      userid: r.userid,
      read: r.read === 1 ? "Sí" : "No",
      readdate: r.read === 1 ? r.readdate : null
    }));

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("❌ ALARMS_USERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    if (conn) conn.release();
  }
};

exports.alarmasauditoria = async (req, res) => {
  const { ida } = req.params;
  let conn;

  try {
    conn = await pool.getConnection();

    // Traemos los eventos de auditoría de la alarma, eliminando duplicados exactos
    const [rows] = await conn.execute(
      `
      SELECT DISTINCT 
        created_at AS date,
        actor_id AS actor,
        action,
        description
      FROM audit_event
      WHERE entity = 'alarm' AND entity_id = ?
      ORDER BY created_at DESC
    `,
      [ida]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error cargando auditoría de alarma:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.updatealarmas = async (req, res) => {
  const { ida } = req.params;
  const { title, msg, type, endingdate, daysinterval, username } = req.body;
  let conn;

  if (!ida) {
    return res
      .status(400)
      .json({ success: false, message: "ID de alarma requerido" });
  }

  try {
    conn = await pool.getConnection();

    // Primero verificamos que la alarma exista y esté activa
    const [alarmRows] = await conn.execute(
      "SELECT * FROM alarms WHERE ida = ? AND active = 1",
      [ida]
    );

    if (!alarmRows.length) {
      return res.status(400).json({
        success: false,
        message: "Alarma no encontrada o ya no está activa"
      });
    }

    const alarma = alarmRows[0];

    // Actualizar solo los campos permitidos
    const [updateResult] = await conn.execute(
      `UPDATE alarms SET 
                title = ?, 
                msg = ?, 
                type = ?, 
                endingdate = ?, 
                daysinterval = ? 
             WHERE ida = ? AND active = 1`,
      [
        title || alarma.title,
        msg || alarma.msg,
        type || alarma.type,
        endingdate || alarma.endingdate,
        daysinterval || alarma.daysinterval,
        ida
      ]
    );

    // Auditoría
    await auditAction({
      req,
      actor: { username: username || "desconocido" },
      action: AUDIT_ACTIONS.ALARM_UPDATE,
      entity: AUDIT_ENTITIES.ALARM,
      entityId: ida,
      description: `Alarma actualizada: "${title}" (${type})`,
      metadata: {
        updatedFields: ["title", "msg", "type", "endingdate", "daysinterval"]
      }
    });

    res.json({
      success: true,
      message: "Alarma actualizada correctamente",
      updatedRows: updateResult.affectedRows
    });
  } catch (err) {
    console.error("❌ ERROR actualizar alarma:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.deletealarmas = async (req, res) => {
  let conn;
  let userid;

  try {
    const ida = Number.parseInt(req.params.ida);
    if (Number.isNaN(ida) || ida <= 0) {
      return res.status(400).json({ success: false, message: "ID inválido" });
    }

    userid = req.user?.username || req.body.userid;
    if (!userid) {
      return res
        .status(400)
        .json({ success: false, message: "Usuario no definido" });
    }

    conn = await pool.getConnection();

    // 1️⃣ Verificar si la alarma existe y si está activa
    const [rows] = await conn.execute(`SELECT * FROM alarms WHERE ida = ?`, [
      ida
    ]);

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Alarma no encontrada" });
    }

    const alarma = rows[0];

    if (alarma.active !== 0) {
      return res.status(403).json({
        success: false,
        message: "No se puede borrar una alarma activa"
      });
    }

    // 2️⃣ Borrar la alarma
    await conn.execute(`DELETE FROM alarms WHERE ida = ?`, [ida]);

    // 3️⃣ Registrar auditoría (igual estilo que tu POST)
    await auditAction({
      req,
      actor: { username: userid },
      action: AUDIT_ACTIONS.ALARM_DELETE,
      entity: AUDIT_ENTITIES.ALARM,
      entityId: ida,
      description: `Alarma eliminada: "${alarma.title}" (${alarma.type})`,
      metadata: {
        scope_type: alarma.scope_type,
        scope_valor: alarma.scope_valor
      }
    });

    res.json({ success: true, message: "Alarma eliminada correctamente" });
  } catch (err) {
    console.error("❌ DELETE ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};
