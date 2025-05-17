// E-Pharma Admin API Service
// This file provides centralized methods for interacting with the E-Pharma database API

const AdminAPIService = {
  // Base API URL - configured to use the actual backend server
  baseURL: 'http://localhost:5000/api',
  
  // Track loading states for different data types
  loadingStates: {
    dashboardStats: false,
    orderStats: false,
    revenueStats: false,
    userStats: false,
    recentOrders: false,
    inventoryAlerts: false
  },
  
  // Store last refresh timestamps
  lastRefreshTimestamps: {
    dashboardStats: null,
    orderStats: null,
    revenueStats: null,
    userStats: null,
    recentOrders: null,
    inventoryAlerts: null
  },
  
  // Get auth token using header-fix.js if available, or fallback to localStorage
  getAuthToken() {
    // Use the global function from header-fix.js if available
    if (window.getLoginToken && typeof window.getLoginToken === 'function') {
      const token = window.getLoginToken();
      console.log("📡 API: Using token from header-fix.js");
      return token;
    }
    
    // Fallback to direct localStorage access
    const token = localStorage.getItem('e_pharma_auth_token') || localStorage.getItem('token');
    console.log("📡 API: Using token from localStorage");
    return token;
  },
  
  // Get user info using header-fix.js if available, or fallback to localStorage
  getUserInfo() {
    // Use the global function from header-fix.js if available
    if (window.getUserInfo && typeof window.getUserInfo === 'function') {
      const userInfo = window.getUserInfo();
      console.log("📡 API: Using user info from header-fix.js");
      return userInfo;
    }
    
    // Fallback to direct localStorage access
    try {
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        console.log("📡 API: Using user info from localStorage");
        return userInfo;
      }
      return null;
    } catch (e) {
      console.error('Error parsing user info:', e);
      return null;
    }
  },
  
  // Common headers for API requests
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  },
  
  // Generic API request method with compatibility for your authentication system
  async apiRequest(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseURL}/${endpoint}`;
      const options = {
        method: method,
        headers: this.getHeaders(),
        credentials: 'include' // Include credentials for cross-origin requests if needed
      };
      
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }
      
      console.log(`💻 API: ${method} request to ${url}`);
      
      // First check if the user is logged in and has a valid token
      const userInfo = this.getUserInfo();
      if (!userInfo || !userInfo.role) {
        console.error('💻 API: User not logged in or missing role');
        throw new Error('Authentication required. Please log in.');
      }
      
      // Check if user has admin role
      if (userInfo.role.toLowerCase() !== 'admin') {
        console.error('💻 API: User does not have admin role');
        throw new Error('Admin privileges required.');
      }
      
      // Use the token information from the console logs
      const token = this.getAuthToken();
      if (!token) {
        // If we have user info but no token, try to get token from user_info
        if (userInfo.token) {
          options.headers['Authorization'] = `Bearer ${userInfo.token}`;
        } else {
          throw new Error('No authentication token found');
        }
      }
      
      try {
        const response = await fetch(url, options);
        
        // Special handling for 401 Unauthorized - could be expired token
        if (response.status === 401) {
          console.error('💻 API: Authentication token expired or invalid');
          throw new Error('Authentication token expired. Please log in again.');
        }
        
        // Handle other non-success responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
        }
        
        // Parse JSON response if content exists
        if (response.status !== 204) { // 204 No Content
          const responseData = await response.json();
          return responseData;
        }
        
        return true; // Success with no content
      } catch (fetchError) {
        console.error(`💻 API: Fetch error: ${fetchError.message}`);
        // Intentionally throwing the error to be caught by the outer catch block
        // This allows us to use mock data as fallback
        throw fetchError;
      }
    } catch (error) {
      console.error(`💻 API Error: ${error.message}`);
      
      // Check if we have AdminMockData available
      if (window.AdminMockData) {
        console.log(`💻 API: Using mock data for ${endpoint}`);
        
        // Return appropriate mock data based on the endpoint
        if (endpoint.includes('users')) {
          if (method === 'GET') {
            if (endpoint.includes('/') && !endpoint.endsWith('/users')) {
              // For specific user - extract user ID
              const userId = parseInt(endpoint.split('/').pop());
              const user = window.AdminMockData.users.find(u => u.id === userId);
              return user || null;
            }
            // For all users
            return [...window.AdminMockData.users];
          }
        } else if (endpoint.includes('products')) {
          if (method === 'GET') {
            if (endpoint.includes('/') && !endpoint.endsWith('/products')) {
              // For specific product
              const productId = parseInt(endpoint.split('/').pop());
              const product = window.AdminMockData.products.find(p => p.id === productId);
              return product || null;
            }
            // For all products
            return [...window.AdminMockData.products];
          }
        } else if (endpoint.includes('orders')) {
          if (method === 'GET') {
            if (endpoint.includes('/') && !endpoint.endsWith('/orders')) {
              // For specific order
              const orderId = parseInt(endpoint.split('/').pop());
              const order = window.AdminMockData.orders.find(o => o.id === orderId);
              return order || null;
            }
            // For all orders
            return [...window.AdminMockData.orders];
          }
        } else if (endpoint.includes('dashboard/stats')) {
          return {...window.AdminMockData.dashboardStats};
        } else if (endpoint.includes('recent-orders')) {
          // Get limit parameter if exists
          const limit = endpoint.includes('limit=') ? 
            parseInt(endpoint.split('limit=')[1]) : 5;
          // Return a copy of the orders array to prevent modification of the original
          return [...window.AdminMockData.orders].slice(0, limit);
        } else if (endpoint.includes('inventory-alerts')) {
          return [...window.AdminMockData.inventoryAlerts];
        }
      }
      
      // Try to use localStorage data as fallback for user data
      if (endpoint.includes('users') && method === 'GET') {
        console.log('💻 API: Attempting to use localStorage data as fallback for user data');
        const userInfo = this.getUserInfo();
        if (userInfo) {
          return [userInfo]; // Return the current user as an array for getUsers()
        }
      }
      
      throw error;
    }
  },
  
  // USER MANAGEMENT API
  
  // Get all users
  async getUsers() {
    return this.apiRequest('users');
  },
  
  // Get user by ID
  async getUserById(userId) {
    return this.apiRequest(`users/${userId}`);
  },
  
  // Create new user
  async createUser(userData) {
    return this.apiRequest('users', 'POST', userData);
  },
  
  // Update user
  async updateUser(userId, userData) {
    return this.apiRequest(`users/${userId}`, 'PUT', userData);
  },
  
  // Change user role
  async changeUserRole(userId, role) {
    // The server might not have a specific endpoint for role changes,
    // so we use the update user endpoint with just the role property
    return this.apiRequest(`users/${userId}`, 'PUT', { role });
  },
  
  // Delete user
  async deleteUser(userId) {
    return this.apiRequest(`users/${userId}`, 'DELETE');
  },
  
  // PRODUCT MANAGEMENT API
  
  // Get all products
  async getProducts() {
    return this.apiRequest('products');
  },
  
  // Get product by ID
  async getProductById(productId) {
    return this.apiRequest(`products/${productId}`);
  },
  
  // Create new product
  async createProduct(productData) {
    return this.apiRequest('products', 'POST', productData);
  },
  
  // Update product
  async updateProduct(productId, productData) {
    return this.apiRequest(`products/${productId}`, 'PUT', productData);
  },
  
  // Delete product
  async deleteProduct(productId) {
    return this.apiRequest(`products/${productId}`, 'DELETE');
  },
  
  // Update product inventory
  async updateInventory(productId, quantity) {
    // The server might not have a specific inventory endpoint,
    // so we use the update product endpoint with just the quantity property
    return this.apiRequest(`products/${productId}`, 'PUT', { stock: quantity });
  },
  
  // ORDER MANAGEMENT API
  
  // Get all orders
  async getOrders() {
    return this.apiRequest('orders');
  },
  
  // Get order by ID
  async getOrderById(orderId) {
    return this.apiRequest(`orders/${orderId}`);
  },
  
  // Create new order
  async createOrder(orderData) {
    return this.apiRequest('orders', 'POST', orderData);
  },
  
  // Update order status
  async updateOrderStatus(orderId, status) {
    return this.apiRequest(`orders/${orderId}`, 'PUT', { status });
  },
  
  // Delete order
  async deleteOrder(orderId) {
    return this.apiRequest(`orders/${orderId}`, 'DELETE');
  },
  
  // DASHBOARD STATISTICS API
  
  // Get all dashboard statistics or specific categories
  async getDashboardStats(categories = ['orders', 'revenue', 'users']) {
    this.loadingStates.dashboardStats = true;
    
    try {
      // Update the endpoint to allow specifying which categories to retrieve
      const categoriesParam = categories.join(',');
      const result = await this.apiRequest(`dashboard/admin?categories=${categoriesParam}`);
      
      // Update last refresh timestamp
      this.lastRefreshTimestamps.dashboardStats = new Date();
      
      return result;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    } finally {
      this.loadingStates.dashboardStats = false;
    }
  },
  
  // Get order statistics
  async getOrderStats() {
    this.loadingStates.orderStats = true;
    
    try {
      const result = await this.apiRequest('dashboard/admin/orders');
      this.lastRefreshTimestamps.orderStats = new Date();
      return result;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    } finally {
      this.loadingStates.orderStats = false;
    }
  },
  
  // Get revenue statistics with period filter
  async getRevenueStats(period = 'all') {
    this.loadingStates.revenueStats = true;
    
    try {
      const result = await this.apiRequest(`dashboard/admin/revenue?period=${period}`);
      this.lastRefreshTimestamps.revenueStats = new Date();
      return result;
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    } finally {
      this.loadingStates.revenueStats = false;
    }
  },
  
  // Get user statistics
  async getUserStats() {
    this.loadingStates.userStats = true;
    
    try {
      const result = await this.apiRequest('dashboard/admin/users');
      this.lastRefreshTimestamps.userStats = new Date();
      return result;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    } finally {
      this.loadingStates.userStats = false;
    }
  },
  
  // Get recent orders for dashboard with auto-refresh capability
  async getRecentOrders(limit = 5, forceRefresh = false) {
    // Check if we should use cached data (within last 30 seconds)
    const lastRefresh = this.lastRefreshTimestamps.recentOrders;
    const now = new Date();
    
    if (!forceRefresh && lastRefresh && (now - lastRefresh) < 30000) {
      console.log('Using cached recent orders (refreshed less than 30 seconds ago)');
      return this._cachedRecentOrders;
    }
    
    this.loadingStates.recentOrders = true;
    
    try {
      // Get recent orders from the orders endpoint with a limit parameter
      const result = await this.apiRequest(`orders?limit=${limit}&sort=-createdAt`);
      
      // Cache the result
      this._cachedRecentOrders = result;
      this.lastRefreshTimestamps.recentOrders = now;
      
      return result;
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    } finally {
      this.loadingStates.recentOrders = false;
    }
  },
  
  // Get inventory alerts with auto-refresh capability
  async getInventoryAlerts(forceRefresh = false) {
    // Check if we should use cached data (within last minute)
    const lastRefresh = this.lastRefreshTimestamps.inventoryAlerts;
    const now = new Date();
    
    if (!forceRefresh && lastRefresh && (now - lastRefresh) < 60000) {
      console.log('Using cached inventory alerts (refreshed less than a minute ago)');
      return this._cachedInventoryAlerts;
    }
    
    this.loadingStates.inventoryAlerts = true;
    
    try {
      // Get products with low stock
      const result = await this.apiRequest('dashboard/admin/inventory-alerts');
      
      // Cache the result
      this._cachedInventoryAlerts = result;
      this.lastRefreshTimestamps.inventoryAlerts = now;
      
      return result;
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      throw error;
    } finally {
      this.loadingStates.inventoryAlerts = false;
    }
  },
  
  // Get sales statistics with period and comparison options
  async getSalesStats(period = 'monthly', compareWithPrevious = false) {
    try {
      // Enhanced endpoint with comparison option
      return this.apiRequest(`dashboard/admin/sales?period=${period}&compare=${compareWithPrevious}`);
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      throw error;
    }
  },
  
  // Refresh all dashboard data at once
  async refreshDashboard() {
    console.log('Refreshing all dashboard data...');
    
    try {
      // Fetch all data types in parallel
      const [
        dashboardStats, 
        recentOrders, 
        inventoryAlerts
      ] = await Promise.all([
        this.getDashboardStats(['orders', 'revenue', 'users']),
        this.getRecentOrders(5, true),
        this.getInventoryAlerts(true)
      ]);
      
      return {
        dashboardStats,
        recentOrders,
        inventoryAlerts,
        refreshedAt: new Date()
      };
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      throw error;
    }
  },
  
  // Check if any data is currently loading
  isLoading(dataType = null) {
    if (dataType) {
      return this.loadingStates[dataType] === true;
    }
    
    // Check if any data type is loading
    return Object.values(this.loadingStates).some(state => state === true);
  },
  
  // Method to check admin access and read token from the existing authentication system
  checkAdminAccess() {
    let token, userInfo;
    
    // Try to get token using various mechanisms from header-fix.js
    if (window.getLoginToken && typeof window.getLoginToken === 'function') {
      token = window.getLoginToken();
    } else {
      token = this.getAuthToken();
    }
    
    // Try to get user info using various mechanisms from header-fix.js
    if (window.getUserInfo && typeof window.getUserInfo === 'function') {
      userInfo = window.getUserInfo();
    } else {
      userInfo = this.getUserInfo();
    }
    
    if (!token || !userInfo) {
      console.error("📡 ADMIN ACCESS: No token or user info found");
      return { isAdmin: false, error: "Authentication required" };
    }
    
    // Check if user has admin role
    if (userInfo.role && userInfo.role.toLowerCase() === 'admin') {
      return { isAdmin: true, token, userInfo };
    }
    
    return { isAdmin: false, error: "Admin privileges required" };
  },
  
  // Method to handle API errors specifically for admin API
  handleApiError(error, endpoint) {
    console.error(`📡 API Error: ${error.message}`);
    
    // Clear any loading states that might be stuck
    Object.keys(this.loadingStates).forEach(key => {
      this.loadingStates[key] = false;
    });
    
    // Check if we need to redirect to login page
    if (error.message.includes('Authentication required') || 
        error.message.includes('token expired') ||
        error.message.includes('invalid')) {
      // Attempt logout if available from header-fix.js
      if (window.setUserLoggedOut && typeof window.setUserLoggedOut === 'function') {
        window.setUserLoggedOut();
      } else {
        // Fallback logout
        localStorage.removeItem('e_pharma_auth_token');
        localStorage.removeItem('user_info');
      }
      
      alert("Your session has expired. Please log in again.");
      window.location.href = 'login.html';
      return null;
    }
    
    // For dashboard-related errors, try to use mock data as fallback
    if (endpoint.includes('dashboard')) {
      console.log("📡 API: Using mock data fallback for dashboard");
      
      // Return mock data based on endpoint
      if (endpoint.includes('orders')) {
        return {
          total: 156,
          pending: 23,
          completed: 133,
          recent: this._getMockRecentOrders(5)
        };
      } else if (endpoint.includes('revenue')) {
        return {
          total: 12450,
          monthly: 3200,
          daily: 450,
          growth: 5.2
        };
      } else if (endpoint.includes('users')) {
        return {
          total: 1245,
          new: 15,
          active: 876
        };
      } else if (endpoint.includes('inventory-alerts')) {
        return this._getMockInventoryAlerts();
      }
      
      // Generic dashboard stats
      return {
        orders: {
          total: 156,
          pending: 23,
          completed: 133
        },
        revenue: {
          total: 12450,
          monthly: 3200,
          daily: 450
        },
        users: {
          total: 1245,
          new: 15,
          active: 876
        }
      };
    }
    
    // For user management errors, try to use localStorage as fallback
  }
};

// Integration with the existing header-fix.js system
if (window.addLoginStateChangeListener && typeof window.addLoginStateChangeListener === 'function') {
  window.addLoginStateChangeListener(function(isLoggedIn, userInfo) {
    if (isLoggedIn && userInfo && userInfo.role === 'admin') {
      console.log("📡 Admin API Service: Admin user logged in");
    } else if (!isLoggedIn) {
      console.log("📡 Admin API Service: User logged out");
    }
  });
}

// Export the service
window.AdminAPIService = AdminAPIService;
console.log("📡 Admin API Service initialized");
