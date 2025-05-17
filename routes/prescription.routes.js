const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");

const {
  createPrescriptionValidator,
  updatePrescriptionValidator,
  idParamValidator,
  uploadImageValidator,
} = require("../controllers/prescription/validators");

const createPrescription = require("../controllers/prescription/createPrescription");
const getPrescriptions = require("../controllers/prescription/getPrescriptions");
const getPrescription = require("../controllers/prescription/getPrescription");
const updatePrescription = require("../controllers/prescription/updatePrescription");
const deletePrescription = require("../controllers/prescription/deletePrescription");
const uploadPrescriptionImage = require("../controllers/prescription/uploadPrescriptionImage");
const requestRefill = require("../controllers/prescription/requestRefill");
const getCount = require("../controllers/prescription/getCount");

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

router.post("/", protect, createPrescriptionValidator, handleValidationErrors, createPrescription);
router.get("/", protect, adminMiddleware, getPrescriptions);
router.get("/:id", protect, idParamValidator, handleValidationErrors, getPrescription);
router.put("/:id", protect, updatePrescriptionValidator, handleValidationErrors, updatePrescription);
router.delete("/:id", protect, idParamValidator, handleValidationErrors, deletePrescription);
router.put("/:id/image", protect, uploadImageValidator, handleValidationErrors, uploadPrescriptionImage);

// Add route for prescription count
router.get("/count", protect, adminMiddleware, getCount);

module.exports = router;