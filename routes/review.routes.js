// server/routes/review.routes.js

const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");

const {
  createReviewValidator,
  updateReviewValidator,
  idParamValidator
} = require("../controllers/review/validators");

const getReviews = require("../controllers/review/getReviews");
const getReview = require("../controllers/review/getReview");
const createReview = require("../controllers/review/createReview");
const updateReview = require("../controllers/review/updateReview");
const deleteReview = require("../controllers/review/deleteReview");

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

router.get("/", getReviews);
router.post("/", protect, createReviewValidator, handleValidationErrors, createReview);
router.get("/:id", idParamValidator, handleValidationErrors, getReview);
router.put("/:id", protect, adminMiddleware, updateReviewValidator, handleValidationErrors, updateReview);
router.delete("/:id", protect, adminMiddleware, idParamValidator, handleValidationErrors, deleteReview);

module.exports = router;
