const Order = require('../models/Order');
const Product = require('../models/SkincareProduct'); // Corrected path
const User = require('../models/User');
const { isValidObjectId } = require('mongoose');
const EventEmitter = require('events');

// Create event emitter for WebSocket notifications
const AdminEvents = new EventEmitter();

// Simple cache implementation
class Cache {
    constructor(ttl = 60000) { // Default TTL: 60 seconds
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        const expiry = Date.now() + this.ttl;
        this.cache.set(key, { value, expiry });
        return value;
    }

    get(key) {
        const data = this.cache.get(key);
        if (!data) return null;
        if (Date.now() > data.expiry) {
            this.cache.delete(key);
            return null;
        }
        return data.value;
    }

    invalidate(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            // Invalidate all cache if no key provided
            this.cache.clear();
        }
    }
}

// Create cache instances with different TTLs
const statsCache = new Cache(30000); // 30 seconds for stats
const ordersCache = new Cache(20000); // 20 seconds for orders
const inventoryCache = new Cache(60000); // 60 seconds for inventory

class AdminService {
    // Get dashboard statistics with caching
    async getDashboardStats() {
        try {
            // Check cache first
            const cachedStats = statsCache.get('dashboardStats');
            if (cachedStats) {
                console.log('Returning cached dashboard stats');
                return cachedStats;
            }

            console.log('Fetching fresh dashboard stats from database');
            const [orders, products, users] = await Promise.all([
                Order.find().sort({ createdAt: -1 }),
                Product.find(),
                User.find()
            ]).catch(err => {
                throw new Error(`Database query failed: ${err.message}`);
            });

            if (!orders || !products || !users) {
                throw new Error('Failed to retrieve one or more required data sets');
            }

            // Optimize calculations by pre-filtering
            const pendingOrders = orders.filter(o => o.status === 'pending');
            const completedOrders = orders.filter(o => o.status === 'completed');
            const lowStockProducts = products.filter(p => p.stock <= p.threshold);
            
            // Calculate revenue once to avoid multiple iterations
            const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
            
            const stats = {
                orders: {
                    total: orders.length,
                    pending: pendingOrders.length,
                    completed: completedOrders.length
                },
                revenue: {
                    total: totalRevenue,
                    monthly: this.calculateMonthlyRevenue(orders),
                    daily: this.calculateDailyRevenue(orders)
                },
                users: {
                    total: users.length,
                    new: this.calculateNewUsers(users),
                    active: this.calculateActiveUsers(users)
                },
                inventory: {
                    total: products.length,
                    lowStock: lowStockProducts.length,
                    alertProducts: lowStockProducts.map(p => ({ 
                        id: p._id, 
                        name: p.name, 
                        stock: p.stock, 
                        threshold: p.threshold 
                    })).slice(0, 5) // Include top 5 low stock items
                },
                lastUpdated: new Date().toISOString()
            };
            
            // Save to cache
            statsCache.set('dashboardStats', stats);
            
            return stats;
        } catch (error) {
            console.error('Error in getDashboardStats:', error);
            throw new Error(`Error getting dashboard stats: ${error.message}`);
        }
    }

    // Get recent orders with caching
    async getRecentOrders(limit = 5) {
        try {
            // Validate input
            if (!Number.isInteger(limit) || limit < 1) {
                throw new Error('Invalid limit parameter. Must be a positive integer.');
            }
            
            // Check cache first
            const cacheKey = `recentOrders_${limit}`;
            const cachedOrders = ordersCache.get(cacheKey);
            if (cachedOrders) {
                console.log(`Returning cached recent orders (limit: ${limit})`);
                return cachedOrders;
            }

            console.log(`Fetching fresh recent orders from database (limit: ${limit})`);
            const orders = await Order.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('user', 'name email')
                .catch(err => {
                    throw new Error(`Database query failed: ${err.message}`);
                });

            if (!orders) {
                throw new Error('Failed to retrieve orders from database');
            }
            
            // Format orders for frontend consistency
            const formattedOrders = orders.map(order => ({
                id: order._id,
                customer: order.user ? `${order.user.name} (${order.user.email})` : 'Unknown',
                date: order.createdAt,
                total: order.total || 0,
                status: order.status,
                items: order.items ? order.items.length : 0
            }));
            
            // Save to cache
            ordersCache.set(cacheKey, formattedOrders);
            
            return formattedOrders;
        } catch (error) {
            console.error('Error in getRecentOrders:', error);
            throw new Error(`Error getting recent orders: ${error.message}`);
        }
    }

        } catch (error) {
            throw new Error(`Error getting inventory alerts: ${error.message}`);
        }
    }

    // Update order status
    async updateOrder(orderId, status) {
        try {
            return await Order.findByIdAndUpdate(
                orderId,
                { status },
                { new: true }
            ).populate('user', 'name email');
        } catch (error) {
            throw new Error(`Error updating order: ${error.message}`);
        }
    }

    // Update product inventory
    async updateInventory(productId, quantity) {
        try {
            return await Product.findByIdAndUpdate(
                productId,
                { stock: quantity },
                { new: true }
            );
        } catch (error) {
            throw new Error(`Error updating inventory: ${error.message}`);
        }
    }

    // Helper methods
    calculateMonthlyRevenue(orders) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return orders
            .filter(order => new Date(order.createdAt) >= monthStart)
            .reduce((sum, order) => sum + (order.total || 0), 0);
    }

    calculateDailyRevenue(orders) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return orders
            .filter(order => new Date(order.createdAt) >= today)
            .reduce((sum, order) => sum + (order.total || 0), 0);
    }

    calculateNewUsers(users) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return users.filter(user => new Date(user.createdAt) >= thirtyDaysAgo).length;
    }

    calculateActiveUsers(users) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return users.filter(user => user.lastLogin && new Date(user.lastLogin) >= thirtyDaysAgo).length;
    }
}

module.exports = new AdminService();

