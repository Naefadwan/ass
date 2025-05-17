const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");

const {
  createMedicineValidator,
  updateMedicineValidator,
  idParamValidator,
  getMedicinesValidator
} = require("../controllers/medicine/validators");

const getMedicines = require("../controllers/medicine/getMedicines");
const getMedicine = require("../controllers/medicine/getMedicine");
const createMedicine = require("../controllers/medicine/createMedicine");
const updateMedicine = require("../controllers/medicine/updateMedicine");
const deleteMedicine = require("../controllers/medicine/deleteMedicine");

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

router.get("/", getMedicinesValidator, handleValidationErrors, getMedicines);
router.post("/", protect, adminMiddleware, createMedicineValidator, handleValidationErrors, createMedicine);
router.get("/:id", idParamValidator, handleValidationErrors, getMedicine);
router.put("/:id", protect, adminMiddleware, updateMedicineValidator, handleValidationErrors, updateMedicine);
router.delete("/:id", protect, adminMiddleware, idParamValidator, handleValidationErrors, deleteMedicine);

module.exports = router;