// routes/othersRoutes.js
const express = require("express");
const router = express.Router();
const othersController = require("../controllers/othersController");

// Formulario de contacto
router.post("/api/contact", othersController.contact);

// Flujo de trabajo: estado actual
router.post(
  "/api/workflow/estado-actual",
  othersController.workflowEstadoActual
);

module.exports = router;
