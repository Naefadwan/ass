const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const { validationResult } = require("express-validator");
const role = require("../middleware/roleMiddleware");
const returnResponse = require("../utils/response");

const {
  createOrderValidator,
  idParamValidator,
  updateOrderToPaidValidator,
  updateOrderStatusValidator
} = require("../controllers/order/validators");

const createOrder = require("../controllers/order/createOrder");
const getOrderById = require("../controllers/order/getOrderById");
const updateOrderToPaid = require("../controllers/order/updateOrderToPaid");
const updateOrderStatus = require("../controllers/order/updateOrderStatus");
const getMyOrders = require("../controllers/order/getMyOrders");
const getOrders = require("../controllers/order/getOrders");

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

// Create a new order
router.route("/")
  .post(protect, createOrderValidator, handleValidationErrors, createOrder)
  .get(protect, adminMiddleware, getOrders);

// Get logged-in user's orders
router.route("/myorders")
  .get(protect, getMyOrders);

// Get a single order by ID
router.route("/:id")
  .get(protect, idParamValidator, handleValidationErrors, getOrderById);

// Update order payment
router.route("/:id/pay")
  .put(protect, updateOrderToPaidValidator, handleValidationErrors, updateOrderToPaid);

// Update order delivery status (admin only)
router.route("/:id/status")
  .put(protect, role(["admin"]), updateOrderStatus);

module.exports = router;
