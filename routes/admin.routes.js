const express = require('express');
const router = express.Router();
// adminService is already a singleton instance exported from services/adminService.js
const adminService = require('../services/adminService'); 

// No need for adminMiddleware here if it's applied globally in server.js for /api/admin path

// Dashboard Routes
router.get('/dashboard/stats', async (req, res) => {
    try {
        const stats = await adminService.getDashboardStats();
        const wsHandler = req.app.get('adminWsHandler'); // Get wsHandler from app context
        if (wsHandler) {
            wsHandler.broadcastStatsUpdate(stats);
        }
        res.json(stats);
    } catch (error) {
        console.error('Error in /dashboard/stats:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/dashboard/recent-orders', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const orders = await adminService.getRecentOrders(limit);
        res.json(orders);
    } catch (error) {
        console.error('Error in /dashboard/recent-orders:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/dashboard/inventory-alerts', async (req, res) => {
    try {
        const alerts = await adminService.getInventoryAlerts();
        res.json(alerts);
    } catch (error) {
        console.error('Error in /dashboard/inventory-alerts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Order Status
router.patch('/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const order = await adminService.updateOrder(orderId, status);
        const wsHandler = req.app.get('adminWsHandler');
        if (wsHandler) {
            wsHandler.broadcastOrderUpdate(order);
            const stats = await adminService.getDashboardStats(); // Recalculate stats
            wsHandler.broadcastStatsUpdate(stats);
        }
        res.json(order);
    } catch (error) {
        console.error('Error in /orders/:orderId/status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Product Inventory
router.patch('/products/:productId/inventory', async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const product = await adminService.updateInventory(productId, quantity);
        const wsHandler = req.app.get('adminWsHandler');
        if (wsHandler) {
            wsHandler.broadcastInventoryUpdate(product);
            // If stock is low, also update dashboard stats
            // Assuming product object returned by updateInventory contains current stock and threshold
            if (product && product.stock <= product.threshold) {
                const stats = await adminService.getDashboardStats(); // Recalculate stats
                wsHandler.broadcastStatsUpdate(stats);
            }
        }
        res.json(product);
    } catch (error) {
        console.error('Error in /products/:productId/inventory:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

