// E-Pharma Admin API Service
// This file provides centralized methods for interacting with the E-Pharma database API

const AdminAPIService = {
  // Base API URL - configured to use the actual backend API
  baseURL: 'https://epharma-api.herokuapp.com/api',
  
  // Get auth token from localStorage using the correct key from the actual website
  getAuthToken() {
    return localStorage.getItem('e_pharma_auth_token') || localStorage.getItem('token');
  },
  
  // Get user info from localStorage
  getUserInfo() {
    try {
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        return JSON.parse(userInfoStr);
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
      
      console.log(`📡 API: ${method} request to ${url}`);
      
      // First check if the user is logged in and has a valid token
      const userInfo = this.getUserInfo();
      if (!userInfo || !userInfo.role) {
        console.error('📡 API: User not logged in or missing role');
        throw new Error('Authentication required. Please log in.');
      }
      
      // Check if user has admin role
      if (userInfo.role.toLowerCase() !== 'admin') {
        console.error('📡 API: User does not have admin role');
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
      
      const response = await fetch(url, options);
      
      // Special handling for 401 Unauthorized - could be expired token
      if (response.status === 401) {
        console.error('📡 API: Authentication token expired or invalid');
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
    } catch (error) {
      console.error(`📡 API Error: ${error.message}`);
      
      // Try to use localStorage data as fallback
      if (endpoint.includes('users') && method === 'GET') {
        console.log('📡 API: Attempting to use localStorage data as fallback for user data');
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
    return this.apiRequest('admin/users');
  },
  
  // Get user by ID
  async getUserById(userId) {
    return this.apiRequest(`admin/users/${userId}`);
  },
  
  // Create new user
  async createUser(userData) {
    return this.apiRequest('admin/users', 'POST', userData);
  },
  
  // Update user
  async updateUser(userId, userData) {
    return this.apiRequest(`admin/users/${userId}`, 'PUT', userData);
  },
  
  // Change user role
  async changeUserRole(userId, role) {
    return this.apiRequest(`admin/users/${userId}/role`, 'PATCH', { role });
  },
  
  // Delete user
  async deleteUser(userId) {
    return this.apiRequest(`admin/users/${userId}`, 'DELETE');
  },
  
  // PRODUCT MANAGEMENT API
  
  // Get all products
  async getProducts() {
    return this.apiRequest('admin/products');
  },
  
  // Get product by ID
  async getProductById(productId) {
    return this.apiRequest(`admin/products/${productId}`);
  },
  
  // Create new product
  async createProduct(productData) {
    return this.apiRequest('admin/products', 'POST', productData);
  },
  
  // Update product
  async updateProduct(productId, productData) {
    return this.apiRequest(`admin/products/${productId}`, 'PUT', productData);
  },
  
  // Delete product
  async deleteProduct(productId) {
    return this.apiRequest(`admin/products/${productId}`, 'DELETE');
  },
  
  // Update product inventory
  async updateInventory(productId, quantity) {
    return this.apiRequest(`admin/products/${productId}/inventory`, 'PATCH', { quantity });
  },
  
  // ORDER MANAGEMENT API
  
  // Get all orders
  async getOrders() {
    return this.apiRequest('admin/orders');
  },
  
  // Get order by ID
  async getOrderById(orderId) {
    return this.apiRequest(`admin/orders/${orderId}`);
  },
  
  // Create new order
  async createOrder(orderData) {
    return this.apiRequest('admin/orders', 'POST', orderData);
  },
  
  // Update order status
  async updateOrderStatus(orderId, status) {
    return this.apiRequest(`admin/orders/${orderId}/status`, 'PATCH', { status });
  },
  
  // Delete order
  async deleteOrder(orderId) {
    return this.apiRequest(`admin/orders/${orderId}`, 'DELETE');
  },
  
  // DASHBOARD STATISTICS API
  
  // Get dashboard statistics
  async getDashboardStats() {
    return this.apiRequest('admin/dashboard/stats');
  },
  
  // Get recent orders for dashboard
  async getRecentOrders(limit = 5) {
    return this.apiRequest(`admin/dashboard/recent-orders?limit=${limit}`);
  },
  
  // Get inventory alerts
  async getInventoryAlerts() {
    return this.apiRequest('admin/dashboard/inventory-alerts');
  },
  
  // Get user statistics
  async getUserStats() {
    return this.apiRequest('admin/dashboard/user-stats');
  },
  
  // Get sales statistics
  async getSalesStats(period = 'monthly') {
    return this.apiRequest(`admin/dashboard/sales-stats?period=${period}`);
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
    
    // For user management errors, try to use localStorage as fallback
    if (endpoint.includes('users') && endpoint.includes('GET')) {
      const userInfo = this.getUserInfo();
      if (userInfo) {
        console.log("📡 API: Using localStorage data as fallback");
        return [userInfo];
      }
    }
    
    // Return null to indicate error
    return null;
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
