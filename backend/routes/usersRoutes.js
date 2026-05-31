const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");

router.get("/api/users/:id", userController.usersid);
router.post("/api/users/login", userController.login); // Unificas creación/edición
router.post("/api/newuser", userController.newuser);
router.get("/api/userspending", userController.userspending);
router.post("/api/users/c", userController.approve);
router.post("/api/send-recovery-code", userController.recoverycode);
router.put("/api/update-password", userController.updatepassword);
router.post("/api/users/save", userController.usersave);
router.get("/api/rols", userController.rols);
router.get("/api/permissions", userController.permissions);
router.get("/api/permisos-por-rol", userController.permisosporrol);
router.post("/api/saveRolPermissions", userController.saveRolPermissions);
router.post("/api/users/load", userController.loaduser);
router.post("/api/permisos/por-rol", userController.permisosrol);
router.get("/api/permisos/por-rol", userController.getpermisosporrol);
router.get("/api/permisosrol", userController.getpermisosrol);
router.post("/api/users/approve", userController.approve);

module.exports = router;
