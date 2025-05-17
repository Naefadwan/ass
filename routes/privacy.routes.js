/**
 * @swagger
 * /privacy/export:
 *   get:
 *     summary: Export user data (GDPR)
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data exported
 *       401:
 *         description: Unauthorized
 *
 * /privacy/delete:
 *   delete:
 *     summary: Delete user account and data (GDPR)
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 */
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");

const { noopValidator } = require("../controllers/privacy/validators");
const exportData = require("../controllers/privacy/exportData");
const deleteAccount = require("../controllers/privacy/deleteAccount");

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

router.get("/export", protect, noopValidator, handleValidationErrors, exportData);
router.delete("/delete", protect, noopValidator, handleValidationErrors, deleteAccount);

module.exports = router;
