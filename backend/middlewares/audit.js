// middlewares/audit.js
const { pool } = require("../config/db");

// Constantes globales de auditoría
const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  SELECT: "SELECT", // <--- agregado
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PERMISSION_CHANGE: "PERMISSION_CHANGE",
  READ_SENSITIVE: "READ_SENSITIVE",
  ALARM_CREATE: "alarm_create",
  ALARM_READ: "alarm_read",
  ALARM_READ_ALL: "alarm_read_all",
  ALARM_UPDATE: "alarm_update",
  ALARM_DELETE: "alarm_delete"
};

const AUDIT_ENTITIES = {
  USER: "Usuario",
  ROLE: "Rol",
  PERMISSION: "Permiso",

  CHILD: "mgifixed-mgivar",
  EXPEDIENT: "Expediente",

  ME21: "Formulario ME2.1",
  ME31: "Formulario ME3.1",
  ME32: "Formulario ME3.2",
  ME33: "Formulario ME3.3",
  ME34: "Formulario ME3.4",

  PHOTO: "Fotografía",

  MRRP41: "Formulario MRRP4.1",
  MRRP42: "Formulario MRRP4.2",

  AUDIT_EVENT: "AUDIT_EVENT",

  USERS: "users",

  ALARM: "alarm"
};

// async function auditAction({
//   req = null,
//   actor = null,
//   action,
//   entity,
//   entityId = null,
//   description = "",
//   oldState = null,
//   newState = null,
//   metadata = null
// }) {
//   try {
//     // Obtener IP de manera segura
//     let ip = "system";
//     if (req) {
//       ip =
//         req.ip ||
//         (req.headers ? req.headers["x-forwarded-for"] : null) ||
//         "unknown";
//     }

//     const actorId = actor?.username || "system";
//     const actorType = actor ? "USER" : "SYSTEM";

//     const safeDescription = description?.substring(0, 255) || "";

//     const sql = `
//       INSERT INTO audit_event (
//         actor_type,
//         actor_id,
//         action,
//         entity,
//         entity_id,
//         description,
//         old_state,
//         new_state,
//         metadata,
//         ip,
//         created_at
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
//     `;

//     const params = [
//       actorType,
//       actorId,
//       action,
//       entity,
//       entityId,
//       safeDescription,
//       oldState ? JSON.stringify(oldState) : null,
//       newState ? JSON.stringify(newState) : null,
//       metadata ? JSON.stringify(metadata) : null,
//       ip
//     ];

//     await pool.execute(sql, params);
//   } catch (err) {
//     console.error("Error registrando auditoría:", err.message);
//   }
// }
async function auditAction({
  req = null,
  actor = null,
  action,
  entity,
  entityId = null,
  description = "",
  oldState = null,
  newState = null,
  metadata = null
}) {
  try {
    // Función auxiliar para asegurar que no enviamos undefined a MySQL
    const sanitize = (val) => (val === undefined ? null : val);

    // Obtener IP de manera segura
    let ip = "system";
    if (req) {
      ip =
        req.ip ||
        (req.headers ? req.headers["x-forwarded-for"] : null) ||
        "unknown";
    }

    const actorId = actor?.username || "system";
    const actorType = actor ? "USER" : "SYSTEM";
    const safeDescription = description?.substring(0, 255) || "";

    const sql = `
      INSERT INTO audit_event (
        actor_type,
        actor_id,
        action,
        entity,
        entity_id,
        description,
        old_state,
        new_state,
        metadata,
        ip,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    // Aplicamos sanitize a cada parámetro para evitar el error de mysql2
    const params = [
      sanitize(actorType),
      sanitize(actorId),
      sanitize(action),
      sanitize(entity),
      sanitize(entityId),
      sanitize(safeDescription),
      oldState ? sanitize(JSON.stringify(oldState)) : null,
      newState ? sanitize(JSON.stringify(newState)) : null,
      metadata ? sanitize(JSON.stringify(metadata)) : null,
      sanitize(ip)
    ];

    await pool.execute(sql, params);
  } catch (err) {
    // Registramos el error sin interrumpir el flujo principal de la aplicación
    console.error("Error registrando auditoría:", err.message);
  }
}

module.exports = { AUDIT_ACTIONS, AUDIT_ENTITIES, auditAction };
