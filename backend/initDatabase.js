const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

async function initDatabase() {
  const DB_NAME = process.env.DB_NAME || "saidicdo_db";

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "mysql",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    console.log("🔍 Verificando base de datos...");

    const [dbs] = await connection.query("SHOW DATABASES LIKE ?", [DB_NAME]);

    let restoreNeeded = false;

    if (dbs.length === 0) {
      console.log(`⚠️ Base de datos ${DB_NAME} no existe`);
      await connection.query(`CREATE DATABASE \`${DB_NAME}\``);
      restoreNeeded = true;
    } else {
      const [tables] = await connection.query(
        `
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'users'
        `,
        [DB_NAME]
      );

      if (tables.length === 0) {
        console.log("⚠️ Tabla users no existe");
        await connection.query(`DROP DATABASE \`${DB_NAME}\``);
        await connection.query(`CREATE DATABASE \`${DB_NAME}\``);
        restoreNeeded = true;
      }
    }

    await connection.changeUser({ database: DB_NAME });

    if (restoreNeeded) {
      console.log("🔄 Restaurando db.sql...");

      const sqlFile = fs.readFileSync(path.join(__dirname, "db.sql"), "utf8");

      await connection.query("SET FOREIGN_KEY_CHECKS=0");
      await connection.query(sqlFile);
      await connection.query("SET FOREIGN_KEY_CHECKS=1");

      console.log("✅ Base de datos restaurada");

      try {
        const hash = await bcrypt.hash("Admin123*", 10);

        const [r1] = await connection.query(
          `
    INSERT INTO users
    (userid, userpass, useremail, userspec, active, registeredpend, fullname, municipality, province)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
          [
            "admin",
            hash,
            "admin@admin.com",
            "Ninguno",
            1,
            0,
            "admin",
            "Playa",
            "La Habana"
          ]
        );

        console.log("users insert:", r1);

        const [r2] = await connection.query(
          "INSERT INTO auxusersrol (userid, rol_id) VALUES (?, ?)",
          ["admin", 6]
        );

        console.log("auxusersrol insert:", r2);
      } catch (e) {
        console.error("FALLÓ EL INSERT:", e.code, e.errno, e.sqlMessage, e.sql);
        throw e;
      }

      console.log("✅ Usuario admin creado");

      const [resultRol] = await connection.query(
        `
        INSERT INTO auxusersrol (userid, rol_id)
        VALUES (?, ?)
        `,
        ["admin", 6]
      );

      console.log("✅ Rol administrador asignado");
    } else {
      console.log("✅ Base de datos correcta");
    }
  } catch (err) {
    console.error("❌ Error inicializando BD:", err);
    throw err;
  } finally {
    await connection.end();
  }
}

module.exports = initDatabase;
