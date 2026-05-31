// routes/dbUtilsRoutes.js
const express = require("express");
const router = express.Router();
const dbUtilsController = require("../controllers/dbUtilsController");

// Verificar si existe un registro en una tabla por id
router.get("/api/exists/:table/:id", dbUtilsController.existsTableRecord);

// Backup completo de la base de datos
router.get("/api/backup", dbUtilsController.backupFull);

// Backup por provincia
router.get("/api/backup-provincia", dbUtilsController.backupProvincia);

router.delete(
  "/api/limpiar-datos-selectivo",
  dbUtilsController.clearselecteddata
);

module.exports = router;
