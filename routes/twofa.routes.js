const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validationResult } = require('express-validator');
const returnResponse = require('../utils/response');

const setup2FA = require('../controllers/twofa/setup2FA');
const verify2FA = require('../controllers/twofa/verify2FA');
const { verify2FAValidator } = require('../controllers/twofa/validators');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, 'Validation error', errors.array());
  }
  next();
}

router.post('/setup', protect, setup2FA);
router.post('/verify', protect, verify2FAValidator, handleValidationErrors, verify2FA);

module.exports = router;
