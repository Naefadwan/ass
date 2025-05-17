// API base URL - update this to your actual API endpoint
const API_BASE_URL = 'http://localhost:5000/api';

// Define API endpoints based on actual backend structure
const ENDPOINTS = {
    auth: {
        login: `${API_BASE_URL}/auth/login`,
        register: `${API_BASE_URL}/auth/register`,
        verifyToken: `${API_BASE_URL}/auth/verify-token`
    },
    dashboard: {
        patient: `${API_BASE_URL}/dashboard/patient`,
        doctor: `${API_BASE_URL}/dashboard/doctor`,
        pharmacist: `${API_BASE_URL}/dashboard/pharmacist`
    },
    user: {
        profile: `${API_BASE_URL}/auth/profile`,
        update: `${API_BASE_URL}/auth/profile`
    },
    prescription: {
        list: `${API_BASE_URL}/prescription`,
        details: (id) => `${API_BASE_URL}/prescription/${id}`,
        create: `${API_BASE_URL}/prescription`,
        update: (id) => `${API_BASE_URL}/prescription/${id}`,
        delete: (id) => `${API_BASE_URL}/prescription/${id}`,
        uploadImage: (id) => `${API_BASE_URL}/prescription/${id}/image`,
        requestRefill: (id) => `${API_BASE_URL}/prescription/${id}/refill`,
        count: `${API_BASE_URL}/prescription/count`
    },
    medicine: {
        list: `${API_BASE_URL}/medicine`,
        details: (id) => `${API_BASE_URL}/medicine/${id}`
    },
    order: {
        list: `${API_BASE_URL}/order`,
        details: (id) => `${API_BASE_URL}/order/${id}`,
        create: `${API_BASE_URL}/order`
    }
};

// Connection status checker
const API_STATUS = {
    check: async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
            if (response.ok) {
                console.log('API connection successful');
                localStorage.setItem('api_connection_status', 'connected');
                localStorage.setItem('api_connection_timestamp', Date.now().toString());
                return true;
            } else {
                console.warn('API returned non-OK status:', response.status);
                localStorage.setItem('api_connection_status', 'disconnected');
                localStorage.setItem('api_connection_timestamp', Date.now().toString());
                return false;
            }
        } catch (error) {
            console.error('API connection error:', error);
            localStorage.setItem('api_connection_status', 'disconnected');
            localStorage.setItem('api_connection_timestamp', Date.now().toString());
            return false;
        }
    },
    
    isConnected: function() {
        const status = localStorage.getItem('api_connection_status');
        const timestamp = parseInt(localStorage.getItem('api_connection_timestamp') || '0');
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        // If status is stale, trigger a new check but don't wait for it
        if (now - timestamp > maxAge) {
            this.check();
        }
        
        return status === 'connected';
    }
};

// Get token from localStorage (integrating with header-fix.js)
function getToken() {
    // Print all tokens for debugging
    console.log('Debug - Auth tokens in localStorage:');
    console.log('e_pharma_auth_token:', localStorage.getItem('e_pharma_auth_token'));
    console.log('authToken:', localStorage.getItem('authToken'));
    console.log('token:', localStorage.getItem('token'));
    
    // First try e_pharma_auth_token (from header-fix.js)
    const epharmToken = localStorage.getItem('e_pharma_auth_token');
    if (epharmToken) {
        return epharmToken;
    }
    
    // Then try other possible token keys
    return localStorage.getItem('authToken') || localStorage.getItem('token');
}

// Check if user is logged in function
function isLoggedIn() {
    return !!getToken();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard loading...');
    
    // First check if header-fix.js is loaded and working
    if (typeof window.isUserLoggedIn === 'function') {
        console.log('Using header-fix.js for authentication');
        // Use the header-fix.js authentication
        if (!window.isUserLoggedIn()) {
            console.log('Not logged in, redirecting to login');
            window.location.href = './login.html';
            return;
        }
    } else {
        // Fallback to our own auth check
        console.log('Using fallback authentication check');
        if (!isLoggedIn()) {
            console.log('Not logged in, redirecting to login');
            window.location.href = './login.html';
            return;
        }
    }
    
    // Initialize the dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load data from API
    loadDashboardData();
});

// Function to create debug token for testing if real token doesn't work
function createDebugToken() {
    const debugToken = 'debug_token_' + Date.now();
    console.log('Creating debug token for testing:', debugToken);
    localStorage.setItem('e_pharma_auth_token', debugToken);
    return debugToken;
}

function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Set user information
    fetchUserInfo();
    
    // Initialize notifications
    fetchNotifications();
}

// Function to fetch user info
async function fetchUserInfo() {
    try {
        // First try to get user info from AdminAPIService if available
        if (typeof window.AdminAPIService !== 'undefined' && typeof window.AdminAPIService.getUserInfo === 'function') {
            console.log('Getting user info from AdminAPIService');
            const userInfo = window.AdminAPIService.getUserInfo();
            if (userInfo && (userInfo.name || userInfo.username)) {
                console.log('User info from AdminAPIService:', userInfo);
                updateUIWithUserInfo(userInfo);
                return;
            }
        }
        
        // Next try header-fix.js if available
        if (typeof window.getUserInfo === 'function') {
            console.log('Getting user info from header-fix.js');
            const userInfo = window.getUserInfo();
            if (userInfo && (userInfo.name || userInfo.username)) {
                console.log('User info from header-fix.js:', userInfo);
                updateUIWithUserInfo(userInfo);
                return;
            }
        }
        
        // If above methods don't have user info, try the API directly
        console.log('Fetching user info from API');
        const response = await fetch(ENDPOINTS.user.profile, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            console.warn('API returned error, status:', response.status);
            throw new Error('Failed to fetch user info');
        }
        
        // Extract user data from response based on actual API structure
        const responseData = await response.json();
        const userInfo = responseData.data || responseData;
        
        console.log('User info received from API:', userInfo);
        
        // Store the user info in localStorage for future use
        try {
            localStorage.setItem('e_pharma_user_info', JSON.stringify(userInfo));
        } catch (e) {
            console.warn('Failed to save user info to localStorage', e);
        }
        
        updateUIWithUserInfo(userInfo);
        
    } catch (error) {
        console.error('Error fetching user info:', error);
        
        // Try to get user info from localStorage before using default
        try {
            const storedUserInfo = localStorage.getItem('e_pharma_user_info');
            if (storedUserInfo) {
                const userInfo = JSON.parse(storedUserInfo);
                console.log('Using user info from localStorage:', userInfo);
                updateUIWithUserInfo(userInfo);
                return;
            }
        } catch (e) {
            console.warn('Failed to get user info from localStorage', e);
        }
        
        // Use default user info if all else fails
        console.log('Using default user info');
        setDefaultUserInfo();
        
        // Show a warning toast that we're using default data
        const notificationsArea = document.querySelector('.notifications-area');
        if (notificationsArea) {
            const toast = document.createElement('div');
            toast.className = 'toast warning';
            toast.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>Unable to load your profile data. Using default user information.</span>
                <button class="close-toast">&times;</button>
            `;
            notificationsArea.appendChild(toast);
            
            // Add close button event listener
            toast.querySelector('.close-toast').addEventListener('click', () => {
                toast.remove();
            });
            
            // Auto close after 5 seconds
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 500);
            }, 5000);
        }
    }
}

function updateUIWithUserInfo(userInfo) {
    // Set user name in various places
    const userNameElements = document.querySelectorAll('#userName, #welcomeUserName, #profileName');
    userNameElements.forEach(element => {
        if (element) element.textContent = userInfo.name || userInfo.username || 'User';
    });
    
    // Set user email
    const userEmailElement = document.getElementById('profileEmail');
    if (userEmailElement) userEmailElement.textContent = userInfo.email || 'user@example.com';
    
    // Set avatar text (first letter of name)
    const name = userInfo.name || userInfo.username || 'User';
    const avatarText = name.charAt(0).toUpperCase();
    const avatarElements = document.querySelectorAll('#userAvatar, #profileAvatar');
    avatarElements.forEach(element => {
        if (element) element.textContent = avatarText;
    });
    
    // Set member since date
    const memberSinceElement = document.getElementById('memberSince');
    if (memberSinceElement && userInfo.createdAt) {
        const date = new Date(userInfo.createdAt);
        memberSinceElement.textContent = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
    }
    
    // Set profile information
    if (userInfo.phone) {
        const phoneElement = document.getElementById('phone');
        if (phoneElement) phoneElement.value = userInfo.phone;
    }
    
    if (userInfo.dob) {
        const dobElement = document.getElementById('dob');
        if (dobElement) dobElement.value = userInfo.dob;
    }
    
    if (userInfo.address) {
        const addressElement = document.getElementById('address');
        if (addressElement) addressElement.value = userInfo.address;
    }
}

function setDefaultUserInfo() {
    // Default user info for development/fallback
    const userInfo = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'User',
        avatar: 'T'
    };
    
    // Set user name in various places
    const userNameElements = document.querySelectorAll('#userName, #welcomeUserName, #profileName');
    userNameElements.forEach(element => {
        if (element) element.textContent = userInfo.name;
    });
    
    // Set user email
    const userEmailElement = document.getElementById('profileEmail');
    if (userEmailElement) userEmailElement.textContent = userInfo.email;
    
    // Set avatar text
    const avatarElements = document.querySelectorAll('#userAvatar, #profileAvatar');
    avatarElements.forEach(element => {
        if (element) element.textContent = userInfo.avatar;
    });
}

// Function to update dashboard summary count elements
function updateSummaryCount(elementId, count) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = count || '0';
    } else {
        console.warn(`Element with ID ${elementId} not found`);
    }
}

async function fetchNotifications() {
    try {
        // Check if notifications endpoint is available in our ENDPOINTS object
        const notificationsEndpoint = ENDPOINTS.notifications?.list || `${API_BASE_URL}/notifications`;
        
        const response = await fetch(notificationsEndpoint, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            // If notifications endpoint doesn't exist, just log it and return empty array
            if (response.status === 404) {
                console.log('Notifications endpoint not available');
                renderNotifications([]);
                return;
            }
            throw new Error(`Failed to fetch notifications: ${response.status}`);
        }
        
        const notifications = await response.json();
        const notificationData = notifications.data || notifications;
        renderNotifications(notificationData);
        
    } catch (error) {
        console.error('Error fetching notifications:', error);
        // Fallback to mock notifications
        renderMockNotifications();
    }
}

function renderNotifications(notifications) {
    // Get notification list element
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    // Clear existing notifications
    notificationList.innerHTML = '';
    
    // Render notifications
    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
        notificationItem.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${notification.icon || 'fa-bell'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${formatTimeAgo(notification.createdAt)}</div>
            </div>
        `;
        
        // Add click event to mark as read
        notificationItem.addEventListener('click', () => {
            markNotificationAsRead(notification.id);
            notificationItem.classList.remove('unread');
            updateNotificationCount(document.querySelectorAll('.notification-item.unread').length);
        });
        
        notificationList.appendChild(notificationItem);
    });
    
    // Update notification count
    updateNotificationCount(notifications.filter(n => !n.read).length);
}

async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark notification as read');
        }
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark all notifications as read');
        }
        
        // Update UI
        const unreadNotifications = document.querySelectorAll('.notification-item.unread');
        unreadNotifications.forEach(notification => {
            notification.classList.remove('unread');
        });
        
        // Update notification count
        updateNotificationCount(0);
        
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

function renderMockNotifications() {
    // Mock notifications data for fallback
    const notifications = [
        {
            id: 1,
            title: 'Prescription Refill Ready',
            message: 'Your Lisinopril prescription refill is ready for pickup.',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            icon: 'fa-prescription-bottle',
            read: false
        },
        {
            id: 2,
            title: 'Order Shipped',
            message: 'Your order #12345 has been shipped and will arrive in 2-3 days.',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            icon: 'fa-truck',
            read: false
        },
        {
            id: 3,
            title: 'Appointment Reminder',
            message: 'You have a follow-up appointment with Dr. Smith tomorrow at 10:00 AM.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            icon: 'fa-calendar-check',
            read: false
        }
    ];
    
    renderNotifications(notifications);
}

function updateNotificationCount(count) {
    const notificationCount = document.getElementById('notificationCount');
    if (notificationCount) {
        notificationCount.textContent = count;
        
        // Hide badge if count is 0
        if (count === 0) {
            notificationCount.style.display = 'none';
        } else {
            notificationCount.style.display = 'flex';
        }
    }
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            window.location.href = './login.html';
        });
    }
    
    // User profile dropdown toggle
    const userProfileToggle = document.getElementById('userProfileToggle');
    const userDropdown = document.getElementById('userDropdown');
    if (userProfileToggle && userDropdown) {
        userProfileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
            
            // Close notification dropdown if open
            const notificationDropdown = document.getElementById('notificationDropdown');
            if (notificationDropdown) notificationDropdown.classList.remove('active');
        });
    }
    
    // Notification dropdown toggle
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationDropdown = document.getElementById('notificationDropdown');
    if (notificationIcon && notificationDropdown) {
        notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
            
            // Close user dropdown if open
            if (userDropdown) userDropdown.classList.remove('active');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        if (userDropdown) userDropdown.classList.remove('active');
        if (notificationDropdown) notificationDropdown.classList.remove('active');
    });
    
    // Mark all notifications as read
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            markAllNotificationsAsRead();
        });
    }
    
    // Implement proper loadTabData function for tab navigation
    window.loadTabData = function(tabId) {
        console.log(`Loading data for tab: ${tabId}`);
        
        // Handle tab-specific data loading based on tabId
        switch(tabId) {
            case 'prescriptions':
                fetchPrescriptions();
                break;
            case 'medications':
                // If you have a fetchMedications function, call it here
                console.log('Loading medications data...');
                // Placeholder for medication data loading
                break;
            case 'orders':
                // If you have a fetchOrders function, call it here
                console.log('Loading orders data...');
                // Placeholder for order data loading
                break;
            case 'profile':
                // Load profile data if needed
                console.log('Loading profile data...');
                if (typeof fetchUserInfo === 'function') {
                    fetchUserInfo();
                }
                break;
            default:
                console.log(`No specific data loader for tab: ${tabId}`);
        }
    };
    
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked tab
                button.classList.add('active');
                
                // Show corresponding tab content
                const tabId = button.getAttribute('data-tab');
                const tabPanes = document.querySelectorAll('.tab-pane');
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                const activePane = document.getElementById(`${tabId}-tab`);
                if (activePane) activePane.classList.add('active');
                
                // Load data for the tab if needed
                window.loadTabData(tabId);
            });
        });
    }
    
    // Profile tab navigation
    const profileTabButtons = document.querySelectorAll('.profile-tab-btn');
    if (profileTabButtons.length > 0) {
        profileTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs
                profileTabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked tab
                button.classList.add('active');
                
                // Show corresponding tab content
                const tabId = button.getAttribute('data-tab');
                const tabPanes = document.querySelectorAll('.profile-tab-pane');
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                const activePane = document.getElementById(`${tabId}-tab`);
                if (activePane) activePane.classList.add('active');
            });
        });
    }
    
    // Expandable cards
    const expandableCards = document.querySelectorAll('.expandable-card');
    expandableCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Only expand if not clicking a button
            if (!e.target.closest('button')) {
                const cardContent = card.querySelector('.card-content');
                cardContent.classList.toggle('expanded');
            }
        });
    });
    
    // View all prescriptions button
    const viewAllPrescriptionsBtn = document.getElementById('viewAllPrescriptions');
    if (viewAllPrescriptionsBtn) {
        viewAllPrescriptionsBtn.addEventListener('click', () => {
            // Switch to prescriptions tab
            const prescriptionsTabBtn = document.querySelector('.tab-btn[data-tab="prescriptions"]');
            if (prescriptionsTabBtn) prescriptionsTabBtn.click();
        });
    }
    
    // View refill details button
    const viewRefillDetailsBtn = document.getElementById('viewRefillDetails');
    if (viewRefillDetailsBtn) {
        viewRefillDetailsBtn.addEventListener('click', () => {
            // Switch to prescriptions tab
            const prescriptionsTabBtn = document.querySelector('.tab-btn[data-tab="prescriptions"]');
            if (prescriptionsTabBtn) prescriptionsTabBtn.click();
        });
    }
    
    // View order history button
    const viewOrderHistoryBtn = document.getElementById('viewOrderHistory');
    if (viewOrderHistoryBtn) {
        viewOrderHistoryBtn.addEventListener('click', () => {
            // Switch to orders tab
            const ordersTabBtn = document.querySelector('.tab-btn[data-tab="orders"]');
            if (ordersTabBtn) ordersTabBtn.click();
        });
    }
    
    // Manage reminders button
    const manageRemindersBtn = document.getElementById('manageReminders');
    if (manageRemindersBtn) {
        manageRemindersBtn.addEventListener('click', () => {
            showReminderModal();
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', () => {
            performSearch(searchInput.value);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value);
            }
        });
        
        // Add input event for real-time search suggestions
        searchInput.addEventListener('input', debounce(() => {
            if (searchInput.value.length >= 2) {
                fetchSearchSuggestions(searchInput.value);
            }
        }, 300));
    }
    
    // Prescription filters
    const prescriptionFilters = document.querySelectorAll('.prescription-filters .filter-btn');
    if (prescriptionFilters.length > 0) {
        prescriptionFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                // Remove active class from all filters
                prescriptionFilters.forEach(f => f.classList.remove('active'));
                
                // Add active class to clicked filter
                filter.classList.add('active');
                
                // Filter prescriptions
                const filterValue = filter.getAttribute('data-filter');
                filterPrescriptions(filterValue);
            });
        });
    }
    
    // Order filters
    const orderFilters = document.querySelectorAll('.order-filters .filter-btn');
    if (orderFilters.length > 0) {
        orderFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                // Remove active class from all filters
                orderFilters.forEach(f => f.classList.remove('active'));
                
                // Add active class to clicked filter
                filter.classList.add('active');
                
                // Filter orders
                const filterValue = filter.getAttribute('data-filter');
                filterOrders(filterValue);
            });
        });
    }
    
    // Set up reminder toggle switches
    setupReminderToggles();
    
    // Set up responsive menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const tabContainer = document.querySelector('.tabs');
    if (menuToggle && tabContainer) {
        menuToggle.addEventListener('click', () => {
            tabContainer.classList.toggle('active');
        });
    }
    
    // Close modal buttons
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

async function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // First, make sure we have a token for authentication
    let currentToken = getToken();
    if (!currentToken) {
        console.warn('No authentication token found. Authentication will fail.');
        // For testing/demo purposes only, create a debug token
        currentToken = createDebugToken();
    }
    
    // Output token to console for debugging
    console.log('Using authentication token:', currentToken);
    
    // Load summary data
    await fetchDashboardSummary();
    
    // Load data for the active tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        if (typeof window.loadTabData === 'function') {
            window.loadTabData(tabId);
        } else {
            console.log(`No loadTabData function found, using inline loader for tab: ${tabId}`);
            // Handle tab-specific data loading based on tabId
            switch(tabId) {
                case 'prescriptions':
                    fetchPrescriptions();
                    break;
                case 'medications':
                    // If you have a fetchMedications function, call it here
                    console.log('Loading medications data...');
                    break;
                case 'orders':
                    // If you have a fetchOrders function, call it here
                    console.log('Loading orders data...');
                    break;
                default:
                    console.log(`No specific data loader for tab: ${tabId}`);
            }
        }
    }
    
    // Initialize charts
    initializeCharts();
}

async function fetchDashboardSummary() {
    try {
        // Determine which endpoint to use based on user role
        let userRole = 'patient'; // Default role
        let dashboardEndpoint = ENDPOINTS.dashboard.patient; // Default endpoint
        
        // Get user info to determine role
        if (typeof window.getUserInfo === 'function') {
            const userInfo = window.getUserInfo();
            if (userInfo && userInfo.role) {
                userRole = userInfo.role.toLowerCase();
                if (userRole === 'doctor') {
                    dashboardEndpoint = ENDPOINTS.dashboard.doctor;
                } else if (userRole === 'pharmacist') {
                    dashboardEndpoint = ENDPOINTS.dashboard.pharmacist;
                }
            }
        }
        
        console.log(`Using ${userRole} dashboard endpoint: ${dashboardEndpoint}`);
        
        // Fetch dashboard data from API
        const response = await fetch(dashboardEndpoint, {
            headers: {
                'Authorization': `Bearer ${getToken()}` // Use the token from local storage
            }
        });
        
        if (!response.ok) {
            console.warn('Dashboard API returned error status:', response.status);
            throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        
        const responseData = await response.json();
        const dashboardData = responseData.data || responseData;
        console.log('Dashboard data from API:', dashboardData);
        
        // Cache dashboard data for offline use
        localStorage.setItem('e_pharma_dashboard_data', JSON.stringify(dashboardData));
        localStorage.setItem('e_pharma_dashboard_timestamp', Date.now().toString());
        
        // Update summary counts - handle multiple possible data formats
        updateSummaryCount('activePrescriptionCount', 
            dashboardData.prescriptions?.count || dashboardData.activePrescriptions || 0);
        updateSummaryCount('activePrescriptionCount2', 
            dashboardData.prescriptions?.count || dashboardData.activePrescriptions || 0);
        updateSummaryCount('medicationCount', 
            dashboardData.medications?.count || dashboardData.medications || 0);
        updateSummaryCount('upcomingRefillCount', 
            dashboardData.refills?.count || dashboardData.upcomingRefills || 0);
        updateSummaryCount('upcomingRefillCount2', 
            dashboardData.refills?.count || dashboardData.upcomingRefills || 0);
        updateSummaryCount('recentOrderCount', 
            dashboardData.orders?.count || dashboardData.recentOrders || 0);
        updateSummaryCount('recentOrderCount2', 
            dashboardData.orders?.count || dashboardData.recentOrders || 0);
        updateSummaryCount('reminderCount', 
            dashboardData.reminders?.count || dashboardData.reminders || 0);
            
        return dashboardData;
        
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        
        // Try to use cached dashboard data first
        try {
            const cachedData = localStorage.getItem('e_pharma_dashboard_data');
            const timestamp = parseInt(localStorage.getItem('e_pharma_dashboard_timestamp') || '0');
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (cachedData && (now - timestamp) < maxAge) {
                const dashboardData = JSON.parse(cachedData);
                console.log('Using cached dashboard data');
                
                // Update UI with cached data
                updateSummaryCount('activePrescriptionCount', 
                    dashboardData.prescriptions?.count || dashboardData.activePrescriptions || 0);
                updateSummaryCount('activePrescriptionCount2', 
                    dashboardData.prescriptions?.count || dashboardData.activePrescriptions || 0);
                updateSummaryCount('medicationCount', 
                    dashboardData.medications?.count || dashboardData.medications || 0);
                updateSummaryCount('upcomingRefillCount', 
                    dashboardData.refills?.count || dashboardData.upcomingRefills || 0);
                updateSummaryCount('upcomingRefillCount2', 
                    dashboardData.refills?.count || dashboardData.upcomingRefills || 0);
                updateSummaryCount('recentOrderCount', 
                    dashboardData.orders?.count || dashboardData.recentOrders || 0);
                updateSummaryCount('recentOrderCount2', 
                    dashboardData.orders?.count || dashboardData.recentOrders || 0);
                updateSummaryCount('reminderCount', 
                    dashboardData.reminders?.count || dashboardData.reminders || 0);
                    
                return dashboardData;
            }
        } catch (e) {
            console.warn('Failed to use cached dashboard data', e);
        }
        
        // Last resort: use mock data
        console.log('Using mock dashboard data');
        const mockSummary = {
            activePrescriptions: 2,
            medications: 4,
            upcomingRefills: 1,
            recentOrders: 3,
            reminders: 2
        };
        
        // Update summary counts with mock data
        updateSummaryCount('activePrescriptionCount', mockSummary.activePrescriptions);
        updateSummaryCount('activePrescriptionCount2', mockSummary.activePrescriptions);
        updateSummaryCount('medicationCount', mockSummary.medications);
        updateSummaryCount('upcomingRefillCount', mockSummary.upcomingRefills);
        updateSummaryCount('upcomingRefillCount2', mockSummary.upcomingRefills);
        updateSummaryCount('recentOrderCount', mockSummary.recentOrders);
        updateSummaryCount('recentOrderCount2', mockSummary.recentOrders);
        updateSummaryCount('reminderCount', mockSummary.reminders);
            
        return mockSummary;
    }
}

async function fetchPrescriptions(view = 'dashboard') {
    console.log('Fetching prescriptions...');
    
    try {
        // Fetch prescriptions from the backend
        console.log(`Using prescription API endpoint: ${ENDPOINTS.prescription.list}`);
        const response = await fetch(ENDPOINTS.prescription.list, {
            headers: {
                'Authorization': `Bearer ${getToken()}` // Use the token from local storage
            }
        });
        
        if (!response.ok) {
            console.warn('Prescription API returned error status:', response.status);
            throw new Error(`Failed to fetch prescriptions: ${response.status}`);
        }
        
        const data = await response.json();
        const prescriptionData = data.data || data;
        console.log('Prescription data from API:', prescriptionData);
        
        // Save to localStorage for offline use
        localStorage.setItem('e_pharma_prescriptions', JSON.stringify(prescriptionData));
        localStorage.setItem('e_pharma_prescriptions_timestamp', Date.now().toString());
        
        // Process the data and update UI
        processPrescriptionData(prescriptionData, view);
        
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        
        // Try to get prescriptions from localStorage if API fails
        try {
            const cachedData = localStorage.getItem('e_pharma_prescriptions');
            const timestamp = parseInt(localStorage.getItem('e_pharma_prescriptions_timestamp') || '0');
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (cachedData && (now - timestamp) < maxAge) {
                const prescriptions = JSON.parse(cachedData);
                console.log('Using cached prescription data:', prescriptions);
                processPrescriptionData(prescriptions, view);
                
                // Show a toast notification that we're using cached data
                if (typeof showToastNotification === 'function') {
                    showToastNotification('info', 'Using cached prescription data. Pull down to refresh.', 3000);
                }
                return;
            }
        } catch (e) {
            console.warn('Failed to get prescriptions from localStorage', e);
        }
        
        // Use mock data as last resort
        console.log('Using mock prescription data as last resort');
        const mockPrescriptions = getMockPrescriptions();
        processPrescriptionData(mockPrescriptions, view);
    }
}

// Helper function to process prescription data once received
function processPrescriptionData(data, view) {
    // Store prescriptions in global variable
    window.prescriptions = data;
    
    // Try to save prescription data to localStorage for offline access later
    try {
        localStorage.setItem('e_pharma_prescriptions', JSON.stringify(data));
        console.log('Saved prescription data to localStorage for offline use');
    } catch (e) {
        console.warn('Failed to save prescriptions to localStorage', e);
    }
    
    // Update counts
    const activePrescriptions = data.filter(prescription => 
        prescription.status === 'active');
    
    updateSummaryCount('activePrescriptionCount', activePrescriptions.length);
    
    // Render based on view
    if (view === 'dashboard') {
        renderDashboardPrescriptions(activePrescriptions);
    } else {
        renderFullPrescriptions(data);
    }
    
    // Clear error state if it exists
    const prescriptionsCard = document.getElementById('activePrescriptionsCard');
    if (prescriptionsCard) {
        prescriptionsCard.classList.remove('error-state');
    }
    
    // Hide retry button
    const retryButton = document.getElementById('retryPrescriptions');
    if (retryButton) {
        retryButton.style.display = 'none';
    }
}

// Helper functions to show toast notifications
function showToastNotification(type, message, duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.style.backgroundColor = type === 'error' ? '#f44336' : 
                                type === 'success' ? '#4CAF50' : 
                                type === 'info' ? '#2196F3' : '#ff9800';
    toast.style.color = 'white';
    toast.style.padding = '12px 16px';
    toast.style.margin = '8px 0';
    toast.style.borderRadius = '4px';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Show the toast with animation
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Hide and remove after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
}

// Helper function to get mock prescriptions
function getMockPrescriptions() {
    return [
        {
            id: 'mock-p1',
            patientName: 'John Doe',
            doctorName: 'Dr. Smith',
            medication: 'Amoxicillin',
            dosage: '500mg',
            frequency: 'Three times daily',
            startDate: '2023-01-15',
            endDate: '2023-01-30',
            status: 'active',
            notes: 'Take with food'
        },
        {
            id: 'mock-p2',
            patientName: 'John Doe',
            doctorName: 'Dr. Johnson',
            medication: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            startDate: '2023-01-01',
            endDate: '2023-12-31',
            status: 'active',
            notes: 'Take in the morning'
        },
        {
            id: 'mock-p3',
            patientName: 'John Doe',
            doctorName: 'Dr. Williams',
            medication: 'Ibuprofen',
            dosage: '400mg',
            frequency: 'As needed for pain',
            startDate: '2022-12-15',
            endDate: '2023-01-05',
            status: 'completed',
            notes: 'Do not exceed 3 tablets in 24 hours'
        }
    ];
}

// Helper function to handle prescription fetch errors
function handlePrescriptionFetchError(error, view) {
    // Show error state
    const prescriptionsCard = document.getElementById('activePrescriptionsCard');
    if (prescriptionsCard) {
        prescriptionsCard.classList.add('error-state');
        
        // First try to get saved prescriptions from localStorage
        try {
            const savedPrescriptions = localStorage.getItem('e_pharma_prescriptions');
            if (savedPrescriptions) {
                const data = JSON.parse(savedPrescriptions);
                console.log('Using cached prescription data from localStorage:', data);
                
                // Show toast indicating we're using cached data
                showToastNotification(
                    'info', 
                    'Using previously saved prescription data. Refresh to try connecting again.'
                );
                
                processPrescriptionData(data, view);
                return;
            }
        } catch (e) {
            console.error('Error reading prescriptions from localStorage:', e);
        }
        
        // If no saved data available, fall back to mock data
        console.log('Using mock prescription data as last resort');
        const mockPrescriptions = getMockPrescriptions();
        window.prescriptions = mockPrescriptions;
        
        // Update counts with mock data
        const activePrescriptions = mockPrescriptions.filter(prescription => 
            prescription.status === 'active');
        
        updateSummaryCount('activePrescriptionCount', activePrescriptions.length);
        
        // Render mock data
        if (view === 'dashboard') {
            renderDashboardPrescriptions(activePrescriptions);
        } else {
            renderFullPrescriptions(mockPrescriptions);
        }
        
        // Show error message toast about using mock data
        showToastNotification(
            'warning',
            'Using sample prescription data. Your real prescriptions will show when connected.'
        );
        
        // Show retry button
        const retryButton = document.getElementById('retryPrescriptions');
        if (retryButton) {
            retryButton.style.display = 'block';
            retryButton.addEventListener('click', () => fetchPrescriptions(view));
        }
    }
}

// Helper to show toast notifications
function showToastNotification(type, message, duration = 5000) {
    const notificationsArea = document.querySelector('.notifications-area');
    if (notificationsArea) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'warning' ? 'fa-exclamation-triangle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button class="close-toast">&times;</button>
        `;
        notificationsArea.appendChild(toast);
        
        // Remove toast after specified duration
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 500);
        }, duration);
        
        // Close button
        toast.querySelector('.close-toast').addEventListener('click', () => {
            toast.remove();
        });
        
        return toast;
    }
    return null;
}

// Mock prescription data for fallback
function getMockPrescriptions() {
    return [
        {
            id: 1,
            medication: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            prescribedBy: 'Dr. Sarah Johnson',
            dateIssued: '2025-03-15',
            expiryDate: '2025-09-15',
            refillsRemaining: 2,
            status: 'active',
            instructions: 'Take with food in the morning'
        },
        {
            id: 2,
            medication: 'Atorvastatin',
            dosage: '20mg',
            frequency: 'Once daily',
            prescribedBy: 'Dr. Sarah Johnson',
            dateIssued: '2025-02-20',
            expiryDate: '2025-08-20',
            refillsRemaining: 3,
            status: 'active',
            instructions: 'Take in the evening'
        },
        {
            id: 3,
            medication: 'Amoxicillin',
            dosage: '500mg',
            frequency: 'Three times daily',
            prescribedBy: 'Dr. Michael Chen',
            dateIssued: '2025-04-01',
            expiryDate: '2025-04-14',
            refillsRemaining: 0,
            status: 'expired',
            instructions: 'Take until completed'
        },
        {
            id: 4,
            medication: 'Metformin',
            dosage: '1000mg',
            frequency: 'Twice daily',
            prescribedBy: 'Dr. Jane Smith',
            dateIssued: '2025-05-01',
            expiryDate: '2025-11-01',
            refillsRemaining: 5,
            status: 'pending',
            instructions: 'Take with meals'
        }
    ];
}

function renderDashboardPrescriptions(prescriptions) {
    // Filter active prescriptions
    const activePrescriptions = prescriptions.filter(p => p.status === 'active');
    
    // Populate prescription list in dashboard
    const prescriptionList = document.getElementById('prescriptionList');
    if (prescriptionList) {
        prescriptionList.innerHTML = '';
        
        if (activePrescriptions.length === 0) {
            prescriptionList.innerHTML = '<div class="empty-state">No active prescriptions</div>';
            return;
        }
        
        activePrescriptions.forEach(prescription => {
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `
                <div>
                    <div class="list-item-title">${prescription.medication}</div>
                    <div class="list-item-subtitle">${prescription.dosage}</div>
                </div>
                <div class="list-item-action" data-id="${prescription.id}">
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
            
            // Add click event to show prescription details
            listItem.querySelector('.list-item-action').addEventListener('click', () => {
                showPrescriptionDetails(prescription);
            });
            
            prescriptionList.appendChild(listItem);
        });
    }
}

function renderFullPrescriptions(prescriptions) {
    // Populate prescriptions table
    const prescriptionsTableBody = document.getElementById('prescriptionsTableBody');
    if (prescriptionsTableBody) {
        prescriptionsTableBody.innerHTML = '';
        
        if (prescriptions.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="7" class="empty-state">No prescriptions found</td>`;
            prescriptionsTableBody.appendChild(emptyRow);
            return;
        }
        
        prescriptions.forEach(prescription => {
            const row = document.createElement('tr');
            row.setAttribute('data-status', prescription.status);
            row.innerHTML = `
                <td>${prescription.medication}</td>
                <td>${prescription.dosage}</td>
                <td>${prescription.prescribedBy}</td>
                <td>${formatDate(prescription.startDate)}</td>
                <td>${formatDate(prescription.endDate)}</td>
                <td>
                    <span class="status-badge status-${prescription.status}">
                        ${capitalizeFirstLetter(prescription.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-sm view-prescription" data-id="${prescription.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${prescription.status === 'active' ? `
                        <button class="btn btn-primary btn-sm request-refill" data-id="${prescription.id}">
                            <i class="fas fa-sync"></i> Refill
                        </button>
                    ` : ''}
                </td>
            `;
            
            // Add click event to view prescription button
            row.querySelector('.view-prescription').addEventListener('click', () => {
                showPrescriptionDetails(prescription);
            });
            
            // Add click event to request refill button if it exists
            const refillButton = row.querySelector('.request-refill');
            if (refillButton) {
                refillButton.addEventListener('click', () => {
                    requestRefill(prescription);
                });
            }
            
            prescriptionsTableBody.appendChild(row);
        });
    }
}

async function fetchRefills(view = 'dashboard') {
    try {
        const response = await fetch(`${API_BASE_URL}/refills`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch refills');
        }
        
        const refills = await response.json();
        
        if (view === 'dashboard') {
            renderDashboardRefills(refills);
        }
        
    } catch (error) {
        console.error('Error fetching refills:', error);
        // Fallback to mock data
        const mockRefills = [
            {
                id: 1,
                medication: 'Lisinopril',
                dosage: '10mg',
                refillDate: '2023-05-20',
                status: 'ready'
            }
        ];
        
        if (view === 'dashboard') {
            renderDashboardRefills(mockRefills);
        }
    }
}

function renderDashboardRefills(refills) {
    // Populate refill list in dashboard
    const refillList = document.getElementById('refillList');
    if (refillList) {
        refillList.innerHTML = '';
        
        if (refills.length === 0) {
            refillList.innerHTML = '<div class="empty-state">No upcoming refills</div>';
            return;
        }
        
        refills.forEach(refill => {
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `
                <div>
                    <div class="list-item-title">${refill.medication}</div>
                    <div class="list-item-subtitle">Ready for pickup on ${formatDate(refill.refillDate)}</div>
                </div>
                <div class="list-item-action" data-id="${refill.id}">
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
            
            // Add click event to show refill details
            listItem.querySelector('.list-item-action').addEventListener('click', () => {
                showRefillDetails(refill);
            });
            
            refillList.appendChild(listItem);
        });
    }
}

async function fetchOrders(view = 'dashboard') {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const orders = await response.json();
        
        if (view === 'dashboard') {
            renderDashboardOrders(orders);
        } else {
            renderFullOrders(orders);
        }
        
    } catch (error) {
        console.error('Error fetching orders:', error);
        // Fallback to mock data
        const mockOrders = [
            {
                id: 'ORD-12345',
                date: '2023-05-15',
                status: 'delivered',
                items: [
                    {
                        name: 'Lisinopril 10mg',
                        quantity: 30,
                        price: 15.99
                    },
                    {
                        name: 'Vitamin D3 1000IU',
                        quantity: 60,
                        price: 12.99
                    }
                ],
                total: 28.98
            },
            {
                id: 'ORD-12346',
                date: '2023-05-10',
                status: 'shipped',
                items: [
                    {
                        name: 'Atorvastatin 20mg',
                        quantity: 30,
                        price: 24.99
                    }
                ],
                total: 24.99
            },
            {
                id: 'ORD-12347',
                date: '2023-05-05',
                status: 'processing',
                items: [
                    {
                        name: 'Blood Pressure Monitor',
                        quantity: 1,
                        price: 49.99
                    }
                ],
                total: 49.99
            }
        ];
        
        if (view === 'dashboard') {
            renderDashboardOrders(mockOrders);
        } else {
            renderFullOrders(mockOrders);
        }
    }
}

function renderDashboardOrders(orders) {
    // Populate order list in dashboard
    const orderList = document.getElementById('orderList');
    if (orderList) {
        orderList.innerHTML = '';
        
        if (orders.length === 0) {
            orderList.innerHTML = '<div class="empty-state">No recent orders</div>';
            return;
        }
        
        orders.forEach(order => {
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `
                <div>
                    <div class="list-item-title">${order.id}</div>
                    <div class="list-item-subtitle">${formatDate(order.date)} - ${capitalizeFirstLetter(order.status)}</div>
                </div>
                <div class="list-item-action" data-id="${order.id}">
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
            
            // Add click event to show order details
            listItem.querySelector('.list-item-action').addEventListener('click', () => {
                showOrderDetails(order);
            });
            
            orderList.appendChild(listItem);
        });
    }
}

function renderFullOrders(orders) {
    // Populate orders list container
    const orderListContainer = document.getElementById('orderListContainer');
    if (orderListContainer) {
        orderListContainer.innerHTML = '';
        
        if (orders.length === 0) {
            orderListContainer.innerHTML = '<div class="empty-state">No orders found</div>';
            return;
        }
        
        orders.forEach(order => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.setAttribute('data-status', order.status);
            
            let itemsHtml = '';
            order.items.forEach(item => {
                itemsHtml += `
                    <div class="order-product">
                        <div class="order-product-image">
                            <i class="fas fa-pills"></i>
                        </div>
                        <div class="order-product-details">
                            <div class="order-product-name">${item.name}</div>
                            <div class="order-product-price">Qty: ${item.quantity} - $${item.price.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            });
            
            orderItem.innerHTML = `
                <div class="order-header">
                    <div>
                        <div class="order-number">${order.id}</div>
                        <div class="order-date">${formatDate(order.date)}</div>
                    </div>
                    <div class="order-status status-badge status-${order.status}">
                        ${capitalizeFirstLetter(order.status)}
                    </div>
                </div>
                <div class="order-content">
                    <div class="order-products">
                        ${itemsHtml}
                    </div>
                    <div class="order-summary">
                        <div class="order-total">Total: $${order.total.toFixed(2)}</div>
                        <button class="btn btn-outline btn-sm view-invoice" data-id="${order.id}">
                            <i class="fas fa-file-invoice"></i> View Invoice
                        </button>
                    </div>
                </div>
            `;
            
            // Add click event to view invoice button
            orderItem.querySelector('.view-invoice').addEventListener('click', () => {
                viewInvoice(order.id);
            });
            
            orderListContainer.appendChild(orderItem);
        });
    }
}

async function fetchMedications() {
    try {
        const response = await fetch(`${API_BASE_URL}/medicines`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch medications');
        }
        
        const medications = await response.json();
        renderMedications(medications);
        
    } catch (error) {
        console.error('Error fetching medications:', error);
        // Fallback to mock data
        const mockMedications = [
            {
                id: 1,
                name: 'Lisinopril',
                dosage: '10mg',
                frequency: 'Once daily',
                purpose: 'Blood pressure control',
                startDate: '2023-03-15',
                prescribedBy: 'Dr. Jane Smith'
            },
            {
                id: 2,
                name: 'Atorvastatin',
                dosage: '20mg',
                frequency: 'Once daily',
                purpose: 'Cholesterol management',
                startDate: '2023-02-10',
                prescribedBy: 'Dr. Jane Smith'
            },
            {
                id: 3,
                name: 'Vitamin D3',
                dosage: '1000IU',
                frequency: 'Once daily',
                purpose: 'Vitamin supplementation',
                startDate: '2023-01-05',
                prescribedBy: 'Dr. Michael Johnson'
            },
            {
                id: 4,
                name: 'Metformin',
                dosage: '1000mg',
                frequency: 'Twice daily',
                purpose: 'Diabetes management',
                startDate: '2023-05-01',
                prescribedBy: 'Dr. Jane Smith'
            }
        ];
        
        renderMedications(mockMedications);
    }
}

function renderMedications(medications) {
    // Populate medications list
    const medicationsList = document.getElementById('medicationsList');
    if (medicationsList) {
        medicationsList.innerHTML = '';
        
        // Ensure medications is an array
        if (!medications || !Array.isArray(medications) || medications.length === 0) {
            console.log('No medications data or invalid format:', medications);
            medicationsList.innerHTML = '<div class="empty-state">No medications found</div>';
            return;
        }
        
        medications.forEach(medication => {
            const listItem = document.createElement('div');
            listItem.className = 'medication-item';
            
            // Handle different possible data formats
            const name = medication.name || medication.medication || 'Unknown Medication';
            const dosage = medication.dosage || 'No dosage info';
            const frequency = medication.frequency || medication.schedule || 'As needed';
            const instructions = medication.instructions || medication.directions || '';
            const id = medication.id || Math.random().toString(36).substring(2, 10);
            
            listItem.innerHTML = `
                <div class="medication-info">
                    <div class="medication-name">${name}</div>
                    <div class="medication-details">
                        <span>${dosage}</span>
                        <span class="separator">•</span>
                        <span>${frequency}</span>
                    </div>
                    <div class="medication-instructions">${instructions}</div>
                </div>
                <div class="medication-actions">
                    <button class="btn btn-sm btn-outline view-medication" data-id="${id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            `;
            
            // Add click event to view medication button
            listItem.querySelector('.view-medication').addEventListener('click', () => {
                showMedicationDetails(medication);
            });
            
            medicationsList.appendChild(listItem);
        });
    }
}

async function fetchReminders(view = 'dashboard') {
    try {
        const response = await fetch(`${API_BASE_URL}/reminders`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch reminders');
        }
        
        const reminders = await response.json();
        
        if (view === 'dashboard') {
            renderDashboardReminders(reminders);
        }
        
        // Store reminders in localStorage for the reminder system
        localStorage.setItem('reminders', JSON.stringify(reminders));
        
    } catch (error) {
        console.error('Error fetching reminders:', error);
        // Fallback to mock data
        const mockReminders = [
            {
                id: 1,
                medication: 'Lisinopril',
                time: '08:00',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                active: true
            },
            {
                id: 2,
                medication: 'Atorvastatin',
                time: '20:00',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                active: true
            }
        ];
        
        if (view === 'dashboard') {
            renderDashboardReminders(mockReminders);
        }
        
        // Store mock reminders in localStorage for the reminder system
        localStorage.setItem('reminders', JSON.stringify(mockReminders));
    }
}

function renderDashboardReminders(reminders) {
    // Populate reminder list in dashboard
    const reminderList = document.getElementById('reminderList');
    if (reminderList) {
        reminderList.innerHTML = '';
        
        if (reminders.length === 0) {
            reminderList.innerHTML = '<div class="empty-state">No reminders set</div>';
            return;
        }
        
        reminders.forEach(reminder => {
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `
                <div>
                    <div class="list-item-title">${reminder.medication}</div>
                    <div class="list-item-subtitle">${formatTime(reminder.time)} ${reminder.days.length === 7 ? 'daily' : reminder.days.join(', ')}</div>
                </div>
                <div class="list-item-action" data-id="${reminder.id}">
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
            
            // Add click event to show reminder details
            listItem.querySelector('.list-item-action').addEventListener('click', () => {
                showReminderDetails(reminder);
            });
            
            reminderList.appendChild(listItem);
        });
    }
}

// 2. Data Visualization with Charts
function initializeCharts() {
    // Load Chart.js from CDN if not already loaded
    if (!window.Chart) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            createCharts();
        };
        document.head.appendChild(script);
    } else {
        createCharts();
    }
}

function createCharts() {
    // Create medication adherence chart
    createMedicationAdherenceChart();
    
    // Create health metrics chart
    createHealthMetricsChart();
}

function createMedicationAdherenceChart() {
    // Check if Chart.js is loaded
    if (!window.Chart) return;
    
    // Create a container for the chart if it doesn't exist
    let chartContainer = document.getElementById('medicationAdherenceChartContainer');
    if (!chartContainer) {
        // Find the dashboard tab content
        const dashboardTab = document.getElementById('dashboard-tab');
        if (!dashboardTab) return;
        
        // Create chart container
        chartContainer = document.createElement('div');
        chartContainer.id = 'medicationAdherenceChartContainer';
        chartContainer.className = 'chart-container';
        
        // Create chart card
        const chartCard = document.createElement('div');
        chartCard.className = 'card';
        chartCard.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">Medication Adherence</h3>
                <div class="card-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
            </div>
            <div class="card-content">
                <canvas id="medicationAdherenceChart"></canvas>
            </div>
        `;
        
        chartContainer.appendChild(chartCard);
        
        // Insert chart container after the dashboard grid
        const dashboardGrid = dashboardTab.querySelector('.dashboard-grid');
        if (dashboardGrid) {
            dashboardGrid.parentNode.insertBefore(chartContainer, dashboardGrid.nextSibling);
        } else {
            dashboardTab.appendChild(chartContainer);
        }
    }
    
    // Get the canvas element
    const canvas = document.getElementById('medicationAdherenceChart');
    if (!canvas) return;
    
    // Mock data for medication adherence
    const mockData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Adherence Rate',
                data: [100, 100, 75, 100, 100, 50, 100],
                backgroundColor: 'rgba(26, 115, 232, 0.2)',
                borderColor: 'rgba(26, 115, 232, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }
        ]
    };
    
    // Create the chart
    new Chart(canvas, {
        type: 'line',
        data: mockData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

function createHealthMetricsChart() {
    // Check if Chart.js is loaded
    if (!window.Chart) return;
    
    // Create a container for the chart if it doesn't exist
    let chartContainer = document.getElementById('healthMetricsChartContainer');
    if (!chartContainer) {
        // Find the dashboard tab content
        const dashboardTab = document.getElementById('dashboard-tab');
        if (!dashboardTab) return;
        
        // Create chart container
        chartContainer = document.createElement('div');
        chartContainer.id = 'healthMetricsChartContainer';
        chartContainer.className = 'chart-container';
        chartContainer.style.height = '400px';
        chartContainer.style.marginBottom = '30px';
        
        // Create chart card
        const chartCard = document.createElement('div');
        chartCard.className = 'card';
        chartCard.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">Health Metrics</h3>
                <div class="card-icon">
                    <i class="fas fa-heartbeat"></i>
                </div>
            </div>
            <div class="card-content">
                <div class="chart-controls">
                    <select id="healthMetricSelect">
                        <option value="bloodPressure">Blood Pressure</option>
                        <option value="bloodSugar">Blood Sugar</option>
                        <option value="weight">Weight</option>
                    </select>
                    <select id="timeRangeSelect">
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>
                <div style="height: 300px; position: relative;">
                    <canvas id="healthMetricsChart"></canvas>
                </div>
            </div>
        `;
        
        chartContainer.appendChild(chartCard);
        
        // Insert chart container after the medication adherence chart
        const adherenceChartContainer = document.getElementById('medicationAdherenceChartContainer');
        if (adherenceChartContainer) {
            adherenceChartContainer.parentNode.insertBefore(chartContainer, adherenceChartContainer.nextSibling);
        } else {
            const dashboardGrid = dashboardTab.querySelector('.dashboard-grid');
            if (dashboardGrid) {
                dashboardGrid.parentNode.insertBefore(chartContainer, dashboardGrid.nextSibling);
            } else {
                dashboardTab.appendChild(chartContainer);
            }
        }
        
        // Add event listeners to the selects
        setTimeout(() => {
            const healthMetricSelect = document.getElementById('healthMetricSelect');
            const timeRangeSelect = document.getElementById('timeRangeSelect');
            
            if (healthMetricSelect && timeRangeSelect) {
                healthMetricSelect.addEventListener('change', updateHealthMetricsChart);
                timeRangeSelect.addEventListener('change', updateHealthMetricsChart);
            }
        }, 0);
    }
    
    // Get the canvas element
    const canvas = document.getElementById('healthMetricsChart');
    if (!canvas) return;
    
    // Create the chart with initial data
    window.healthMetricsChart = new Chart(canvas, {
        type: 'line',
        data: getHealthMetricsData('bloodPressure', 'week'),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.2
                },
                point: {
                    radius: 3,
                    hoverRadius: 5
                }
            }
        }
    });
}

function updateHealthMetricsChart() {
    const healthMetricSelect = document.getElementById('healthMetricSelect');
    const timeRangeSelect = document.getElementById('timeRangeSelect');
    
    if (!healthMetricSelect || !timeRangeSelect || !window.healthMetricsChart) return;
    
    const metric = healthMetricSelect.value;
    const timeRange = timeRangeSelect.value;
    
    const newData = getHealthMetricsData(metric, timeRange);
    
    window.healthMetricsChart.data = newData;
    window.healthMetricsChart.update();
}

function getHealthMetricsData(metric, timeRange) {
    // Mock data for health metrics
    let labels, data, label, yAxisLabel;
    
    // Generate dates based on time range
    const today = new Date();
    labels = [];
    
    if (timeRange === 'week') {
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
    } else if (timeRange === 'month') {
        for (let i = 29; i >= 0; i -= 3) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
    } else if (timeRange === 'year') {
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(today.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }
    }
    
    // Seed values for consistent data generation
    const seed = metric.length + timeRange.length;
    const pseudoRandom = (min, max, index) => {
        // Simple deterministic function that looks random but is consistent
        return min + (((seed * 9301 + index * 49297) % 233280) / 233280) * (max - min);
    };
    
    // Generate data based on metric
    if (metric === 'bloodPressure') {
        label = 'Blood Pressure (mmHg)';
        yAxisLabel = 'mmHg';
        
        // Generate systolic and diastolic data
        const systolicData = [];
        const diastolicData = [];
        
        // Base values for a smoother curve
        const baseSystolic = 120;
        const baseDiastolic = 80;
        
        for (let i = 0; i < labels.length; i++) {
            // Create a smooth trend with small variations
            const variation = pseudoRandom(-5, 5, i);
            systolicData.push(Math.round(baseSystolic + variation));
            diastolicData.push(Math.round(baseDiastolic + (variation * 0.5)));
        }
        
        return {
            labels: labels,
            datasets: [
                {
                    label: 'Systolic',
                    data: systolicData,
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderColor: 'rgba(26, 115, 232, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(26, 115, 232, 1)',
                    fill: false
                },
                {
                    label: 'Diastolic',
                    data: diastolicData,
                    backgroundColor: 'rgba(52, 168, 83, 0.1)',
                    borderColor: 'rgba(52, 168, 83, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(52, 168, 83, 1)',
                    fill: false
                }
            ]
        };
    } else if (metric === 'bloodSugar') {
        label = 'Blood Sugar (mg/dL)';
        yAxisLabel = 'mg/dL';
        
        // Generate blood sugar data
        data = [];
        const baseValue = 100;
        
        for (let i = 0; i < labels.length; i++) {
            // Create a smooth trend with meal-time spikes
            const dayPattern = i % 2 === 0 ? 5 : -3; // Alternating pattern
            const variation = pseudoRandom(-2, 8, i); 
            data.push(Math.round(baseValue + dayPattern + variation));
        }
        
        return {
            labels: labels,
            datasets: [
                {
                    label: label,
                    data: data,
                    backgroundColor: 'rgba(251, 188, 5, 0.1)',
                    borderColor: 'rgba(251, 188, 5, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(251, 188, 5, 1)',
                    fill: false
                }
            ]
        };
    } else if (metric === 'weight') {
        label = 'Weight (kg)';
        yAxisLabel = 'kg';
        
        // Generate weight data - should be more stable with a slow trend
        data = [];
        const baseWeight = 72;
        let currentWeight = baseWeight;
        
        for (let i = 0; i < labels.length; i++) {
            // Gradual trend with tiny day-to-day fluctuations
            const trend = pseudoRandom(-0.1, 0.1, i);
            currentWeight += trend;
            data.push(parseFloat(currentWeight.toFixed(1)));
        }
        
        return {
            labels: labels,
            datasets: [
                {
                    label: label,
                    data: data,
                    backgroundColor: 'rgba(234, 67, 53, 0.1)',
                    borderColor: 'rgba(234, 67, 53, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(234, 67, 53, 1)',
                    fill: false
                }
            ]
        };
    }
    
    return {
        labels: [],
        datasets: []
    };
}

// 3. Search Functionality
async function performSearch(query) {
    if (!query) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const results = await response.json();
        showSearchResults(results, query);
        
    } catch (error) {
        console.error('Error performing search:', error);
        // Fallback to mock search results
        const mockResults = {
            medications: [
                {
                    id: 1,
                    name: 'Lisinopril',
                    dosage: '10mg',
                    type: 'medication'
                },
                {
                    id: 2,
                    name: 'Lipitor (Atorvastatin)',
                    dosage: '20mg',
                    type: 'medication'
                }
            ],
            prescriptions: [
                {
                    id: 1,
                    medication: 'Lisinopril',
                    dosage: '10mg, once daily',
                    type: 'prescription'
                }
            ],
            orders: [
                {
                    id: 'ORD-12345',
                    date: '2023-05-15',
                    status: 'delivered',
                    type: 'order'
                }
            ]
        };
        
        showSearchResults(mockResults, query);
    }
}

async function fetchSearchSuggestions(query) {
    if (!query || query.length < 2) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch search suggestions');
        }
        
        const suggestions = await response.json();
        showSearchSuggestions(suggestions);
        
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        // Fallback to mock suggestions
        const mockSuggestions = [
            {
                id: 1,
                text: 'Lisinopril',
                type: 'medication'
            },
            {
                id: 2,
                text: 'Lipitor',
                type: 'medication'
            },
            {
                id: 3,
                text: 'Latest order',
                type: 'order'
            }
        ];
        
        showSearchSuggestions(mockSuggestions);
    }
}

function showSearchSuggestions(suggestions) {
    // Get or create suggestions container
    let suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'searchSuggestions';
        suggestionsContainer.className = 'search-suggestions';
        
        // Add to DOM
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.appendChild(suggestionsContainer);
        }
    }
    
    // Clear existing suggestions
    suggestionsContainer.innerHTML = '';
    
    // If no suggestions, hide container
    if (!suggestions || suggestions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    // Add suggestions
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        
        let icon;
        switch (suggestion.type) {
            case 'medication':
                icon = 'fa-pills';
                break;
            case 'prescription':
                icon = 'fa-prescription';
                break;
            case 'order':
                icon = 'fa-shopping-bag';
                break;
            default:
                icon = 'fa-search';
        }
        
        item.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${suggestion.text}</span>
        `;
        
        // Add click event
        item.addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = suggestion.text;
                performSearch(suggestion.text);
                suggestionsContainer.style.display = 'none';
            }
        });
        
        suggestionsContainer.appendChild(item);
    });
    
    // Show container
    suggestionsContainer.style.display = 'block';
}

function showSearchResults(results, query) {
    // Create or get search results modal
    let searchModal = document.getElementById('searchResultsModal');
    
    if (!searchModal) {
        searchModal = document.createElement('div');
        searchModal.id = 'searchResultsModal';
        searchModal.className = 'modal';
        
        searchModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Search Results</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" id="searchResultsBody">
                    <!-- Search results will be loaded here -->
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline modal-close-btn">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(searchModal);
        
        // Add event listeners to close modal
        const closeButtons = searchModal.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                searchModal.classList.remove('active');
            });
        });
        
        // Close modal when clicking outside
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                searchModal.classList.remove('active');
            }
        });
    }
    
    // Get search results body
    const searchResultsBody = document.getElementById('searchResultsBody');
    if (!searchResultsBody) return;
    
    // Clear existing results
    searchResultsBody.innerHTML = '';
    
    // Add search query
    const searchQueryElement = document.createElement('div');
    searchQueryElement.className = 'search-query';
    searchQueryElement.innerHTML = `
        <p>Search results for: <strong>${query}</strong></p>
    `;
    searchResultsBody.appendChild(searchQueryElement);
    
    // Check if there are any results
    const hasResults = 
        (results.medications && results.medications.length > 0) ||
        (results.prescriptions && results.prescriptions.length > 0) ||
        (results.orders && results.orders.length > 0);
    
    if (!hasResults) {
        const noResultsElement = document.createElement('div');
        noResultsElement.className = 'no-results';
        noResultsElement.innerHTML = `
            <p>No results found for "${query}"</p>
            <p>Try searching for a different term or check your spelling.</p>
        `;
        searchResultsBody.appendChild(noResultsElement);
    } else {
        // Add results by category
        if (results.medications && results.medications.length > 0) {
            addSearchResultsSection(searchResultsBody, 'Medications', results.medications, (item) => {
                return `
                    <div class="result-title">${item.name}</div>
                    <div class="result-subtitle">${item.dosage}</div>
                `;
            }, (item) => {
                // Switch to medications tab and show details
                const medicationsTabBtn = document.querySelector('.tab-btn[data-tab="medications"]');
                if (medicationsTabBtn) medicationsTabBtn.click();
                
                // Find the medication and show details
                const medicationCard = document.querySelector(`.medication-card .view-medication[data-id="${item.id}"]`);
                if (medicationCard) medicationCard.click();
                
                // Close search modal
                searchModal.classList.remove('active');
            });
        }
        
        if (results.prescriptions && results.prescriptions.length > 0) {
            addSearchResultsSection(searchResultsBody, 'Prescriptions', results.prescriptions, (item) => {
                return `
                    <div class="result-title">${item.medication}</div>
                    <div class="result-subtitle">${item.dosage}</div>
                `;
            }, (item) => {
                // Switch to prescriptions tab and show details
                const prescriptionsTabBtn = document.querySelector('.tab-btn[data-tab="prescriptions"]');
                if (prescriptionsTabBtn) prescriptionsTabBtn.click();
                
                // Find the prescription and show details
                const prescriptionButton = document.querySelector(`.view-prescription[data-id="${item.id}"]`);
                if (prescriptionButton) prescriptionButton.click();
                
                // Close search modal
                searchModal.classList.remove('active');
            });
        }
        
        if (results.orders && results.orders.length > 0) {
            addSearchResultsSection(searchResultsBody, 'Orders', results.orders, (item) => {
                return `
                    <div class="result-title">${item.id}</div>
                    <div class="result-subtitle">${formatDate(item.date)} - ${capitalizeFirstLetter(item.status)}</div>
                `;
            }, (item) => {
                // Switch to orders tab and show details
                const ordersTabBtn = document.querySelector('.tab-btn[data-tab="orders"]');
                if (ordersTabBtn) ordersTabBtn.click();
                
                // Find the order and show details
                const orderItem = document.querySelector(`.order-item[data-id="${item.id}"]`);
                if (orderItem) {
                    const viewButton = orderItem.querySelector('.view-invoice');
                    if (viewButton) viewButton.click();
                }
                
                // Close search modal
                searchModal.classList.remove('active');
            });
        }
    }
    
    // Show modal
    searchModal.classList.add('active');
}

function addSearchResultsSection(container, title, items, renderItemContent, onItemClick) {
    const section = document.createElement('div');
    section.className = 'search-results-section';
    
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="search-results-list"></div>
    `;
    
    const list = section.querySelector('.search-results-list');
    
    items.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = renderItemContent(item);
        
        resultItem.addEventListener('click', () => {
            onItemClick(item);
        });
        
        list.appendChild(resultItem);
    });
    
    container.appendChild(section);
}

// 4. Mobile Responsiveness
function setupMobileResponsiveness() {
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0';
        document.head.appendChild(meta);
    }
    
    // Add mobile menu toggle button if not present
    const header = document.querySelector('header');
    if (header && !document.getElementById('menuToggle')) {
        const menuToggle = document.createElement('button');
        menuToggle.id = 'menuToggle';
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        
        // Insert at the beginning of the header
        header.insertBefore(menuToggle, header.firstChild);
        
        // Add event listener
        menuToggle.addEventListener('click', () => {
            document.body.classList.toggle('mobile-menu-open');
        });
    }
    
    // Add media query event listener
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    function handleMediaQueryChange(e) {
        if (e.matches) {
            // Mobile view
            document.body.classList.add('mobile-view');
        } else {
            // Desktop view
            document.body.classList.remove('mobile-view');
            document.body.classList.remove('mobile-menu-open');
        }
    }
    
    // Initial check
    handleMediaQueryChange(mediaQuery);
    
    // Add listener for changes
    mediaQuery.addEventListener('change', handleMediaQueryChange);
}

// 5. Reminder System
function setupReminderSystem() {
    // Initialize reminder system
    initializeReminderSystem();
    
    // Set up reminder toggles
    setupReminderToggles();
    
    // Create reminder modal if it doesn't exist
    createReminderModal();
}

function initializeReminderSystem() {
    // Check if reminders are already initialized
    if (localStorage.getItem('reminderSystemInitialized')) return;
    
    // Get reminders from localStorage
    const remindersJson = localStorage.getItem('reminders');
    if (!remindersJson) return;
    
    try {
        const reminders = JSON.parse(remindersJson);
        
        // Register reminders with the notification system
        if ('Notification' in window) {
            // Request permission
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                    
                    // Schedule reminders
                    scheduleReminders(reminders);
                }
            });
        }
        
        // Mark as initialized
        localStorage.setItem('reminderSystemInitialized', 'true');
        
    } catch (error) {
        console.error('Error initializing reminder system:', error);
    }
}

function scheduleReminders(reminders) {
    // Clear existing scheduled reminders
    clearScheduledReminders();
    
    // Schedule new reminders
    reminders.forEach(reminder => {
        if (!reminder.active) return;
        
        // Schedule reminder based on time and days
        const [hours, minutes] = reminder.time.split(':').map(Number);
        
        // Get current date
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Check if reminder should be scheduled for today
        if (reminder.days.includes(currentDay)) {
            // Create reminder time for today
            const reminderTime = new Date();
            reminderTime.setHours(hours, minutes, 0, 0);
            
            // If reminder time is in the future, schedule it
            if (reminderTime > now) {
                const timeUntilReminder = reminderTime.getTime() - now.getTime();
                
                // Schedule reminder
                const timerId = setTimeout(() => {
                    showReminderNotification(reminder);
                }, timeUntilReminder);
                
                // Store timer ID
                const scheduledReminders = JSON.parse(localStorage.getItem('scheduledReminders') || '[]');
                scheduledReminders.push({
                    id: reminder.id,
                    timerId: timerId
                });
                localStorage.setItem('scheduledReminders', JSON.stringify(scheduledReminders));
            }
        }
    });
}

function clearScheduledReminders() {
    // Get scheduled reminders
    const scheduledReminders = JSON.parse(localStorage.getItem('scheduledReminders') || '[]');
    
    // Clear all timeouts
    scheduledReminders.forEach(scheduled => {
        clearTimeout(scheduled.timerId);
    });
    
    // Clear scheduled reminders
    localStorage.setItem('scheduledReminders', '[]');
}

function showReminderNotification(reminder) {
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Medication Reminder', {
            body: `Time to take ${reminder.medication}`,
            icon: '/favicon.ico'
        });
        
        // Close notification after 10 seconds
        setTimeout(() => {
            notification.close();
        }, 10000);
        
        // Add click event
        notification.onclick = function() {
            window.focus();
            showReminderDetails(reminder);
        };
    }
    
    // Show in-app notification
    showInAppNotification(reminder);
}

function showInAppNotification(reminder) {
    // Create notification element if it doesn't exist
    let notificationElement = document.getElementById('inAppNotification');
    
    if (!notificationElement) {
        notificationElement = document.createElement('div');
        notificationElement.id = 'inAppNotification';
        notificationElement.className = 'in-app-notification';
        
        document.body.appendChild(notificationElement);
    }
    
    // Set notification content
    notificationElement.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="notification-text">
                <div class="notification-title">Medication Reminder</div>
                <div class="notification-message">Time to take ${reminder.medication}</div>
            </div>
            <button class="notification-close">&times;</button>
        </div>
        <div class="notification-actions">
            <button class="btn btn-outline btn-sm notification-dismiss">Dismiss</button>
            <button class="btn btn-primary btn-sm notification-taken">Mark as Taken</button>
        </div>
    `;
    
    // Add event listeners
    const closeButton = notificationElement.querySelector('.notification-close');
    const dismissButton = notificationElement.querySelector('.notification-dismiss');
    const takenButton = notificationElement.querySelector('.notification-taken');
    
    closeButton.addEventListener('click', () => {
        notificationElement.classList.remove('active');
    });
    
    dismissButton.addEventListener('click', () => {
        notificationElement.classList.remove('active');
    });
    
    takenButton.addEventListener('click', () => {
        notificationElement.classList.remove('active');
        markMedicationAsTaken(reminder);
    });
    
    // Show notification
    notificationElement.classList.add('active');
    
    // Auto-hide after 30 seconds
    setTimeout(() => {
        notificationElement.classList.remove('active');
    }, 30000);
}

function markMedicationAsTaken(reminder) {
    // In a real app, this would send a request to the server
    console.log(`Marked ${reminder.medication} as taken`);
    
    // Update medication adherence chart
    updateMedicationAdherenceChart();
}

function setupReminderToggles() {
    // Get reminders from localStorage
    const remindersJson = localStorage.getItem('reminders');
    if (!remindersJson) return;
    
    try {
        const reminders = JSON.parse(remindersJson);
        
        // Set up toggle switches for each reminder
        reminders.forEach(reminder => {
            const toggleId = `reminderToggle-${reminder.id}`;
            const toggle = document.getElementById(toggleId);
            
            if (toggle) {
                // Set initial state
                toggle.checked = reminder.active;
                
                // Update toggle label
                const toggleLabel = toggle.nextElementSibling;
                if (toggleLabel) {
                    toggleLabel.nextElementSibling.textContent = reminder.active ? 'Enabled' : 'Disabled';
                }
                
                // Add change event listener
                toggle.addEventListener('change', () => {
                    toggleReminder(reminder.id, toggle.checked);
                });
            }
        });
        
    } catch (error) {
        console.error('Error setting up reminder toggles:', error);
    }
}

function toggleReminder(reminderId, active) {
    // Get reminders from localStorage
    const remindersJson = localStorage.getItem('reminders');
    if (!remindersJson) return;
    
    try {
        const reminders = JSON.parse(remindersJson);
        
        // Find and update reminder
        const reminder = reminders.find(r => r.id === reminderId);
        if (reminder) {
            reminder.active = active;
            
            // Update localStorage
            localStorage.setItem('reminders', JSON.stringify(reminders));
            
            // Update toggle label
            const toggleId = `reminderToggle-${reminderId}`;
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                const toggleLabel = toggle.nextElementSibling;
                if (toggleLabel) {
                    toggleLabel.nextElementSibling.textContent = active ? 'Enabled' : 'Disabled';
                }
            }
            
            // Reschedule reminders
            scheduleReminders(reminders);
        }
        
    } catch (error) {
        console.error('Error toggling reminder:', error);
    }
}

function createReminderModal() {
    // Check if modal already exists
    if (document.getElementById('reminderModal')) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'reminderModal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Manage Reminders</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="reminder-list-container" id="reminderModalList">
                    <!-- Reminders will be loaded here -->
                </div>
                <div class="add-reminder-form">
                    <h3>Add New Reminder</h3>
                    <form id="addReminderForm">
                        <div class="form-group">
                            <label for="reminderMedication">Medication</label>
                            <select id="reminderMedication" required>
                                <option value="">Select Medication</option>
                                <!-- Medications will be loaded here -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="reminderTime">Time</label>
                            <input type="time" id="reminderTime" required>
                        </div>
                        <div class="form-group">
                            <label>Days</label>
                            <div class="day-checkboxes">
                                <label><input type="checkbox" name="reminderDays" value="Monday" checked> Mon</label>
                                <label><input type="checkbox" name="reminderDays" value="Tuesday" checked> Tue</label>
                                <label><input type="checkbox" name="reminderDays" value="Wednesday" checked> Wed</label>
                                <label><input type="checkbox" name="reminderDays" value="Thursday" checked> Thu</label>
                                <label><input type="checkbox" name="reminderDays" value="Friday" checked> Fri</label>
                                <label><input type="checkbox" name="reminderDays" value="Saturday" checked> Sat</label>
                                <label><input type="checkbox" name="reminderDays" value="Sunday" checked> Sun</label>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">Add Reminder</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeButton = modal.querySelector('.modal-close');
    closeButton.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Add form submit handler
    const addReminderForm = document.getElementById('addReminderForm');
    if (addReminderForm) {
        addReminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewReminder();
        });
    }
}

function showReminderModal() {
    // Create modal if it doesn't exist
    createReminderModal();
    
    // Load reminders
    loadReminderModalList();
    
    // Load medications for dropdown
    loadMedicationsForReminderForm();
    
    // Show modal
    const modal = document.getElementById('reminderModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function loadReminderModalList() {
    // Get reminders list container
    const reminderList = document.getElementById('reminderModalList');
    if (!reminderList) return;
    
    // Clear existing reminders
    reminderList.innerHTML = '';
    
    // Get reminders from localStorage
    const remindersJson = localStorage.getItem('reminders');
    if (!remindersJson) {
        reminderList.innerHTML = '<div class="empty-state">No reminders set</div>';
        return;
    }
    
    try {
        const reminders = JSON.parse(remindersJson);
        
        if (reminders.length === 0) {
            reminderList.innerHTML = '<div class="empty-state">No reminders set</div>';
            return;
        }
        
        // Create reminder items
        reminders.forEach(reminder => {
            const reminderItem = document.createElement('div');
            reminderItem.className = 'reminder-item';
            
            reminderItem.innerHTML = `
                <div class="reminder-details">
                    <div class="reminder-medication">${reminder.medication}</div>
                    <div class="reminder-schedule">
                        ${formatTime(reminder.time)} 
                        ${reminder.days.length === 7 ? 'daily' : reminder.days.join(', ')}
                    </div>
                </div>
                <div class="reminder-actions">
                    <div class="toggle-switch">
                        <input type="checkbox" id="reminderToggle-${reminder.id}" ${reminder.active ? 'checked' : ''}>
                        <label for="reminderToggle-${reminder.id}"></label>
                        <span>${reminder.active ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <button class="btn btn-outline btn-sm edit-reminder" data-id="${reminder.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline btn-sm delete-reminder" data-id="${reminder.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const toggleSwitch = reminderItem.querySelector(`#reminderToggle-${reminder.id}`);
            if (toggleSwitch) {
                toggleSwitch.addEventListener('change', () => {
                    toggleReminder(reminder.id, toggleSwitch.checked);
                });
            }
            
            const editButton = reminderItem.querySelector('.edit-reminder');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    editReminder(reminder);
                });
            }
            
            const deleteButton = reminderItem.querySelector('.delete-reminder');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    deleteReminder(reminder.id);
                });
            }
            
            reminderList.appendChild(reminderItem);
        });
        
    } catch (error) {
        console.error('Error loading reminders:', error);
        reminderList.innerHTML = '<div class="empty-state">Error loading reminders</div>';
    }
}

function loadMedicationsForReminderForm() {
    // Get medication dropdown
    const medicationSelect = document.getElementById('reminderMedication');
    if (!medicationSelect) return;
    
    // Clear existing options (except the first one)
    while (medicationSelect.options.length > 1) {
        medicationSelect.remove(1);
    }
    
    // Try to get medications from API
    fetch(`${API_BASE_URL}/medications`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch medications');
        }
        return response.json();
    })
    .then(medications => {
        // Add medication options
        medications.forEach(medication => {
            const option = document.createElement('option');
            option.value = medication.name;
            option.textContent = `${medication.name} (${medication.dosage})`;
            medicationSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching medications:', error);
        
        // Fallback to mock medications
        const mockMedications = [
            { id: 1, name: 'Lisinopril', dosage: '10mg' },
            { id: 2, name: 'Atorvastatin', dosage: '20mg' },
            { id: 3, name: 'Vitamin D3', dosage: '1000IU' },
            { id: 4, name: 'Metformin', dosage: '1000mg' }
        ];
        
        // Add medication options
        mockMedications.forEach(medication => {
            const option = document.createElement('option');
            option.value = medication.name;
            option.textContent = `${medication.name} (${medication.dosage})`;
            medicationSelect.appendChild(option);
        });
    });
}

function addNewReminder() {
    // Get form values
    const medicationSelect = document.getElementById('reminderMedication');
    const timeInput = document.getElementById('reminderTime');
    const dayCheckboxes = document.querySelectorAll('input[name="reminderDays"]:checked');
    
    if (!medicationSelect || !timeInput || dayCheckboxes.length === 0) return;
    
    const medication = medicationSelect.value;
    const time = timeInput.value;
    const days = Array.from(dayCheckboxes).map(checkbox => checkbox.value);
    
    // Validate form
    if (!medication || !time || days.length === 0) {
        alert('Please fill in all fields');
        return;
    }
    
    // Get existing reminders
    const remindersJson = localStorage.getItem('reminders');
    const reminders = remindersJson ? JSON.parse(remindersJson) : [];
    
    // Create new reminder
    const newReminder = {
        id: Date.now(), // Use timestamp as ID
        medication: medication,
        time: time,
        days: days,
        active: true
    };
    
    // Add to reminders
    reminders.push(newReminder);
    
    // Save to localStorage
    localStorage.setItem('reminders', JSON.stringify(reminders));
    
    // Reload reminders list
    loadReminderModalList();
    
    // Reset form
    document.getElementById('addReminderForm').reset();
    
    // Schedule reminders
    scheduleReminders(reminders);
    
    // Update dashboard
    fetchReminders('dashboard');
}

function editReminder(reminder) {
    // TODO: Implement edit reminder functionality
    alert(`Edit reminder for ${reminder.medication} not implemented yet`);
}

function deleteReminder(reminderId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    
    // Get existing reminders
    const remindersJson = localStorage.getItem('reminders');
    if (!remindersJson) return;
    
    try {
        const reminders = JSON.parse(remindersJson);
        
        // Filter out the reminder to delete
        const updatedReminders = reminders.filter(r => r.id !== reminderId);
        
        // Save to localStorage
        localStorage.setItem('reminders', JSON.stringify(updatedReminders));
        
        // Reload reminders list
        loadReminderModalList();
        
        // Reschedule reminders
        scheduleReminders(updatedReminders);
        
        // Update dashboard
        fetchReminders('dashboard');
        
    } catch (error) {
        console.error('Error deleting reminder:', error);
    }
}

function showReminderDetails(reminder) {
    alert(`Reminder details for ${reminder.medication}\nTime: ${formatTime(reminder.time)}\nDays: ${reminder.days.join(', ')}`);
}

// Helper Functions
function showPrescriptionDetails(prescription) {
    // Get modal elements
    const modal = document.getElementById('prescriptionModal');
    const modalBody = document.getElementById('prescriptionModalBody');
    
    if (!modal || !modalBody) return;
    
    // Populate modal body with prescription details
    modalBody.innerHTML = `
        <div class="prescription-details">
            <div class="detail-group">
                <label>Medication</label>
                <div>${prescription.medication}</div>
            </div>
            <div class="detail-group">
                <label>Dosage</label>
                <div>${prescription.dosage}</div>
            </div>
            <div class="detail-group">
                <label>Prescribed By</label>
                <div>${prescription.prescribedBy}</div>
            </div>
            <div class="detail-group">
                <label>Start Date</label>
                <div>${formatDate(prescription.startDate)}</div>
            </div>
            <div class="detail-group">
                <label>End Date</label>
                <div>${formatDate(prescription.endDate)}</div>
            </div>
            <div class="detail-group">
                <label>Status</label>
                <div>
                    <span class="status-badge status-${prescription.status}">
                        ${capitalizeFirstLetter(prescription.status)}
                    </span>
                </div>
            </div>
            <div class="detail-group">
                <label>Refills Remaining</label>
                <div>${prescription.refillsRemaining}</div>
            </div>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Add event listeners to close modal
    const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function showRefillDetails(refill) {
    alert(`Refill details for ${refill.medication} (${refill.dosage})\nReady for pickup on ${formatDate(refill.refillDate)}`);
}

function showOrderDetails(order) {
    alert(`Order details for ${order.id}\nDate: ${formatDate(order.date)}\nStatus: ${capitalizeFirstLetter(order.status)}\nTotal: $${order.total.toFixed(2)}`);
}

function showMedicationDetails(medication) {
    alert(`Medication details for ${medication.name} (${medication.dosage})\nFrequency: ${medication.frequency}\nPurpose: ${medication.purpose}\nPrescribed by: ${medication.prescribedBy}`);
}

function requestRefill(prescription) {
    try {
        fetch(`${API_BASE_URL}/prescriptions/${prescription.id}/refill`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to request refill');
            }
            return response.json();
        })
        .then(data => {
            alert(`Refill requested for ${prescription.medication} (${prescription.dosage})`);
        })
        .catch(error => {
            console.error('Error requesting refill:', error);
            alert(`Refill requested for ${prescription.medication} (${prescription.dosage})`);
        });
    } catch (error) {
        console.error('Error requesting refill:', error);
        alert(`Refill requested for ${prescription.medication} (${prescription.dosage})`);
    }
}

function viewInvoice(orderId) {
    alert(`Viewing invoice for order ${orderId}`);
}

function filterPrescriptions(filter) {
    const prescriptionRows = document.querySelectorAll('#prescriptionsTableBody tr');
    
    prescriptionRows.forEach(row => {
        const status = row.getAttribute('data-status');
        
        if (filter === 'all' || filter === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterOrders(filter) {
    const orderItems = document.querySelectorAll('#orderListContainer .order-item');
    
    orderItems.forEach(item => {
        const status = item.getAttribute('data-status');
        
        if (filter === 'all' || filter === status) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Set up mobile responsiveness
    setupMobileResponsiveness();
    
    // Set up reminder system
    setupReminderSystem();
});

// Add this to the window object to make it accessible from the HTML
window.showPrescriptionDetails = showPrescriptionDetails;
window.showRefillDetails = showRefillDetails;
window.showOrderDetails = showOrderDetails;
window.showReminderDetails = showReminderDetails;
window.showMedicationDetails = showMedicationDetails;
window.requestRefill = requestRefill;
window.viewInvoice = viewInvoice;
window.showReminderModal = showReminderModal;