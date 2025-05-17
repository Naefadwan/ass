// WebSocket and Real-time Updates for Admin Dashboard
const AdminDashboardRealtime = {
    // WebSocket connection
    socket: null,
    
    // Configuration
    config: {
        wsUrl: 'ws://localhost:5000/admin/updates',
        reconnectDelay: 5000,
        maxRetries: 3
    },
    
    // Initialize real-time updates
    init() {
        this.connectWebSocket();
        this.setupEventListeners();
    },
    
    // Connect to WebSocket server
    connectWebSocket() {
        try {
            this.socket = new WebSocket(this.config.wsUrl);
            
            this.socket.onopen = () => {
                console.log('📡 WebSocket: Connected to server');
                this.subscribeToUpdates();
            };
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleUpdate(data);
            };
            
            this.socket.onerror = (error) => {
                console.error('📡 WebSocket: Error', error);
                this.handleConnectionError();
            };
            
            this.socket.onclose = () => {
                console.log('📡 WebSocket: Connection closed');
                this.handleConnectionClose();
            };
        } catch (error) {
            console.error('📡 WebSocket: Connection failed', error);
            this.handleConnectionError();
        }
    },
    
    // Subscribe to real-time updates
    subscribeToUpdates() {
        const message = {
            type: 'subscribe',
            channels: ['orders', 'inventory', 'stats']
        };
        this.socket.send(JSON.stringify(message));
    },
    
    // Handle incoming updates
    handleUpdate(data) {
        switch (data.type) {
            case 'order_update':
                this.handleOrderUpdate(data.order);
                break;
            case 'inventory_update':
                this.handleInventoryUpdate(data.inventory);
                break;
            case 'stats_update':
                this.handleStatsUpdate(data.stats);
                break;
            default:
                console.log('📡 Unknown update type:', data.type);
        }
    },
    
    // Handle order updates
    handleOrderUpdate(order) {
        // Update order statistics
        const totalOrders = document.getElementById('total-orders');
        const pendingOrders = document.getElementById('pending-orders');
        const completedOrders = document.getElementById('completed-orders');
        
        if (totalOrders) totalOrders.textContent = (parseInt(totalOrders.textContent) + 1).toString();
        if (order.status === 'pending' && pendingOrders) {
            pendingOrders.textContent = (parseInt(pendingOrders.textContent) + 1).toString();
        }
        if (order.status === 'completed' && completedOrders) {
            completedOrders.textContent = (parseInt(completedOrders.textContent) + 1).toString();
        }
        
        // Add new order to recent orders list
        this.updateRecentOrders(order);
        
        // Show notification
        this.showNotification('New Order', `Order #${order.id} received`, 'info');
    },
    
    // Handle inventory updates
    handleInventoryUpdate(inventory) {
        // Update inventory alerts list
        this.updateInventoryAlerts(inventory);
        
        // Show notification for low stock
        if (inventory.stock <= inventory.threshold) {
            this.showNotification(
                'Low Stock Alert',
                `${inventory.name} is running low (${inventory.stock} remaining)`,
                'warning'
            );
        }
    },
    
    // Handle statistics updates
    handleStatsUpdate(stats) {
        // Update dashboard statistics
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = typeof value === 'number' ? 
                    value.toLocaleString() : value;
            }
        });
        
        // Update last refresh timestamp
        this.updateLastRefreshTimestamp();
    },
    
    // Update recent orders list
    updateRecentOrders(order) {
        const orderList = document.getElementById('orderList');
        if (!orderList) return;
        
        const orderElement = document.createElement('div');
        orderElement.className = 'list-item';
        orderElement.innerHTML = `
            <div class="list-item-info">
                <div class="list-item-title">Order #${order.id}</div>
                <div class="list-item-subtitle">${order.customer}</div>
            </div>
            <div class="list-item-status">
                <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
        `;
        
        // Add to top of list
        orderList.insertBefore(orderElement, orderList.firstChild);
        
        // Remove last item if list is too long
        if (orderList.children.length > 5) {
            orderList.removeChild(orderList.lastChild);
        }
    },
    
    // Update inventory alerts list
    updateInventoryAlerts(inventory) {
        const alertsList = document.querySelector('.inventory-alerts-table tbody');
        if (!alertsList) return;
        
        // Check if item already exists
        const existingRow = Array.from(alertsList.children)
            .find(row => row.dataset.productId === inventory.id.toString());
        
        if (existingRow) {
            // Update existing row
            existingRow.querySelector('.stock-amount').textContent = inventory.stock;
            const status = this.getInventoryStatus(inventory.stock, inventory.threshold);
            existingRow.querySelector('.status-badge').className = `status-badge status-${status.toLowerCase().replace(/ /g, '-')}`;
            existingRow.querySelector('.status-badge').textContent = status;
        } else if (inventory.stock <= inventory.threshold) {
            // Add new row for low stock item
            const row = document.createElement('tr');
            row.dataset.productId = inventory.id;
            row.innerHTML = `
                <td>MED-${inventory.id}</td>
                <td>${inventory.name}</td>
                <td class="stock-amount">${inventory.stock}</td>
                <td>${inventory.threshold}</td>
                <td><span class="status-badge status-${this.getInventoryStatus(inventory.stock, inventory.threshold).toLowerCase().replace(/ /g, '-')}">${this.getInventoryStatus(inventory.stock, inventory.threshold)}</span></td>
                <td>
                    <button class="action-btn reorder-btn" data-product-id="${inventory.id}">Reorder</button>
                </td>
            `;
            alertsList.insertBefore(row, alertsList.firstChild);
        }
    },
    
    // Get inventory status
    getInventoryStatus(stock, threshold) {
        if (stock === 0) return 'Out of Stock';
        if (stock <= threshold) return 'Low Stock';
        return 'In Stock';
    },
    
    // Show notification
    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to notifications area
        const notificationsArea = document.querySelector('.notifications-area');
        if (notificationsArea) {
            notificationsArea.appendChild(notification);
            
            // Remove after 5 seconds
            setTimeout(() => {
                notification.remove();
            }, 5000);
            
            // Close button
            notification.querySelector('.notification-close').onclick = () => {
                notification.remove();
            };
        }
    },
    
    // Update last refresh timestamp
    updateLastRefreshTimestamp() {
        const timestamps = document.querySelectorAll('.last-refresh-timestamp');
        const time = new Date().toLocaleTimeString();
        timestamps.forEach(el => {
            el.textContent = `Last updated: ${time}`;
        });
    },
    
    // Handle connection error
    handleConnectionError() {
        this.showNotification(
            'Connection Error',
            'Failed to connect to server. Retrying...',
            'error'
        );
        setTimeout(() => this.connectWebSocket(), this.config.reconnectDelay);
    },
    
    // Handle connection close
    handleConnectionClose() {
        setTimeout(() => this.connectWebSocket(), this.config.reconnectDelay);
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.socket?.readyState !== WebSocket.OPEN) {
                this.connectWebSocket();
            }
        });
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.connectWebSocket();
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AdminDashboardRealtime.init();
});

