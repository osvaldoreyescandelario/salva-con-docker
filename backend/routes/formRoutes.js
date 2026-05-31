const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");

// ******************************************************************************************
// *       RUTAS PARA SALVAR CADA UNO DE LOS FORMULARIOS
// ******************************************************************************************
router.post("/api/savem311", formController.saveme311);
router.post("/api/saveme321", formController.saveme321);
router.post("/api/saveme322", formController.saveme322);
router.post("/api/saveme323", formController.saveme323);
router.post("/api/saveme331", formController.saveme331);
router.post("/api/saveme332", formController.saveme332);
router.post("/api/saveme333", formController.saveme333);
router.post("/api/saveme34", formController.saveme34);
router.post("/api/savemrrp41", formController.savemrrp41);
router.post("/api/savemrrp42", formController.savemrrp42);

// ******************************************************************************************
// *       RUTAS PARA LEER CADA UNO DE LOS FORMULARIOS
// ******************************************************************************************
router.get("/api/getme311/:id", formController.getme311);
router.get("/api/getme321/:id", formController.getme321);
router.get("/api/getme322/:id", formController.getme322);
router.get("/api/getme323/:id", formController.getme323);
router.get("/api/getme331/:id", formController.getme331);
router.get("/api/getme332/:id", formController.getme332);
router.get("/api/getme333/:id", formController.getme333);
router.get("/api/getmrrp42/:id", formController.getmrrp42);
router.get("/api/getme34/:id", formController.getme34);
router.get("/api/getmrrp41/:id", formController.getmrrp41);

// ******************************************************************************************
// *       RUTAS PARA ACTUALIZAR CADA UNO DE LOS FORMULARIOS
// ******************************************************************************************
router.put("/api/updatem311/:id", formController.updateme311);
router.put("/api/updatem321/:id", formController.updateme321);
router.put("/api/updatem322/:id", formController.updateme322);
router.put("/api/updatem323/:id", formController.updateme323);
router.put("/api/updatem331/:id", formController.updateme331);
router.put("/api/updatem332/:id", formController.updateme332);
router.put("/api/updatem333/:id", formController.updateme333);
router.put("/api/updatem34/:id", formController.updateme34);
router.put("/api/updatemrrp41/:id", formController.updatemrrp41);
router.put("/api/updatemrrp42/:id", formController.updatemrrp42);

module.exports = router;
