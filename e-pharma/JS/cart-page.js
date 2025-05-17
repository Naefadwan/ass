/**
 * Shopping Cart Page Functionality
 * Handles displaying cart contents and checkout process
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize cart page functionality
  initCartPage();
});

// Initialize cart page
function initCartPage() {
  // Elements
  const cartTableBody = document.getElementById('cart-items');
  const subtotalElement = document.getElementById('subtotal');
  const shippingElement = document.getElementById('shipping-cost');
  const taxElement = document.getElementById('tax-amount');
  const totalElement = document.getElementById('total-amount');
  const checkoutButton = document.getElementById('checkout-button');
  
  // Load cart data
  const cartItems = ShoppingCart.items;
  
  // Update UI
  updateCartTable();
  updateCartTotals();
  
  // Set up event listeners
  setupEventListeners();
  
  // Update cart table with items
  function updateCartTable() {
    if (!cartTableBody) return;
    
    // Clear existing items
    cartTableBody.innerHTML = '';
    
    if (cartItems.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="5" class="empty-cart-message">
          <p>Your cart is empty</p>
          <a href="medicines.html" class="button">Continue Shopping</a>
        </td>
      `;
      cartTableBody.appendChild(emptyRow);
      
      // Hide checkout button if cart is empty
      if (checkoutButton) {
        checkoutButton.style.display = 'none';
      }
      
      return;
    }
    
    // Show checkout button
    if (checkoutButton) {
      checkoutButton.style.display = 'block';
    }
    
    // Add each item to the table
    cartItems.forEach(item => {
      const row = document.createElement('tr');
      row.className = 'cart-item';
      row.dataset.id = item.id;
      
      row.innerHTML = `
        <td class="product-info">
          <img src="${item.image || 'images/product-placeholder.jpg'}" alt="${item.name}">
          <div>
            <h4>${item.name}</h4>
            <p class="item-id">ID: ${item.id}</p>
          </div>
        </td>
        <td class="price">$${item.price.toFixed(2)}</td>
        <td class="quantity">
          <div class="quantity-control">
            <button class="decrease-quantity" data-id="${item.id}">-</button>
            <input type="number" value="${item.quantity}" min="1" data-id="${item.id}">
            <button class="increase-quantity" data-id="${item.id}">+</button>
          </div>
        </td>
        <td class="item-total">$${(item.price * item.quantity).toFixed(2)}</td>
        <td class="remove">
          <button class="remove-item" data-id="${item.id}">×</button>
        </td>
      `;
      
      cartTableBody.appendChild(row);
    });
  }
  
  // Update cart totals
  function updateCartTotals() {
    const subtotal = ShoppingCart.getTotalPrice();
    const shipping = subtotal > 50 ? 0 : 8.99;
    const tax = subtotal * 0.16; // 16% tax
    const total = subtotal + shipping + tax;
    
    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingElement) {
      shippingElement.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    }
    if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Listen for clicks on the document
    document.addEventListener('click', (event) => {
      // Increase quantity
      if (event.target.classList.contains('increase-quantity')) {
        const productId = event.target.dataset.id;
        const currentItem = cartItems.find(item => item.id == productId);
        
        if (currentItem) {
          ShoppingCart.updateQuantity(productId, currentItem.quantity + 1);
          updateCartTable();
          updateCartTotals();
        }
      }
      
      // Decrease quantity
      if (event.target.classList.contains('decrease-quantity')) {
        const productId = event.target.dataset.id;
        const currentItem = cartItems.find(item => item.id == productId);
        
        if (currentItem && currentItem.quantity > 1) {
          ShoppingCart.updateQuantity(productId, currentItem.quantity - 1);
          updateCartTable();
          updateCartTotals();
        }
      }
      
      // Remove item
      if (event.target.classList.contains('remove-item')) {
        const productId = event.target.dataset.id;
        ShoppingCart.removeItem(productId);
        updateCartTable();
        updateCartTotals();
      }
    });
    
    // Listen for changes on quantity inputs
    document.addEventListener('change', (event) => {
      if (event.target.matches('.quantity-control input')) {
        const productId = event.target.dataset.id;
        const newQuantity = parseInt(event.target.value);
        
        if (!isNaN(newQuantity) && newQuantity > 0) {
          ShoppingCart.updateQuantity(productId, newQuantity);
          updateCartTable();
          updateCartTotals();
        }
      }
    });
    
    // Clear cart button
    const clearCartButton = document.getElementById('clear-cart');
    if (clearCartButton) {
      clearCartButton.addEventListener('click', () => {
        ShoppingCart.clearCart();
        updateCartTable();
        updateCartTotals();
      });
    }
    
    // Checkout button
    if (checkoutButton) {
      checkoutButton.addEventListener('click', () => {
        // Check if user is logged in
        const token = localStorage.getItem('jwt');
        if (!token) {
          // Redirect to login with return URL
          window.location.href = `login.html?redirect=${encodeURIComponent('checkout.html')}`;
          return;
        }
        
        // Go to checkout
        window.location.href = 'checkout.html';
      });
    }
  }
}
