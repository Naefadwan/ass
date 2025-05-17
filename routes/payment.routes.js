/**
 * @swagger
 * /payments/create-intent:
 *   post:
 *     summary: Create a Stripe payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *               currency:
 *                 type: string
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment intent created
 *       401:
 *         description: Unauthorized
 *
 * /payments/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Payments]
 *     description: Stripe calls this endpoint to notify about payment events. No authentication required.
 *     responses:
 *       200:
 *         description: Webhook received
 */
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");

const { createPaymentIntentValidator } = require("../controllers/payment/validators");
const createPaymentIntent = require("../controllers/payment/createPaymentIntent");
const stripeWebhook = require("../controllers/payment/stripeWebhook");

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

router.post("/create-intent", protect, createPaymentIntentValidator, handleValidationErrors, createPaymentIntent);
router.post("/webhook", express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
