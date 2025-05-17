/**
 * @swagger
 * /dashboard/patient:
 *   get:
 *     summary: Get patient dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient dashboard data
 *       401:
 *         description: Unauthorized
 *
 * /dashboard/doctor:
 *   get:
 *     summary: Get doctor dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor dashboard data
 *       401:
 *         description: Unauthorized
 *
 * /dashboard/pharmacist:
 *   get:
 *     summary: Get pharmacist dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pharmacist dashboard data
 *       401:
 *         description: Unauthorized
 */
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");

const { noopValidator } = require("../controllers/dashboard/validators");
const patientDashboard = require("../controllers/dashboard/patientDashboard");
const doctorDashboard = require("../controllers/dashboard/doctorDashboard");
const pharmacistDashboard = require("../controllers/dashboard/pharmacistDashboard");

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

router.get("/patient", protect, noopValidator, handleValidationErrors, patientDashboard);
router.get("/doctor", protect, noopValidator, handleValidationErrors, doctorDashboard);
router.get("/pharmacist", protect, noopValidator, handleValidationErrors, pharmacistDashboard);

module.exports = router;
