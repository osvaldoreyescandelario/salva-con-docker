// controllers/testsController.js
const { pool } = require("../config/db");
const {
  auditAction,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES
} = require("../middlewares/audit");

exports.getAuxTestName = async (req, res) => {
  const { testid } = req.params;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    const [rows] = await conn.execute(
      "SELECT testid, testname FROM auxtests WHERE testid = ?",
      [testid]
    );

    // if (!rows.length) {
    //   await auditAction({
    //     req,
    //     actor: { username: auditUsername },
    //     action: AUDIT_ACTIONS.SELECT,
    //     entity: AUDIT_ENTITIES.AUXTESTS,
    //     entityId: testid.toString(),
    //     description: `Intento de consulta de test no existente con testid=${testid}`,
    //     oldState: null,
    //     newState: null
    //   });

    //   return res.json({
    //     success: false,
    //     message: `No se encontró test con testid=${testid}`
    //   });
    // }

    const testData = { testid: rows[0].testid, testname: rows[0].testname };

    // await auditAction({
    //   req,
    //   actor: { username: auditUsername },
    //   action: AUDIT_ACTIONS.SELECT,
    //   entity: AUDIT_ENTITIES.AUXTESTS,
    //   entityId: testid.toString(),
    //   description: `Consulta test auxtests con testid=${testid}`,
    //   oldState: null,
    //   newState: testData
    // });

    res.json({ success: true, data: testData });
  } catch (err) {
    console.error("Error en /api/auxtests/name/:testid:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};
