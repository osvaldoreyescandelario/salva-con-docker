const express = require("express");
const router = express.Router();
const alarmController = require("../controllers/alarmController");

router.get("/api/alarmas/contador", alarmController.getContador);
router.get("/api/alarmas/lista", alarmController.getLista);
router.post("/api/alarmas/:id/leer", alarmController.leerAlarma);
router.post("/api/alarmas/todasleer", alarmController.alarmasleerTodas);
router.post("/api/alarmas", alarmController.crearAlarma);

router.get("/api/alarmas/contadores", alarmController.contadores);
router.get("/api/alarmas/admin", alarmController.alarmasadmin);
router.get("/api/alarmas/:ida/usuarios", alarmController.alarmasusuarios);
router.get("/api/alarmas/:ida/auditoria", alarmController.alarmasauditoria);
router.put("/api/updatealarmas/:ida", alarmController.updatealarmas);
router.delete("/api/deletealarmas/:ida", alarmController.deletealarmas);

module.exports = router;
