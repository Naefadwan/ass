const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");

const {
  verifyPrescriptionValidator,
  verificationIdParamValidator,
  manualReviewValidator
} = require("../controllers/prescription-verification/validators");

const verifyPrescription = require("../controllers/prescription-verification/verifyPrescription");
const getVerificationStatus = require("../controllers/prescription-verification/getVerificationStatus");
const submitManualReview = require("../controllers/prescription-verification/submitManualReview");

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

// POST /api/prescriptions/verify
router.post(
  "/verify",
  protect,
  verifyPrescriptionValidator,
  handleValidationErrors,
  verifyPrescription
);

// GET /api/prescriptions/verify/status/:id
router.get(
  "/status/:id",
  protect,
  verificationIdParamValidator,
  handleValidationErrors,
  getVerificationStatus
);

// POST /api/prescriptions/verify/:id/review
router.post(
  "/:id/review",
  protect,
  role(["admin", "pharmacist"]),
  verificationIdParamValidator,
  manualReviewValidator,
  handleValidationErrors,
  submitManualReview
);

module.exports = router;