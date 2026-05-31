const { pool } = require("../config/db");

async function handleUserPermissions(conn, userid, permisosNombres) {
  // Borrar permisos existentes
  await conn.execute("DELETE FROM auxmoreuserpermissions WHERE userid = ?", [
    userid
  ]);

  // Insertar nuevos
  for (const permisoName of permisosNombres) {
    const [permRows] = await conn.execute(
      "SELECT idp FROM auxpermissions WHERE name = ?",
      [permisoName]
    );
    if (permRows.length > 0) {
      await conn.execute(
        "INSERT INTO auxmoreuserpermissions (userid, permission_id) VALUES (?, ?)",
        [userid, permRows[0].idp]
      );
    }
  }
}

module.exports = { handleUserPermissions };
