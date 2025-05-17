const express = require('express');
const router = express.Router();

// Import individual route files
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const prescriptionRoutes = require("./prescription.routes");
const categoryRoutes = require('./category.routes');
const reviewRoutes = require('./review.routes');
const orderRoutes = require('./order.routes');
const skincareRoutes = require('./skincare.routes');
const healthRoutes = require("./health.routes");
const aiAssistantRoutes = require("./ai-assistant.routes");
const medicineRoutes = require("./medicine.routes");


// Mount the routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/orders', orderRoutes);
router.use('/skincare', skincareRoutes);
router.use("/ai-assistant", aiAssistantRoutes);
router.use("/health", healthRoutes);
router.use("/medicines", medicineRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/orders", orderRoutes);

module.exports = router;
