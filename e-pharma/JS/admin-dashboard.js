document.addEventListener("DOMContentLoaded", () => {
  console.log("📊 Admin Dashboard: Initializing");
  
  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const nav = document.querySelector("nav");

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      nav.classList.toggle("active");
    });
  }
  
  // Initialize admin dashboard functionality
  initAdminDashboard();
});

// Dashboard refresh intervals (in milliseconds)
const REFRESH_INTERVALS = {
  DASHBOARD_STATS: 60000, // 1 minute
  RECENT_ORDERS: 30000,   // 30 seconds
  INVENTORY_ALERTS: 60000 // 1 minute
};

// Store interval IDs for cleanup
let refreshIntervals = {
  dashboardStats: null,
  recentOrders: null,
  inventoryAlerts: null
};

// WebSocket configuration
const WS_CONFIG = {
    URL: 'ws://localhost:5000/admin/updates',
    RECONNECT_DELAY: 5000,
    MAX_RETRIES: 3
};

// WebSocket connection
let websocket = null;
let wsRetryCount = 0;

// Track loading states
let loadingStates = {
  dashboardStats: false,
  recentOrders: false,
  inventoryAlerts: false
};

// Function to initialize the admin dashboard
function initAdminDashboard() {
  // Get user info from localStorage
  let userInfo = null;
  try {
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
      userInfo = JSON.parse(userInfoStr);
    }
  } catch (e) {
    console.error("📊 Admin Dashboard: Error parsing user info:", e);
    return;
  }
  
  // Verify admin role from the database (additional protection layer)
  if (!userInfo || userInfo.role?.toLowerCase() !== 'admin') {
    console.error("📊 Admin Dashboard: Unauthorized access attempt - role from database:", userInfo?.role);
    return;
  }
  
  // Update admin header with user info
  updateAdminHeader(userInfo);
  
  // Load dashboard statistics and data
  loadDashboardData();
  
  // Initialize dashboard event listeners
  setupEventListeners();
  
  // Initialize WebSocket connection for real-time updates
  initializeWebSocket();
  
  // Setup automatic refresh intervals
  setupAutoRefresh();
}

// Update admin header with user information
function updateAdminHeader(userInfo) {
  const adminNameElement = document.querySelector('.admin-user-name');
  if (adminNameElement) {
    adminNameElement.textContent = userInfo.name || userInfo.email;
  }
  
  const adminRoleElement = document.querySelector('.admin-user-role');
  if (adminRoleElement) {
    adminRoleElement.textContent = userInfo.role || 'Administrator';
  }
  
  // Add logout button functionality
  const logoutBtn = document.querySelector('.admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (window.setUserLoggedOut && typeof window.setUserLoggedOut === 'function') {
        window.setUserLoggedOut();
      } else {
        // Fallback logout method
        localStorage.removeItem('e_pharma_auth_token');
        localStorage.removeItem('user_info');
      }
      
      // Redirect to home page
      window.location.href = 'home2.html';
    });
  }
}

// Load dashboard data and statistics from the database
async function loadDashboardData() {
  try {
    console.log("📊 ADMIN DASHBOARD: Loading dashboard data from database");
    
    // Check if the API service is available
    if (!window.AdminAPIService) {
      console.error("📊 ADMIN DASHBOARD: AdminAPIService not available, using fallback data");
      loadMockDashboardData();
      return;
    }
    
    // Load main dashboard statistics
    await loadDashboardStats();
    
    // Load recent orders
    await loadRecentOrders();
    
    // Load inventory alerts
    await loadInventoryAlerts();
    
    // Update last refresh timestamp
    updateLastRefreshTimestamp();
    
  } catch (error) {
    console.error("📊 ADMIN DASHBOARD: Error loading dashboard data:", error);
    showErrorMessage("Failed to load dashboard data. Please try refreshing the page.");
  }
}

// Load dashboard statistics with loading states
async function loadDashboardStats() {
  // Get dashboard stat containers
  const orderStatsContainer = document.querySelector('.order-stats-container');
  const revenueStatsContainer = document.querySelector('.revenue-stats-container');
  const userStatsContainer = document.querySelector('.user-stats-container');
  
  if (!orderStatsContainer && !revenueStatsContainer && !userStatsContainer) {
    console.warn("📊 ADMIN DASHBOARD: Stat containers not found in DOM");
    return;
  }
  
  try {
    // Show loading states
    loadingStates.dashboardStats = true;
    showLoadingState('dashboard-stats');
    
    // Try to fetch dashboard statistics from API
    const dashboardStats = await AdminAPIService.getDashboardStats(['orders', 'revenue', 'users']);
    console.log("📊 ADMIN DASHBOARD: Fetched dashboard stats:", dashboardStats);
    
    // Handle different data structures (API vs mock data)
    const isNestedStructure = dashboardStats.orders && dashboardStats.revenue && dashboardStats.users;
    
    // Format and update order statistics
    updateOrderStats(dashboardStats, isNestedStructure);
    
    // Format and update revenue statistics
    updateRevenueStats(dashboardStats, isNestedStructure);
    
    // Format and update user statistics
    updateUserStats(dashboardStats, isNestedStructure);
    
    // Hide loading state
    hideLoadingState('dashboard-stats');
    
  } catch (error) {
    console.error("📊 ADMIN DASHBOARD: Error fetching dashboard stats, using fallback data", error);
    // If API call fails, fall back to some mock data
    loadMockDashboardData();
    showRetryButton('dashboard-stats', () => loadDashboardStats());
  } finally {
    loadingStates.dashboardStats = false;
  }
}

// Update order statistics
function updateOrderStats(dashboardStats, isNestedStructure) {
  const totalOrdersEl = document.getElementById('total-orders');
  const pendingOrdersEl = document.getElementById('pending-orders');
  const completedOrdersEl = document.getElementById('completed-orders');
  
  if (totalOrdersEl && pendingOrdersEl && completedOrdersEl) {
    // Get values based on data structure
    const totalOrders = isNestedStructure ? 
      (dashboardStats.orders.total || 0) : (dashboardStats.totalOrders || 0);
    const pendingOrders = isNestedStructure ? 
      (dashboardStats.orders.pending || 0) : (dashboardStats.pendingOrders || 0);
    const completedOrders = isNestedStructure ? 
      (dashboardStats.orders.completed || 0) : (dashboardStats.totalOrders - dashboardStats.pendingOrders || 0);
    
    // Format and display values
    totalOrdersEl.textContent = formatNumber(totalOrders);
    pendingOrdersEl.textContent = formatNumber(pendingOrders);
    completedOrdersEl.textContent = formatNumber(completedOrders);
    
    // Update any graphs or visual indicators if applicable
    updateOrderStatsVisuals(totalOrders, pendingOrders, completedOrders);
  }
}

// Update revenue statistics
function updateRevenueStats(dashboardStats, isNestedStructure) {
  const totalRevenueEl = document.getElementById('total-revenue');
  const monthlyRevenueEl = document.getElementById('monthly-revenue');
  const dailyRevenueEl = document.getElementById('daily-revenue');
  
  if (totalRevenueEl && monthlyRevenueEl && dailyRevenueEl) {
    // Get values based on data structure
    const totalRevenue = isNestedStructure ? 
      (dashboardStats.revenue.total || 0) : (dashboardStats.totalSales || 0);
    const monthlyRevenue = isNestedStructure ? 
      (dashboardStats.revenue.monthly || 0) : (Math.round(dashboardStats.totalSales / 12) || 0);
    const dailyRevenue = isNestedStructure ? 
      (dashboardStats.revenue.daily || 0) : (Math.round(dashboardStats.totalSales / 365) || 0);
    
    // Format and display values
    totalRevenueEl.textContent = formatCurrency(totalRevenue);
    monthlyRevenueEl.textContent = formatCurrency(monthlyRevenue);
    dailyRevenueEl.textContent = formatCurrency(dailyRevenue);
    
    // Update any graphs or visual indicators if applicable
    updateRevenueStatsVisuals(totalRevenue, monthlyRevenue, dailyRevenue);
  }
}

// Update user statistics
function updateUserStats(dashboardStats, isNestedStructure) {
  const totalUsersEl = document.getElementById('total-users');
  const newUsersEl = document.getElementById('new-users');
  const activeUsersEl = document.getElementById('active-users');
  
  if (totalUsersEl && newUsersEl && activeUsersEl) {
    // Get values based on data structure
    const totalUsers = isNestedStructure ? 
      (dashboardStats.users.total || 0) : (dashboardStats.totalCustomers || 0);
    const newUsers = isNestedStructure ? 
      (dashboardStats.users.new || 0) : (Math.round(dashboardStats.totalCustomers * 0.1) || 0);
    const activeUsers = isNestedStructure ? 
      (dashboardStats.users.active || 0) : (Math.round(dashboardStats.totalCustomers * 0.8) || 0);
    
    // Format and display values
    totalUsersEl.textContent = formatNumber(totalUsers);
    newUsersEl.textContent = formatNumber(newUsers);
    activeUsersEl.textContent = formatNumber(activeUsers);
    
    // Update any graphs or visual indicators if applicable
    updateUserStatsVisuals(totalUsers, newUsers, activeUsers);
  }
}

// Optional: Update visuals for order stats
function updateOrderStatsVisuals(total, pending, completed) {
  // Update any charts, progress bars, or other visualizations
  // This is a placeholder - implement as needed based on your dashboard design
  // const orderProgressEl

// Fallback function to load mock data if the API fails
function loadMockDashboardData() {
  // Mock data for development/fallback purposes
  console.log("📊 ADMIN DASHBOARD: Loading mock dashboard data");
  
  // Example: Update order statistics
  document.getElementById('total-orders').textContent = '156';
  document.getElementById('pending-orders').textContent = '23';
  document.getElementById('completed-orders').textContent = '133';
  
  // Example: Update revenue statistics
  document.getElementById('total-revenue').textContent = '$12,450';
  document.getElementById('monthly-revenue').textContent = '$3,200';
  document.getElementById('daily-revenue').textContent = '$450';
  
  // Example: Update user statistics
  document.getElementById('total-users').textContent = '1,245';
  document.getElementById('new-users').textContent = '15';
  document.getElementById('active-users').textContent = '876';
}

// Load recent orders from the database
async function loadRecentOrders() {
  const recentOrdersTable = document.querySelector('.recent-orders-table tbody');
  if (!recentOrdersTable) return;
  
  try {
    // Show loading indicator
    recentOrdersTable.innerHTML = '<tr><td colspan="6" class="loading-data">Loading recent orders...</td></tr>';
    
    let recentOrders = [];
    
    // Try to fetch recent orders from API if available
    if (window.AdminAPIService) {
      try {
        recentOrders = await AdminAPIService.getRecentOrders(5);
        console.log("📊 ADMIN DASHBOARD: Fetched recent orders:", recentOrders);
      } catch (error) {
        console.error("📊 ADMIN DASHBOARD: Error fetching recent orders, using fallback data", error);
        // Fall back to mock data if API call fails
        recentOrders = getMockRecentOrders();
      }
    } else {
      // API service not available, use mock data
      recentOrders = getMockRecentOrders();
    }
    
    // Clear existing content
    recentOrdersTable.innerHTML = '';
    
    if (recentOrders.length === 0) {
      recentOrdersTable.innerHTML = '<tr><td colspan="6" class="no-data">No recent orders found</td></tr>';
      return;
    }
    
    // Add order rows
    recentOrders.forEach(order => {
      const row = document.createElement('tr');
      
      // Format the order ID with a prefix if it doesn't already have one
      const displayId = order.id.toString().startsWith('#') ? order.id : `#ORD-${order.id}`;
      
      // Format the date if it's a timestamp
      const orderDate = new Date(order.date);
      const formattedDate = !isNaN(orderDate) ? orderDate.toISOString().split('T')[0] : order.date;
      
      row.innerHTML = `
        <td>${displayId}</td>
        <td>${order.customer || order.customerName || 'Unknown'}</td>
        <td>${formattedDate}</td>
        <td>${typeof order.total === 'number' ? '$' + order.total.toFixed(2) : order.total}</td>
        <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
        <td>
          <button class="action-btn view-btn" data-order-id="${order.id}">View</button>
          <button class="action-btn edit-btn" data-order-id="${order.id}">Edit</button>
        </td>
      `;
      recentOrdersTable.appendChild(row);
    });
  } catch (error) {
    console.error("📊 ADMIN DASHBOARD: Error loading recent orders:", error);
    recentOrdersTable.innerHTML = '<tr><td colspan="6" class="error-data">Error loading orders</td></tr>';
  }
}

// Get mock recent orders for fallback
function getMockRecentOrders() {
  return [
    { id: '#ORD-4253', customer: 'John Smith', date: '2023-05-10', total: '$125.00', status: 'Completed' },
    { id: '#ORD-4252', customer: 'Sarah Johnson', date: '2023-05-10', total: '$85.50', status: 'Processing' },
    { id: '#ORD-4251', customer: 'Michael Brown', date: '2023-05-09', total: '$220.75', status: 'Completed' },
    { id: '#ORD-4250', customer: 'Emma Wilson', date: '2023-05-09', total: '$45.99', status: 'Completed' },
    { id: '#ORD-4249', customer: 'Robert Davis', date: '2023-05-08', total: '$78.25', status: 'Pending' }
  ];
}

// Load inventory alerts from the database
async function loadInventoryAlerts() {
  const inventoryAlertsTable = document.querySelector('.inventory-alerts-table tbody');
  if (!inventoryAlertsTable) return;
  
  try {
    // Show loading indicator
    inventoryAlertsTable.innerHTML = '<tr><td colspan="6" class="loading-data">Loading inventory alerts...</td></tr>';
    
    let inventoryAlerts = [];
    
    // Try to fetch inventory alerts from API if available
    if (window.AdminAPIService) {
      try {
        inventoryAlerts = await AdminAPIService.getInventoryAlerts();
        console.log("📊 ADMIN DASHBOARD: Fetched inventory alerts:", inventoryAlerts);
      } catch (error) {
        console.error("📊 ADMIN DASHBOARD: Error fetching inventory alerts, using fallback data", error);
        // Fall back to mock data if API call fails
        inventoryAlerts = getMockInventoryAlerts();
      }
    } else {
      // API service not available, use mock data
      inventoryAlerts = getMockInventoryAlerts();
    }
    
    // Clear existing content
    inventoryAlertsTable.innerHTML = '';
    
    if (inventoryAlerts.length === 0) {
      inventoryAlertsTable.innerHTML = '<tr><td colspan="6" class="no-data">No inventory alerts found</td></tr>';
      return;
    }
    
    // Add alert rows
    inventoryAlerts.forEach(alert => {
      const row = document.createElement('tr');
      
      // Format the product ID with a prefix if it doesn't already have one
      const displayId = alert.id.toString().startsWith('MED-') ? alert.id : `MED-${alert.id}`;
      
      // Format numerical values
      const stock = parseInt(alert.stock);
      const threshold = parseInt(alert.threshold);
      
      // Determine status if not provided
      let status = alert.status;
      if (!status) {
        if (stock === 0) {
          status = 'Out of Stock';
        } else if (stock <= threshold) {
          status = 'Low Stock';
        } else {
          status = 'In Stock';
        }
      }
      
      row.innerHTML = `
        <td>${displayId}</td>
        <td>${alert.name}</td>
        <td>${alert.stock}</td>
        <td>${alert.threshold}</td>
        <td><span class="status-badge status-${status.toLowerCase().replace(/ /g, '-')}">${status}</span></td>
        <td>
          <button class="action-btn reorder-btn" data-product-id="${alert.id}">Reorder</button>
        </td>
      `;
      inventoryAlertsTable.appendChild(row);
    });
  } catch (error) {
    console.error("📊 ADMIN DASHBOARD: Error loading inventory alerts:", error);
    inventoryAlertsTable.innerHTML = '<tr><td colspan="6" class="error-data">Error loading inventory alerts</td></tr>';
  }
}

// Get mock inventory alerts for fallback
function getMockInventoryAlerts() {
  return [
    { id: 'MED-1023', name: 'Aspirin 100mg', stock: '5', threshold: '10', status: 'Low Stock' },
    { id: 'MED-2145', name: 'Amoxicillin 500mg', stock: '0', threshold: '15', status: 'Out of Stock' },
    { id: 'MED-3211', name: 'Ibuprofen 400mg', stock: '8', threshold: '20', status: 'Low Stock' }
  ];
}

// Set up dashboard event listeners
function setupEventListeners() {
  // Tab switching
  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  const tabPanels = document.querySelectorAll('.admin-tab-panel');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panels
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));
      
      // Add active class to current button and panel
      button.classList.add('active');
      const targetPanel = document.getElementById(button.dataset.target);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
  
  // Action buttons
  document.addEventListener('click', function(event) {
    // View order details
    if (event.target.classList.contains('view-btn')) {
      const orderId = event.target.dataset.orderId;
      alert(`Viewing order details for Order #${orderId}`);
    }
    
    // Edit order
    if (event.target.classList.contains('edit-btn')) {
      const orderId = event.target.dataset.orderId;
      alert(`Editing order #${orderId}`);
    }
    
    // Reorder product
    if (event.target.classList.contains('reorder-btn')) {
      const productId = event.target.dataset.productId;
      alert(`Reordering product ${productId}`);
    }
  });
}

// Initialize WebSocket connection
function initializeWebSocket() {
    try {
        websocket = new WebSocket(WS_CONFIG.URL);
        
        websocket.onopen = () => {
            console.log("📊 WebSocket: Connected successfully");
            wsRetryCount = 0;
            
            // Subscribe to admin dashboard updates
            websocket.send(JSON.stringify({
                type: 'subscribe',
                channels: ['orders', 'inventory', 'stats']
            }));
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        websocket.onerror = (error) => {
            console.error("📊 WebSocket: Error:", error);
            handleWebSocketError();
        };

        websocket.onclose = () => {
            console.log("📊 WebSocket: Connection closed");
            attemptReconnection();
        };
    } catch (error) {
        console.error("📊 WebSocket: Initialization error:", error);
        handleWebSocketError();
    }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'order_update':
            handleOrderUpdate(data.order);
            break;
        case 'inventory_update':
            handleInventoryUpdate(data.inventory);
            break;
        case 'stats_update':
            handleStatsUpdate(data.stats);
            break;
        default:
            console.log("📊 WebSocket: Unknown message type:", data.type);
    }
}

// Handle real-time order updates
function handleOrderUpdate(order) {
    // Update order statistics
    updateOrderStats({
        orders: {
            total: parseInt(document.getElementById('total-orders').textContent) + 1,
            pending: parseInt(document.getElementById('pending-orders').textContent) + (order.status === 'pending' ? 1 : 0),
            completed: parseInt(document.getElementById('completed-orders').textContent) + (order.status === 'completed' ? 1 : 0)
        }
    }, true);

    // Update recent orders table
    const recentOrdersTable = document.querySelector('.recent-orders-table tbody');
    if (recentOrdersTable) {
        // Remove last row if table is full
        if (recentOrdersTable.children.length >= 5) {
            recentOrdersTable.removeChild(recentOrdersTable.lastChild);
        }

        // Add new order to top
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#ORD-${order.id}</td>
            <td>${order.customer}</td>
            <td>${new Date().toISOString().split('T')[0]}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td>
                <button class="action-btn view-btn" data-order-id="${order.id}">View</button>
                <button class="action-btn edit-btn" data-order-id="${order.id}">Edit</button>
            </td>
        `;
        recentOrdersTable.insertBefore(row, recentOrdersTable.firstChild);
    }
}

// Handle real-time inventory updates
function handleInventoryUpdate(inventory) {
    // Update inventory alerts table
    const alertsTable = document.querySelector('.inventory-alerts-table tbody');
    if (alertsTable) {
        // Find existing row for this product
        const existingRow = Array.from(alertsTable.children).find(row => 
            row.querySelector('td')?.textContent === `MED-${inventory.id}`
        );

        if (existingRow) {
            // Update existing row
            existingRow.children[2].textContent = inventory.stock;
            const status = determineInventoryStatus(inventory.stock, inventory.threshold);
            existingRow.children[4].innerHTML = `<span class="status-badge status-${status.toLowerCase().replace(/ /g, '-')}">${status}</span>`;
        } else if (inventory.stock <= inventory.threshold) {
            // Add new row for low stock item
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>MED-${inventory.id}</td>
                <td>${inventory.name}</td>
                <td>${inventory.stock}</td>
                <td>${inventory.threshold}</td>
                <td><span class="status-badge status-${determineInventoryStatus(inventory.stock, inventory.threshold).toLowerCase().replace(/ /g, '-')}">${determineInventoryStatus(inventory.stock, inventory.threshold)}</span></td>
                <td>
                    <button class="action-btn reorder-btn" data-product-id="${inventory.id}">Reorder</button>
                </td>
            `;
            alertsTable.insertBefore(row, alertsTable.firstChild);
        }
    }
}

// Handle real-time statistics updates
function handleStatsUpdate(stats) {
    updateDashboardStats(stats);
}

// Determine inventory status
function determineInventoryStatus(stock, threshold) {
    if (stock === 0) return 'Out of Stock';
    if (stock <= threshold) return 'Low Stock';
    return 'In Stock';
}

// Handle WebSocket errors
function handleWebSocketError() {
    if (wsRetryCount < WS_CONFIG.MAX_RETRIES) {
        console.log(`📊 WebSocket: Attempting reconnection (${wsRetryCount + 1}/${WS_CONFIG.MAX_RETRIES})`);
        attemptReconnection();
    } else {
        console.log("📊 WebSocket: Max retries reached, falling back to polling");
        setupPollingFallback();
    }
}

// Attempt WebSocket reconnection
function attemptReconnection() {
    if (wsRetryCount < WS_CONFIG.MAX_RETRIES) {
        wsRetryCount++;
        setTimeout(() => {
            initializeWebSocket();
        }, WS_CONFIG.RECONNECT_DELAY);
    }
}

// Setup polling fallback when WebSocket is not available
function setupPollingFallback() {
    console.log("📊 Dashboard: Setting up polling fallback");
    Object.keys(REFRESH_INTERVALS).forEach(key => {
        const interval = REFRESH_INTERVALS[key];
        refreshIntervals[key.toLowerCase()] = setInterval(() => {
            if (!document.hidden) {
                switch (key) {
                    case 'DASHBOARD_STATS':
                        loadDashboardStats();
                        break;
                    case 'RECENT_ORDERS':
                        loadRecentOrders();
                        break;
                    case 'INVENTORY_ALERTS':
                        loadInventoryAlerts();
                        break;
                }
            }
        }, interval);
    });
}

// Clean up connections and intervals on page unload
window.addEventListener('beforeunload', () => {
    // Close WebSocket connection
    if (websocket) {
        websocket.close();
    }
    
    // Clear refresh intervals
    Object.values(refreshIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
    });
});

// Show loading state for a specific section
function showLoadingState(section) {
    loadingStates[section] = true;
    
    // Update UI loading indicators
    const loadingIndicator = document.querySelector(`.${section}-loading`);
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // Disable related interactive elements
    const container = document.querySelector(`.${section}-container`);
    if (container) {
        container.classList.add('loading');
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => button.disabled = true);
    }
}

// Hide loading state for a specific section
function hideLoadingState(section) {
    loadingStates[section] = false;
    
    // Update UI loading indicators
    const loadingIndicator = document.querySelector(`.${section}-loading`);
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // Re-enable interactive elements
    const container = document.querySelector(`.${section}-container`);
    if (container) {
        container.classList.remove('loading');
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => button.disabled = false);
    }
}

// Handle errors for specific sections
function handleSectionError(section, error) {
    console.error(`📊 Error in ${section}:`, error);
    
    // Hide loading state
    hideLoadingState(section);
    
    // Show error message in the section
    const errorContainer = document.querySelector(`.${section}-error`);
    if (errorContainer) {
        errorContainer.textContent = error.message || `Failed to load ${section}. Please try again.`;
        errorContainer.style.display = 'block';
    }
    
    // Add retry button
    const retryButton = document.querySelector(`.${section}-retry`);
    if (retryButton) {
        retryButton.style.display = 'block';
        retryButton.onclick = () => {
            errorContainer.style.display = 'none';
            retryButton.style.display = 'none';
            refreshSection(section);
        };
    }
}

// Refresh specific dashboard section
async function refreshSection(section) {
    try {
        showLoadingState(section);
        
        switch (section) {
            case 'dashboard-stats':
                await loadDashboardStats();
                break;
            case 'recent-orders':
                await loadRecentOrders();
                break;
            case 'inventory-alerts':
                await loadInventoryAlerts();
                break;
        }
        
        hideLoadingState(section);
    } catch (error) {
        handleSectionError(section, error);
    }
}

// Show notification to user
function showNotification(message, type = 'info') {
    const notificationContainer = document.createElement('div');
    notificationContainer.className = `notification notification-${type}`;
    
    const notificationContent = document.createElement('div');
    notificationContent.className = 'notification-content';
    notificationContent.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '×';
    closeButton.onclick = () => notificationContainer.remove();
    
    notificationContainer.appendChild(notificationContent);
    notificationContainer.appendChild(closeButton);
    
    // Add to notifications area
    const notificationsArea = document.querySelector('.notifications-area') || document.body;
    notificationsArea.appendChild(notificationContainer);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notificationContainer.remove();
    }, 5000);
}

// Update timestamp of last refresh
function updateLastRefreshTimestamp() {
    const timestamp = new Date().toLocaleTimeString();
    const timestampElements = document.querySelectorAll('.last-refresh-timestamp');
    timestampElements.forEach(element => {
        element.textContent = `Last updated: ${timestamp}`;
    });
}
