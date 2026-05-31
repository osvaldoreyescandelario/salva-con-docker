// routes/testsRoutes.js
const express = require("express");
const router = express.Router();
const testsController = require("../controllers/testsController");

router.get("/api/auxtests/name/:testid", testsController.getAuxTestName);

module.exports = router;
