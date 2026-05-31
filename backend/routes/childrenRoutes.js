// routes/childrenRoutes.js
const express = require("express");
const router = express.Router();
const childrenController = require("../controllers/childrenController");

router.get("/api/children", childrenController.children);
router.get("/api/getchild/:code", childrenController.getChild);
router.post("/api/updatechild", childrenController.updateChild);
router.post("/api/checkchild", childrenController.checkChild);
router.delete("/api/delmgivar/:id", childrenController.deleteMgivar);
router.get("/api/children/:dni/photo", childrenController.getChildPhoto);
router.post("/api/updatechildphoto", childrenController.updatePhoto);
router.post("/api/mgivar/count-by-dni", childrenController.countMgivarByDni);
router.delete("/api/mgivar/:id", childrenController.delMgivarById);
router.get("/api/mgifixed/:dni", childrenController.getMgiFixedByDni);
router.delete("/api/mgifixed/dni/:dni", childrenController.delMgiFixedByDni);
router.post("/api/mgifixed/batch", childrenController.batchMgiFixed);

module.exports = router;
