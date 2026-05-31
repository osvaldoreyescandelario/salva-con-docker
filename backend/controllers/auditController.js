const { pool } = require("../config/db");
const {
  auditAction,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES
} = require("../middlewares/audit");

// --- Exporta todas las funciones ---
exports.getAuditEvents = async (req, res) => {
  const { actor_id, entity, action } = req.query;
  const auditActor = actor_id || "system";
  const conn = await pool.getConnection();

  try {
    let sql = `SELECT created_at, actor_id, ip, action, entity, description FROM audit_event WHERE 1=1`;
    const params = [];
    if (actor_id) {
      sql += " AND actor_id=?";
      params.push(actor_id);
    }
    if (entity) {
      sql += " AND entity=?";
      params.push(entity);
    }
    if (action) {
      sql += " AND action=?";
      params.push(action);
    }
    sql += " ORDER BY created_at DESC LIMIT 1000";

    const [rows] = await conn.execute(sql, params);

    await auditAction({
      actor: { username: auditActor },
      action: AUDIT_ACTIONS.SELECT,
      entity: AUDIT_ENTITIES.AUDIT_EVENT,
      description: "Consulta de eventos de auditoría",
      newState: { filtros: { actor_id, entity, action } }
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.exportAudit = async (req, res) => {
  const conn = await pool.getConnection();
  const { actor_id, entity, action } = req.query;
  const auditActor = actor_id || "system";

  try {
    let sql = `
      SELECT created_at, actor_id, ip, action, entity, description
      FROM audit_event
      WHERE 1=1
    `;
    const params = [];
    if (actor_id) {
      sql += " AND actor_id=?";
      params.push(actor_id);
    }
    if (entity) {
      sql += " AND entity=?";
      params.push(entity);
    }
    if (action) {
      sql += " AND action=?";
      params.push(action);
    }
    sql += " ORDER BY created_at DESC";

    const [rows] = await conn.execute(sql, params);

    if (rows.length === 0)
      return res.status(404).send("No hay registros para exportar.");

    const header =
      ["created_at", "actor_id", "ip", "action", "entity", "description"].join(
        ","
      ) + "\n";
    const data = rows
      .map((r) =>
        [
          r.created_at,
          r.actor_id,
          r.ip,
          r.action,
          r.entity,
          `"${(r.description || "").replaceAll(/"/g, '""')}"` //antes era replace
        ].join(",")
      )
      .join("\n");

    // Registrar auditoría de exportación en otra conexión
    await auditAction({
      actor: { username: auditActor },
      action: AUDIT_ACTIONS.SELECT,
      entity: AUDIT_ENTITIES.AUDIT_EVENT,
      description: "Exportación de auditoría en CSV",
      newState: {
        filtros: { actor_id, entity, action },
        registros: rows.length
      }
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=audit_event.csv"
    );
    res.setHeader("Content-Type", "text/csv");
    res.send(header + data);
  } catch (err) {
    console.error("❌ Error exportando auditoría:", err);
    res.status(500).send("Error exportando CSV");
  } finally {
    conn.release();
  }
};

exports.clearLogs = async (req, res) => {
  const conn = await pool.getConnection();
  const auditActor = req.query.actor_id || req.user?.username || "system";

  try {
    // 1️⃣ Contar registros antes de truncar
    const [rows] = await conn.execute(
      "SELECT COUNT(*) AS total FROM audit_event"
    );
    const total = rows[0].total;

    if (total === 0) {
      return res.json({
        success: true,
        message: "No hay trazas que borrar."
      });
    }

    // 2️⃣ Registrar auditoría en otra conexión antes de borrar
    await auditAction({
      actor: { username: auditActor },
      action: "DELETE",
      entity: "AUDIT_EVENT",
      description: `Se eliminarán todas las trazas de auditoría`,
      oldState: { total },
      newState: null
    });

    // 3️⃣ Borrar todas las trazas usando TRUNCATE (rápido)
    await conn.execute("TRUNCATE TABLE audit_event");

    res.json({
      success: true,
      message: `✅ ${total} trazas eliminadas correctamente.`
    });
  } catch (err) {
    console.error("❌ Error en /api/audit/clearlogs:", err);
    res
      .status(500)
      .json({ success: false, message: "Error al borrar todas las trazas." });
  } finally {
    conn.release();
  }
};

exports.deleteAuditById = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 🔹 Buscar el registro a borrar
    const [rows] = await conn.execute(
      "SELECT * FROM audit_event WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      await conn.commit();
      return res
        .status(404)
        .json({ success: false, message: "Registro no encontrado." });
    }

    const oldRecord = rows[0];

    // 🔹 Borrar el registro
    await conn.execute("DELETE FROM audit_event WHERE id = ?", [id]);

    // 🔹 Registrar auditoría de borrado
    await auditAction({
      req,
      actor: { username: req.user?.username || "system" },
      action: "DELETE",
      entity: "AUDIT_EVENT",
      entityId: id.toString(),
      description: `Se eliminó el registro de auditoría con ID ${id}`,
      oldState: oldRecord,
      newState: null
    });

    await conn.commit();
    res.json({ success: true, message: `Registro con ID ${id} eliminado.` });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/audit/:id:", err);
    res.status(500).json({
      success: false,
      message: "Error al borrar registro individual."
    });
  } finally {
    conn.release();
  }
};
