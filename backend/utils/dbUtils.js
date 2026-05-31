const { pool } = require("../config/db");
const {
  auditAction,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES
} = require("../middlewares/audit");

async function runQuery(sql, params = [], req = null, user = null) {
  // Ejecutar la consulta
  const [rows] = await pool.execute(sql, params);

  try {
    // Detectar tipo de acción
    const lower = sql.trim().toLowerCase();
    let action = null;
    if (lower.startsWith("insert")) action = AUDIT_ACTIONS.CREATE;
    else if (lower.startsWith("update")) action = AUDIT_ACTIONS.UPDATE;
    else if (lower.startsWith("delete")) action = AUDIT_ACTIONS.DELETE;
    else if (lower.startsWith("select")) action = AUDIT_ACTIONS.READ_SENSITIVE;

    // Detectar tabla
    const match = lower.match(/(?:from|into|update)\s+`?([a-z0-9_]+)`?/);
    const table = match ? match[1] : null;

    // Mapear tabla a entidad de auditoría (si existe)
    let entity = table
      ? AUDIT_ENTITIES[table.toUpperCase()] || table
      : "Desconocido";

    // Intentar obtener entityId si hay un parámetro
    let entityId = null;
    if (params.length === 1) {
      entityId = params[0] != null ? params[0].toString() : null;
    }

    // Registrar auditoría solo si es acción sensible
    if (action && entity && entity !== "audit_event") {
      await auditAction({
        req,
        actor: user,
        action,
        entity,
        entityId,
        description: sql,
        metadata: { params }
      });
    }
  } catch (auditErr) {
    console.error("Error registrando auditoría en runQuery:", auditErr.message);
  }

  return [rows];
}

module.exports = { runQuery };
