const cron = require("node-cron");
const { pool } = require("../config/db");

function initAlarmCron() {
  cron.schedule("*/30 * * * *", async () => {
    console.log("🔄 [CRON] Inicio proceso alarmas");
    let conn;
    try {
      conn = await pool.getConnection();
      // ... toda tu lógica de expiración y distribución (municipio/provincia/global/rol) ...
    } catch (err) {
      console.error("❌ [CRON] Error:", err.message);
    } finally {
      if (conn) conn.release();
    }
  });
}

module.exports = { initAlarmCron };
