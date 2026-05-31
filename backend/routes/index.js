const express = require("express");
const router = express.Router();

// Monta todas (rutas relativas correctas)
router.use(require("./formRoutes.js"));
router.use(require("./usersRoutes.js"));
router.use(require("./alarmRoutes.js"));
router.use(require("./auditRoutes.js"));
router.use(require("./statsRoutes.js"));
router.use(require("./childrenRoutes.js"));
router.use(require("./dbUtilsRoutes.js"));
router.use(require("./testsRoutes.js"));
router.use(require("./othersRoutes.js"));

module.exports = router;
