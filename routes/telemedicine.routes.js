/**
 * @swagger
 * /telemedicine/schedule:
 *   post:
 *     summary: Schedule a video consultation
 *     tags: [Telemedicine]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId:
 *                 type: string
 *               datetime:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Consult scheduled
 *       401:
 *         description: Unauthorized
 *
 * /telemedicine/chat:
 *   post:
 *     summary: Send a chat message in a consult
 *     tags: [Telemedicine]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               consultId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent
 *       401:
 *         description: Unauthorized
 */
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const router = express.Router();
const { validationResult } = require('express-validator');
const returnResponse = require('../utils/response');

const scheduleConsult = require('../controllers/telemedicine/scheduleConsult');
const sendChatMessage = require('../controllers/telemedicine/sendChatMessage');
const { scheduleConsultValidator, sendChatMessageValidator } = require('../controllers/telemedicine/validators');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, 'Validation error', errors.array());
  }
  next();
}

// Only patients can schedule consults
router.post(
  '/schedule',
  protect,
  role(['user']),
  scheduleConsultValidator,
  handleValidationErrors,
  scheduleConsult
);
// Both doctors and patients can send chat messages
router.post(
  '/chat',
  protect,
  role(['user', 'pharmacist', 'admin']),
  sendChatMessageValidator,
  handleValidationErrors,
  sendChatMessage
);

module.exports = router;
