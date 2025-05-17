/**
 * Shopping Cart Management System
 * Handles adding, removing, updating items and persistence
 */

// Cart object to manage all cart operations
const ShoppingCart = {
  // Cart data
  items: [],
  
  // Storage key for localStorage
  storageKey: 'e_pharma_cart',
  
  // Initialize the cart
  init() {
    this.loadFromStorage();
    this.updateCartUI();
    this.bindEvents();
    console.log('[Cart] Initialized with', this.items.length, 'items');
  },
  
  // Load cart data from localStorage
  loadFromStorage() {
    try {
      const storedCart = localStorage.getItem(this.storageKey);
      if (storedCart) {
        this.items = JSON.parse(storedCart);
      }
    } catch (err) {
      console.error('[Cart] Failed to load cart from storage:', err);
      this.items = [];
    }
  },
  
  // Save cart data to localStorage
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (err) {
      console.error('[Cart] Failed to save cart to storage:', err);
    }
  },
  
  // Add item to cart
  addItem(product) {
    // Defensive: Prevent adding invalid products
    if (!product || !product.id || !product.name || typeof product.price !== 'number' || isNaN(product.price)) {
      console.error('[Cart] Invalid product passed to addItem:', product);
      return;
    }
    // Check if item already exists in cart
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      // Always increment by 1 when adding to cart
      existingItem.quantity += 1;
    } else {
      // Add new item with default quantity of 1 if not specified
      const newItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      };
      this.items.push(newItem);
    }
    
    this.saveToStorage();
    this.updateCartUI();
    
    // Show notification
    this.showNotification(`${product.name} added to cart`);
  },
  
  // Remove item from cart
  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveToStorage();
    this.updateCartUI();
  },
  
  // Update item quantity
  updateQuantity(productId, newQuantity) {
    const item = this.items.find(item => item.id === productId);
    
    if (item) {
      if (newQuantity <= 0) {
        // Remove item if quantity is zero or negative
        this.removeItem(productId);
      } else {
        item.quantity = newQuantity;
        this.saveToStorage();
        this.updateCartUI();
      }
    }
  },
  
  // Clear all items from cart
  clearCart() {
    this.items = [];
    this.saveToStorage();
    this.updateCartUI();
  },
  
  // Calculate total price of items in cart
  getTotalPrice() {
    return this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  },
  
  // Get total number of items in cart
  getTotalItems() {
    return this.items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  },
  
  // Update cart UI elements
  updateCartUI() {
    // Update cart count in header
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = this.getTotalItems();
    }
    
    // Update cart dropdown if it exists
    this.updateCartDropdown();
    
    // Update cart page if we're on it
    this.updateCartPage();
    
    // Dispatch a custom event that other components can listen for
    document.dispatchEvent(new CustomEvent('cart:updated', {
      detail: { 
        cartItems: this.items,
        totalItems: this.getTotalItems(),
        totalPrice: this.getTotalPrice()
      }
    }));
  },
  
  // Update the cart dropdown in the header
  updateCartDropdown() {
    const cartDropdown = document.querySelector('.cart-dropdown-items');
    if (!cartDropdown) return;
    
    // Clear existing items
    cartDropdown.innerHTML = '';
    
    if (this.items.length === 0) {
      cartDropdown.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
      return;
    }
    
    // Add each item to the dropdown
    this.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-dropdown-item';
      itemElement.innerHTML = `
        <img src="${item.image || 'images/product-placeholder.jpg'}" alt="${item.name}">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <div class="cart-dropdown-qty-controls">
            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
            <span class="cart-dropdown-qty">${item.quantity}</span>
            <button class="quantity-btn increase" data-id="${item.id}">+</button>
          </div>
          <p>$${(item.price * item.quantity).toFixed(2)}</p>
        </div>
        <button class="remove-cart-item" data-id="${item.id}">&times;</button>
      `;
      cartDropdown.appendChild(itemElement);
    });
    
    // Add total
    const totalElement = document.createElement('div');
    totalElement.className = 'cart-dropdown-total';
    totalElement.innerHTML = `
      <span>Total:</span>
      <span>$${this.getTotalPrice().toFixed(2)}</span>
    `;
    cartDropdown.appendChild(totalElement);
    
    // Add Clear Cart button
    const clearCartBtn = document.createElement('button');
    clearCartBtn.className = 'clear-cart-btn';
    clearCartBtn.id = 'clear-cart-dropdown';
    clearCartBtn.textContent = 'Clear Cart';
    cartDropdown.appendChild(clearCartBtn);
    
    // Add view cart button if not already there
    const viewCartButton = document.querySelector('.view-cart-button');
    if (!viewCartButton) {
      const buttonElement = document.createElement('a');
      buttonElement.className = 'view-cart-button';
      buttonElement.href = 'cart.html';
      buttonElement.textContent = 'View Cart';
      cartDropdown.appendChild(buttonElement);
    }
  },
  
  // Update the cart page if we're on it
  updateCartPage() {
    const cartTable = document.querySelector('.cart-items-table');
    if (!cartTable) return;
    
    // Clear existing items
    cartTable.innerHTML = '';
    
    if (this.items.length === 0) {
      cartTable.innerHTML = '<tr><td colspan="5" class="empty-cart-message">Your cart is empty</td></tr>';
      return;
    }
    
    // Add table header
    cartTable.innerHTML = `
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Total</th>
          <th>Remove</th>
        </tr>
      </thead>
      <tbody id="cart-items-body"></tbody>
    `;
    
    const cartBody = document.getElementById('cart-items-body');
    
    // Add each item to the table
    this.items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="product-cell">
          <img src="${item.image || 'images/product-placeholder.jpg'}" alt="${item.name}">
          <span>${item.name}</span>
        </td>
        <td>$${item.price.toFixed(2)}</td>
        <td>
          <div class="quantity-controls">
            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
            <input type="number" value="${item.quantity}" min="1" data-id="${item.id}">
            <button class="quantity-btn increase" data-id="${item.id}">+</button>
          </div>
        </td>
        <td>$${(item.price * item.quantity).toFixed(2)}</td>
        <td><button class="remove-item" data-id="${item.id}">&times;</button></td>
      `;
      cartBody.appendChild(row);
    });
    
    // Add Clear Cart button if items exist
    let clearCartRow = document.getElementById('clear-cart-row');
    if (!clearCartRow) {
      clearCartRow = document.createElement('tr');
      clearCartRow.id = 'clear-cart-row';
      clearCartRow.innerHTML = `<td colspan="5" style="text-align:right;"><button id="clear-cart" class="clear-cart-btn">Clear Cart</button></td>`;
      cartBody.parentNode.appendChild(clearCartRow);
    }
    // Add event listener for clear cart
    setTimeout(() => {
      const clearBtn = document.getElementById('clear-cart');
      if (clearBtn) {
        clearBtn.onclick = (e) => {
          e.preventDefault();
          ShoppingCart.clearCart();
        };
      }
    }, 0);
    
    // Update cart totals
    const cartTotals = document.querySelector('.cart-totals');
    if (cartTotals) {
      cartTotals.innerHTML = `
        <div class="subtotal">
          <span>Subtotal:</span>
          <span>$${this.getTotalPrice().toFixed(2)}</span>
        </div>
        <div class="shipping">
          <span>Shipping:</span>
          <span>Calculated at checkout</span>
        </div>
        <div class="total">
          <span>Total:</span>
          <span>$${this.getTotalPrice().toFixed(2)}</span>
        </div>
        <a href="checkout.html" class="checkout-button">Proceed to Checkout</a>
      `;
    }
  },
  
  // Bind events for cart interactions
  bindEvents() {
    // Listen for click events on document
    document.addEventListener('click', (event) => {
      // Add to cart buttons
      if (event.target.matches('.add-to-cart')) {
        event.preventDefault();
        const productId = event.target.dataset.id ? event.target.dataset.id.trim() : '';
        const productName = event.target.dataset.name;
        const productPrice = parseFloat(event.target.dataset.price);
        const productImage = event.target.dataset.image;
        // Defensive: Ensure productId is a valid string
        if (!productId || typeof productId !== 'string' || productId === '' || !productName || isNaN(productPrice)) {
          alert("Invalid product data. Please try again.");
          console.error('[Cart] Add-to-cart Validation Failed:', { productId, productName, productPrice, productImage });
          return;
        }
        this.addItem({
          id: productId,
          name: productName,
          price: productPrice,
          image: productImage,
          quantity: 1
        });
      }
      
      // Remove item buttons (main cart and dropdown)
      if (event.target.matches('.remove-cart-item') || event.target.matches('.remove-item')) {
        event.preventDefault();
        const productId = event.target.dataset.id ? event.target.dataset.id.trim() : '';
        this.removeItem(productId);
      }

      // Clear Cart button (main cart and dropdown)
      if (event.target.matches('#clear-cart') || event.target.matches('#clear-cart-dropdown')) {
        event.preventDefault();
        this.clearCart();
      }
      
      // Quantity increase buttons
      if (event.target.matches('.quantity-btn.increase')) {
        const productId = event.target.dataset.id ? event.target.dataset.id.trim() : '';
        const currentItem = this.items.find(item => item.id === productId);
        if (currentItem) {
          this.updateQuantity(productId, currentItem.quantity + 1);
        }
      }
      
      // Quantity decrease buttons
      if (event.target.matches('.quantity-btn.decrease')) {
        const productId = event.target.dataset.id ? event.target.dataset.id.trim() : '';
        const currentItem = this.items.find(item => item.id === productId);
        if (currentItem) {
          if (currentItem.quantity > 1) {
            this.updateQuantity(productId, currentItem.quantity - 1);
          } else {
            // Remove item if quantity would go below 1
            this.removeItem(productId);
          }
        }
      }
    });
    
    // Listen for changes on quantity inputs
    document.addEventListener('change', (event) => {
      if (event.target.matches('.quantity-controls input')) {
        const productId = event.target.dataset.id ? event.target.dataset.id.trim() : '';
        let newQuantity = parseInt(event.target.value);
        if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
        this.updateQuantity(productId, newQuantity);
      }
    });
  },
  
  // Show a notification when item is added to cart
  showNotification(message) {
    // Check if notification container exists
    let notificationContainer = document.querySelector('.cart-notification-container');
    
    // Create container if it doesn't exist
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'cart-notification-container';
      document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    
    // Add notification to container
    notificationContainer.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }
};

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  ShoppingCart.init();
});
