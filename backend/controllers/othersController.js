// controllers/othersController.js
const { pool } = require("../config/db");
const { auditAction, AUDIT_ACTIONS } = require("../middlewares/audit");

const { sendEmail } = require("../config/mailer");

exports.contact = async (req, res) => {
  const { nombre, correo, asunto, mensaje } = req.body;

  if (!nombre || !correo || !asunto || !mensaje) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const subject = `📩 ${asunto} (de ${nombre})`;
    const text = `De: ${nombre} (${correo})\nAsunto: ${asunto}\n\n${mensaje}`;

    await sendEmail(process.env.EMAIL_USER, correo, subject, text);

    await auditAction({
      req,
      actor: { username: nombre || "Invitado" },
      action: AUDIT_ACTIONS.CREATE,
      entity: "Contacto",
      description: "Se envió un mensaje desde el formulario de contacto",
      extra: { correo, asunto, mensaje }
    });

    await conn.commit();
    res.json({ message: "✅ Mensaje enviado correctamente" });
  } catch (error) {
    await conn.rollback();
    console.error("Error al enviar el correo:", error);
    res.status(500).json({ error: "Error al enviar el mensaje" });
  } finally {
    conn.release();
  }
};

exports.workflowEstadoActual = async (req, res) => {
  const conn = await pool.getConnection();
  const { filtroActivo } = req.body;

  try {
    // 1. Construir filtro para la consulta principal
    let whereConditions = [];
    let params = [];

    if (filtroActivo?.scope === "CDO" && filtroActivo.value) {
      // Para CDO: filtrar por municipio
      // Si viene como "Provincia::Municipio" (nivel nacional)
      if (filtroActivo.value.includes("::")) {
        const [provincia, municipio] = filtroActivo.value.split("::");
        whereConditions.push("g.province = ?");
        whereConditions.push("g.municipality = ?");
        params.push(provincia, municipio);
      } else {
        whereConditions.push("g.municipality = ?");
        params.push(filtroActivo.value);
      }
    } else if (filtroActivo?.scope === "PROVINCIA" && filtroActivo.value) {
      whereConditions.push("g.province = ?");
      params.push(filtroActivo.value);
    } else if (filtroActivo?.scope === "Todos") {
      // Sin filtro - traer todos
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    // 1. Obtener DNIs únicos de mgifixed que EXISTEN en mgivar (filtrados)
    const [fixedRows] = await conn.execute(
      `
      SELECT DISTINCT f.dni 
      FROM mgifixed f
      INNER JOIN mgivar g ON f.dni = g.dni
      ${whereClause}
      ORDER BY f.dni
    `,
      params
    );

    const resultados = [];
    const mapeoTablaCodigo = {
      mgivar: "2.1",
      me3_1_1: "3.1.1",
      me3_2_1: "3.2.1",
      me3_2_2: "3.2.2",
      me3_2_3: "3.2.3",
      me3_3_1: "3.3.1",
      me3_3_2: "3.3.2",
      me3_3_3: "3.3.3",
      me3_4: "3.4",
      mrrp41: "4.1",
      mrrp42: "4.2",
      mrrp43: "4.3",
      mrrp44: "4.4"
    };

    // 2. Para cada DNI, determinar hasta dónde llegó
    for (const row of fixedRows) {
      const { dni } = row;

      // Obtener TODOS los mgivar IDs para este DNI
      const [mgivarRows] = await conn.execute(
        `SELECT id FROM mgivar WHERE dni = ? ORDER BY id`,
        [dni]
      );

      if (mgivarRows.length === 0) {
        resultados.push({
          dni,
          hastaDondeLlego: "2.1",
          savedate: null,
          mgivarId: null
        });
        continue;
      }

      // Para cada mgivar ID de este DNI
      for (const mgivarRow of mgivarRows) {
        const mgivarId = mgivarRow.id;
        let tablaCompletada = "mgivar";
        let savedateUltimaTabla = null;

        const steps = [
          { table: "me3_1_1" },
          { table: "me3_2_1" },
          { table: "me3_2_2" },
          { table: "me3_2_3" },
          { table: "me3_3_1" },
          { table: "me3_3_2" },
          { table: "me3_3_3" },
          { table: "me3_4" },
          { table: "mrrp41" },
          { table: "mrrp42" },
          { table: "mrrp43" },
          { table: "mrrp44" }
        ];

        // Verificar paso a paso qué tablas tiene completadas
        for (const step of steps) {
          const [stepRows] = await conn.execute(
            `SELECT savedate FROM \`${step.table}\` WHERE dni = ? AND id = ? LIMIT 1`,
            [dni, mgivarId]
          );

          if (stepRows.length > 0) {
            tablaCompletada = step.table;
            savedateUltimaTabla = stepRows[0].savedate;
          } else {
            break; // Se detuvo en este paso
          }
        }

        const codigoFinal = mapeoTablaCodigo[tablaCompletada] || "2.1";

        resultados.push({
          dni,
          mgivarId,
          hastaDondeLlego: codigoFinal,
          savedate: savedateUltimaTabla
        });
      }
    }

    return res.json({
      success: true,
      total: resultados.length,
      resultados,
      filtroUsado: filtroActivo // Para debug frontend
    });
  } catch (err) {
    console.error("❌ Error en /api/workflow/estado-actual:", err.message);
    console.error("Stack:", err.stack);
    return res.status(500).json({
      success: false,
      error: err.message,
      filtro: filtroActivo
    });
  } finally {
    conn.release();
  }
};
