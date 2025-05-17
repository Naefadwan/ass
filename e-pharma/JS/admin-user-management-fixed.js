// Admin User Management Script
// This script provides functionality for managing user accounts in the admin dashboard
console.log("👥 ADMIN USERS: User management script loaded");

document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the admin page
  if (!window.location.pathname.includes('admin.html')) return;
  
  console.log("👥 ADMIN USERS: Initializing user management panel");
  
  // Add user management tab to admin dashboard if needed
  initUserManagementTab();
  
  // Set up event listeners for user management
  setupUserManagementEvents();
});

// Create and inject the user management tab & panel
function initUserManagementTab() {
  // Look for tabs section
  const tabsContainer = document.querySelector('.admin-tabs');
  const contentContainer = document.querySelector('.admin-content');
  
  if (!tabsContainer || !contentContainer) {
    console.error("👥 ADMIN USERS: Couldn't find admin tabs or content container");
    return;
  }
  
  // Add user management tab
  const userManagementTab = document.createElement('button');
  userManagementTab.className = 'admin-tab-btn';
  userManagementTab.dataset.target = 'user-management-panel';
  userManagementTab.innerHTML = '<i class="fas fa-users"></i> User Management';
  tabsContainer.appendChild(userManagementTab);
  
  // Add user management panel
  const userManagementPanel = document.createElement('div');
  userManagementPanel.className = 'admin-tab-panel';
  userManagementPanel.id = 'user-management-panel';
  
  // Add panel content
  userManagementPanel.innerHTML = `
    <div class="admin-panel-header">
      <h2>User Management</h2>
      <p>Manage user accounts and permissions</p>
    </div>
    
    <div class="admin-panel-content">
      <div class="user-actions">
        <div class="search-users">
          <input type="text" id="userSearch" placeholder="Search users by email or name">
          <button id="searchUsersBtn" class="btn btn-primary">Search</button>
        </div>
        <div class="filter-users">
          <select id="roleFilter">
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="patient">Patients</option>
          </select>
          <button id="refreshUserList" class="btn btn-outline">Refresh</button>
        </div>
      </div>
      
      <div class="users-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="usersList">
            <tr>
              <td colspan="6" class="loading-users">Loading users...</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div id="userEditModal" class="admin-modal">
        <div class="admin-modal-content">
          <span class="admin-modal-close">&times;</span>
          <h3>Edit User</h3>
          <form id="editUserForm">
            <input type="hidden" id="editUserId">
            <div class="form-group">
              <label for="editUserName">Name</label>
              <input type="text" id="editUserName" required>
            </div>
            <div class="form-group">
              <label for="editUserEmail">Email</label>
              <input type="email" id="editUserEmail" required>
            </div>
            <div class="form-group">
              <label for="editUserRole">Role</label>
              <select id="editUserRole" required>
                <option value="patient">Patient</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline cancel-edit">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  contentContainer.appendChild(userManagementPanel);
  
  // Add CSS styles for user management
  addUserManagementStyles();
}

// Set up event listeners for user management actions
function setupUserManagementEvents() {
  // Variable to store users fetched from database
  let dbUsers = [];
  
  // Fetch users from database
  async function fetchUsersFromDatabase() {
    console.log("👥 ADMIN USERS: Fetching users from database");
    try {
      // Get authentication token
      const authToken = localStorage.getItem('e_pharma_auth_token');
      if (!authToken) {
        console.error("👥 ADMIN USERS: No auth token found");
        return [];
      }
      
      // Fetch users from the server
      const response = await fetch('../api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("👥 ADMIN USERS: Fetched users:", data);
      
      // Format database users to match our structure
      dbUsers = data.map(user => ({
        id: user.id || user.userId,
        name: user.name || user.fullName || user.username || 'Unknown',
        email: user.email,
        role: user.role || 'patient',
        lastLogin: user.lastLogin || 'Never'
      }));
      
      return dbUsers;
    } catch (error) {
      console.error("👥 ADMIN USERS: Error fetching users:", error);
      
      // Fallback to localStorage data if API fails
      const allLocalUsers = getAllLocalUsersAsBackup();
      if (allLocalUsers.length > 0) {
        dbUsers = allLocalUsers;
        return allLocalUsers;
      }
      
      // If all else fails, use mock data as fallback for development
      dbUsers = [
        { id: 1, name: 'Admin User', email: 'admin@epharma.com', role: 'admin', lastLogin: '2023-05-10 14:30:22' },
        { id: 2, name: 'John Smith', email: 'john@example.com', role: 'patient', lastLogin: '2023-05-09 09:15:07' },
        { id: 3, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'patient', lastLogin: '2023-05-11 11:45:33' }
      ];
      return dbUsers;
    }
  }
  
  // Helper function to get all user data from localStorage as a backup
  function getAllLocalUsersAsBackup() {
    try {
      // First try to get from user_info which should have all users for an admin
      const userInfoStr = localStorage.getItem('admin_users_cache');
      if (userInfoStr) {
        return JSON.parse(userInfoStr);
      }
      
      // If that fails, at least get the current user
      const userInfoData = localStorage.getItem('user_info');
      const userData = localStorage.getItem('userData');
      
      let users = [];
      
      if (userInfoData) {
        try {
          const user = JSON.parse(userInfoData);
          users.push({
            id: user.userId || 1,
            name: user.name || user.username || 'Current User',
            email: user.email || 'unknown@example.com',
            role: user.role || 'patient',
            lastLogin: 'Current session'
          });
        } catch (e) {}
      }
      
      if (userData && userData !== userInfoData) {
        try {
          const user = JSON.parse(userData);
          if (!users.some(u => u.email === user.email)) {
            users.push({
              id: user.userId || 2,
              name: user.name || user.username || 'Current User',
              email: user.email || 'unknown@example.com',
              role: user.role || 'patient',
              lastLogin: 'Current session'
            });
          }
        } catch (e) {}
      }
      
      return users;
    } catch (e) {
      console.error("👥 ADMIN USERS: Error getting backup users:", e);
      return [];
    }
  }
  
  // Load users into table
  async function loadUsers(users) {
    // If no users provided, fetch them
    if (!users) {
      users = await fetchUsersFromDatabase();
    }
    
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    // Clear existing rows
    usersList.innerHTML = '';
    
    if (users.length === 0) {
      usersList.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
      return;
    }
    
    // Add user rows
    users.forEach(user => {
      const row = document.createElement('tr');
      row.dataset.userId = user.id;
      
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>
          <span class="user-role ${user.role}">${user.role}</span>
          <button class="action-btn toggle-role" data-id="${user.id}" data-role="${user.role}">
            Change to ${user.role === 'admin' ? 'Patient' : 'Admin'}
          </button>
        </td>
        <td>${user.lastLogin}</td>
        <td>
          <button class="action-btn edit-user" data-id="${user.id}">Edit</button>
          <button class="action-btn delete-user" data-id="${user.id}">Delete</button>
        </td>
      `;
      
      usersList.appendChild(row);
    });
    
    // Add event listeners to buttons
    attachUserActionEvents();
  }
  
  // Attach events to user action buttons
  function attachUserActionEvents() {
    // Edit user buttons
    document.querySelectorAll('.edit-user').forEach(button => {
      button.addEventListener('click', function() {
        const userId = this.dataset.id;
        openEditUserModal(userId);
      });
    });
    
    // Delete user buttons
    document.querySelectorAll('.delete-user').forEach(button => {
      button.addEventListener('click', function() {
        const userId = this.dataset.id;
        confirmDeleteUser(userId);
      });
    });
    
    // Role change buttons (added for direct role toggle)
    document.querySelectorAll('.toggle-role').forEach(button => {
      button.addEventListener('click', function() {
        const userId = this.dataset.id;
        const currentRole = this.dataset.role;
        const newRole = currentRole === 'admin' ? 'patient' : 'admin';
        changeUserRole(userId, newRole);
      });
    });
  }
  
  // Function to change user role in the database
  async function changeUserRole(userId, newRole) {
    console.log(`👥 ADMIN USERS: Changing user ${userId} role to ${newRole}`);
    
    try {
      // Get authentication token
      const authToken = localStorage.getItem('e_pharma_auth_token');
      if (!authToken) {
        console.error("👥 ADMIN USERS: No auth token found");
        alert("Authentication error: Please log in again.");
        return;
      }
      
      // Call the API to update the user role
      const response = await fetch(`../api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!response.ok) {
        // If server update fails, show error
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`👥 ADMIN USERS: User role updated in database to ${newRole}`);
      
      // Also update the user in our local cache
      const userIndex = dbUsers.findIndex(u => u.id == userId);
      if (userIndex !== -1) {
        dbUsers[userIndex].role = newRole;
      }
      
      // Update localStorage cache
      localStorage.setItem('admin_users_cache', JSON.stringify(dbUsers));
      
      // Check if the user's data is in localStorage (in case it's the current user)
      const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (storedUserData && (storedUserData.userId == userId || storedUserData.id == userId)) {
        // Update the role in localStorage
        storedUserData.role = newRole;
        localStorage.setItem('userData', JSON.stringify(storedUserData));
        console.log(`👥 ADMIN USERS: Updated user role in userData to ${newRole}`);
      }
      
      // Also check user_info
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      if (userInfo && (userInfo.userId == userId || userInfo.id == userId)) {
        userInfo.role = newRole;
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        console.log(`👥 ADMIN USERS: Updated user role in user_info to ${newRole}`);
      }
      
      // If changing current user's role, update global variables
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId == userId) {
        window.userRole = newRole;
        console.log(`👥 ADMIN USERS: Updated current user's role to ${newRole}`);
      }
      
      // Refresh the user list to show the updated role
      await loadUsers();
      
      // Show success message
      alert(`User role successfully changed to ${newRole}`);
      
      // If this was the current user and role changed to patient, redirect to home
      if (currentUserId == userId && newRole.toLowerCase() === 'patient') {
        setTimeout(() => {
          window.location.href = 'home2.html';
        }, 1000);
      }
      
    } catch (error) {
      console.error("👥 ADMIN USERS: Error updating user role:", error);
      alert(`Failed to update user role: ${error.message}`);
      
      // Refresh the list to ensure we're showing current data
      loadUsers();
    }
  }
  
  function openEditUserModal(userId) {
    // Find user in our cached database users
    const user = dbUsers.find(u => u.id == userId);
    if (!user) {
      console.error(`👥 ADMIN USERS: User with ID ${userId} not found`);
      alert('User not found');
      return;
    }
    
    // Populate form
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserRole').value = user.role;
    
    // Show modal
    document.getElementById('userEditModal').style.display = 'block';
  }
  
  // Save user changes to the database
  async function saveUserChanges(userId, formData) {
    try {
      // Get authentication token
      const authToken = localStorage.getItem('e_pharma_auth_token');
      if (!authToken) {
        console.error("👥 ADMIN USERS: No auth token found");
        return false;
      }
      
      // Call the API to update the user
      const response = await fetch(`../api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role
        })
      });
      
      if (!response.ok) {
        // If server update fails, show error
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Update the user in our local cache
      const userIndex = dbUsers.findIndex(u => u.id == userId);
      if (userIndex !== -1) {
        dbUsers[userIndex].name = formData.name;
        dbUsers[userIndex].email = formData.email;
        dbUsers[userIndex].role = formData.role;
      }
      
      // Update localStorage cache
      localStorage.setItem('admin_users_cache', JSON.stringify(dbUsers));
      
      // If this is the current user, update local storage user info
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId == userId) {
        // Update userData
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData) {
          userData.name = formData.name;
          userData.email = formData.email;
          userData.role = formData.role;
          localStorage.setItem('userData', JSON.stringify(userData));
        }
        
        // Update user_info
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        if (userInfo) {
          userInfo.name = formData.name;
          userInfo.email = formData.email;
          userInfo.role = formData.role;
          localStorage.setItem('user_info', JSON.stringify(userInfo));
        }
        
        // Update global variable if exists
        if (window.userRole) {
          window.userRole = formData.role;
        }
      }
      
      return true;
    } catch (error) {
      console.error("👥 ADMIN USERS: Error updating user:", error);
      alert(`Failed to update user: ${error.message}`);
      return false;
    }
  }
  
  // Handle modal close button
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('admin-modal-close') || e.target.classList.contains('cancel-edit')) {
      document.getElementById('userEditModal').style.display = 'none';
    }
  });
  
  // Handle form submission
  document.addEventListener('submit', async function(e) {
    if (e.target.id === 'editUserForm') {
      e.preventDefault();
      
      const userId = document.getElementById('editUserId').value;
      const userName = document.getElementById('editUserName').value;
      const userEmail = document.getElementById('editUserEmail').value;
      const userRole = document.getElementById('editUserRole').value;
      
      console.log(`👥 ADMIN USERS: Updating user ${userId} with role ${userRole}`);
      
      // Update user in database
      const success = await saveUserChanges(userId, {
        name: userName,
        email: userEmail,
        role: userRole
      });
      
      if (success) {
        // Reload users list
        await loadUsers();
        
        // Close modal
        document.getElementById('userEditModal').style.display = 'none';
        
        // Show success message
        alert(`User ${userName} updated successfully!`);
      }
    }
  });
  
  // Confirm user deletion
  function confirmDeleteUser(userId) {
    const user = dbUsers.find(u => u.id == userId);
    if (!user) {
      console.error(`👥 ADMIN USERS: User with ID ${userId} not found for deletion`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
      console.log(`👥 ADMIN USERS: Deleting user ${userId}`);
      deleteUser(userId);
    }
  }
  
  // Delete user from database
  async function deleteUser(userId) {
    try {
      // Get authentication token
      const authToken = localStorage.getItem('e_pharma_auth_token');
      if (!authToken) {
        console.error("👥 ADMIN USERS: No auth token found for deletion");
        alert("Authentication error: Please log in again.");
        return;
      }
      
      // Call the API to delete the user
      const response = await fetch(`../api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // If server deletion fails, show error
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`👥 ADMIN USERS: User deleted from database successfully`);
      
      // Remove user from our local cache
      const index = dbUsers.findIndex(u => u.id == userId);
      if (index !== -1) {
        dbUsers.splice(index, 1);
      }
      
      // Update localStorage cache
      localStorage.setItem('admin_users_cache', JSON.stringify(dbUsers));
      
      // Reload users list
      await loadUsers();
      
      // Show success message
      alert(`User deleted successfully!`);
      
    } catch (error) {
      console.error("👥 ADMIN USERS: Error deleting user:", error);
      alert(`Failed to delete user: ${error.message}`);
      
      // Refresh the list to ensure we're showing current data
      loadUsers();
    }
  }
  
  // Search users
  document.addEventListener('click', function(e) {
    if (e.target.id === 'searchUsersBtn') {
      const searchTerm = document.getElementById('userSearch').value.toLowerCase();
      
      if (!searchTerm) {
        loadUsers(); // Reset to all users if search is empty
        return;
      }
      
      const filteredUsers = dbUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
      );
      
      loadUsers(filteredUsers);
    }
    
    if (e.target.id === 'refreshUserList') {
      // Clear any filters
      document.getElementById('userSearch').value = '';
      document.getElementById('roleFilter').value = 'all';
      
      // Reload all users from the database
      loadUsers();
    }
  });
  
  // Filter by role
  document.addEventListener('change', function(e) {
    if (e.target.id === 'roleFilter') {
      const selectedRole = e.target.value;
      
      if (selectedRole === 'all') {
        loadUsers(); // Reset to all users
        return;
      }
      
      const filteredUsers = dbUsers.filter(user => 
        user.role.toLowerCase() === selectedRole.toLowerCase()
      );
      
      loadUsers(filteredUsers);
    }
  });
  
  // Initial load of users
  loadUsers();
}

// Add styles for user management
function addUserManagementStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .user-actions {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    
    .search-users {
      display: flex;
      gap: 10px;
    }
    
    .filter-users {
      display: flex;
      gap: 10px;
    }
    
    .users-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .users-table th, .users-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }
    
    .users-table th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    
    .user-role {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 5px;
    }
    
    .user-role.admin {
      background-color: #dc3545;
      color: white;
    }
    
    .user-role.patient {
      background-color: #28a745;
      color: white;
    }
    
    .admin-modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
    }
    
    .admin-modal-content {
      background-color: white;
      margin: 10% auto;
      padding: 20px;
      border-radius: 5px;
      width: 50%;
      max-width: 500px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .admin-modal-close {
      color: #aaa;
      float: right;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
    }
    
    .admin-modal-close:hover {
      color: black;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
    }
    
    .form-group input, .form-group select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .loading-users {
      text-align: center;
      padding: 20px;
      font-style: italic;
      color: #6c757d;
    }
    
    .toggle-role {
      margin-left: 5px;
      font-size: 11px;
      padding: 2px 4px;
    }
  `;
  document.head.appendChild(styleEl);
}
