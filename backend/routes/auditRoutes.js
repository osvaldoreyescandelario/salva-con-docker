const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");

router.get("/api/audit", auditController.getAuditEvents);
router.get("/api/audit/export", auditController.exportAudit);
router.delete("/api/audit/clearlogs", auditController.clearLogs);
router.delete("/api/audit/:id", auditController.deleteAuditById);

module.exports = router;
