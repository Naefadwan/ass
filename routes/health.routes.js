const express = require("express");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");
const { noopValidator } = require("../controllers/health/validators");
const getHealthStatus = require("../controllers/health/getHealthStatus");

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

router.get("/", noopValidator, handleValidationErrors, getHealthStatus);

module.exports = router;
