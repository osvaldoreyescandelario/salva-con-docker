// config/db.js

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "saidicdo_db",
  port: process.env.DB_PORT || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificación inicial
async function testDB() {
  try {
    const connection = await pool.getConnection();

    console.log("✅ MySQL conectado");

    connection.release();
  } catch (err) {
    console.error("❌ Error conectando MySQL:", err.message);
  }
}

setTimeout(() => {
  testDB();
}, 5000);

// Manejo global de errores
pool.on("error", (err) => {
  console.error("❌ Error inesperado en MySQL:", err.message);
});

module.exports = { pool };
