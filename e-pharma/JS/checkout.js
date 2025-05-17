/**
 * Checkout functionality with Stripe integration
 */

// API configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Shipping rates
const SHIPPING_RATES = {
  standard: 5.99,
  express: 12.99
};

// Tax rate (as decimal)
const TAX_RATE = 0.16; // 16% tax

// Use window global variables to avoid conflicts with cart_checkout.js
// These will be created only if they don't already exist
const stripePublishableKey = 'pk_test_51JKymwCQVbOL5Hvb7c6e5ihXH4dQEAU9arHfiCCQedp2DBRFX2RlR3cyWGBEOHkgVwREtjjC8hSuiwNlZMRJR20K00k7Ww48OQ';
let clientSecret;

// Global error handler for debugging checkout issues
window.addEventListener('error', function(event) {
  console.error('Checkout JS error:', event);
  // Only show alerts for non-Stripe errors to avoid confusion
  if (!event.message.includes('Stripe')) {
    alert('An error occurred in checkout: ' + event.message + '\nCheck the console for details.');
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Initialize checkout
  initCheckout();
  
  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const nav = document.querySelector("nav");
  
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      nav.classList.toggle("active");
    });
  }
  
  // Checkout Steps Navigation
  const nextButtons = document.querySelectorAll(".next-step");
  const prevButtons = document.querySelectorAll(".prev-step");
  const steps = document.querySelectorAll(".step");
  const stepContents = document.querySelectorAll(".checkout-step-content");
  
  // Next step buttons
  nextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextStep = button.getAttribute("data-next");
      
      // Validate current step before proceeding
      if (validateStep(Number.parseInt(nextStep) - 1)) {
        // Update steps
        steps.forEach((step) => {
          const stepNum = Number.parseInt(step.getAttribute("data-step"));
          
          if (stepNum < nextStep) {
            step.classList.add("completed");
          }
          
          if (stepNum === Number.parseInt(nextStep)) {
            step.classList.add("active");
          } else {
            step.classList.remove("active");
          }
        });
        
        // Update content
        stepContents.forEach((content) => {
          content.classList.remove("active");
        });
        
        document.getElementById(`step${nextStep}Content`).classList.add("active");
        
        // If moving to review step, populate review data
        if (nextStep === "3") {
          populateReviewData();
        }
        
        // Scroll to top of form
        document.querySelector(".checkout-form-container").scrollIntoView({ behavior: "smooth" });
      }
    });
  });
  
  // Previous step buttons
  prevButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const prevStep = button.getAttribute("data-prev");
      
      // Update steps
      steps.forEach((step) => {
        const stepNum = Number.parseInt(step.getAttribute("data-step"));
        
        if (stepNum === Number.parseInt(prevStep)) {
          step.classList.add("active");
        } else {
          step.classList.remove("active");
        }
      });
      
      // Update content
      stepContents.forEach((content) => {
        content.classList.remove("active");
      });
      
      document.getElementById(`step${prevStep}Content`).classList.add("active");
      
      // Scroll to top of form
      document.querySelector(".checkout-form-container").scrollIntoView({ behavior: "smooth" });
    });
  });
  
  // Payment method toggle
  const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
  const creditCardForm = document.getElementById("creditCardForm");
  
  paymentMethods.forEach((method) => {
    method.addEventListener("change", () => {
      if (method.value === "creditCard") {
        creditCardForm.style.display = "block";
      } else {
        creditCardForm.style.display = "none";
      }
    });
  });
  
  // Billing address toggle
  const sameAsShippingCheckbox = document.getElementById("sameAsShipping");
  const billingAddressForm = document.getElementById("billingAddressForm");
  
  sameAsShippingCheckbox.addEventListener("change", () => {
    if (sameAsShippingCheckbox.checked) {
      billingAddressForm.style.display = "none";
    } else {
      billingAddressForm.style.display = "block";
    }
  });
  
  // Shipping method change - update order summary
  const shippingMethods = document.querySelectorAll('input[name="shippingMethod"]');
  
  shippingMethods.forEach((method) => {
    method.addEventListener("change", () => {
      updateOrderSummary();
    });
  });
  
  // Add payment button handler
  const payBtn = document.getElementById('stripe-pay-btn');
  payBtn.addEventListener('click', handlePayment);
  
  // Load order summary on page load
  updateOrderSummary();
});

// Initialize checkout - loads cart items and sets up Stripe
async function initCheckout() {
  // Check if user is logged in
  const jwt = localStorage.getItem('jwt');
  if (!jwt) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }
  
  try {
    // Get Stripe publishable key
    const response = await fetch(`${API_BASE_URL}/payments/config`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load payment configuration');
    }
    
    const { publishableKey } = await response.json();
    
    // Initialize Stripe
    stripe = Stripe(publishableKey || 'pk_test_51RHUO2P2ofciHLo6KNdZeeoQnS75giBMjBvUXLsLID9BDCnFhoakVeE4nU3ktTCvbAFDvZJpbpVgAzY8pGSdGJ8l00COYKKzRH');
    elements = stripe.elements();
    
    // Create card element
    card = elements.create('card', {
      style: {
        base: {
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });
    
    // Mount card element
    card.mount('#stripe-card-element');
    
    // Handle card element errors
    card.on('change', function(event) {
      const displayError = document.getElementById('stripe-card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = '';
      }
    });
    
  } catch (error) {
    console.error('Failed to initialize checkout:', error);
    alert('There was an issue setting up the checkout. Please try again later.');
  }
}

// Handle Stripe payment submission
async function handlePayment(e) {
  e.preventDefault();
  
  const termsAgreement = document.getElementById('termsAgreement');
  if (!termsAgreement.checked) {
    alert('Please agree to the terms and conditions to continue.');
    return;
  }
  
  const payBtn = document.getElementById('stripe-pay-btn');
  payBtn.disabled = true;
  payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  try {
    // Get cart items and calculate total
    const cartItems = ShoppingCart.items;
    const subtotal = ShoppingCart.getTotalPrice();
    const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked').value;
    const shippingCost = SHIPPING_RATES[shippingMethod] || SHIPPING_RATES.standard;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shippingCost + tax;
    
    // Get authentication token
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      throw new Error('Authentication required');
    }
    
    // Create payment intent on server
    const intentResponse = await fetch(`${API_BASE_URL}/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        amount: Math.round(total * 100), // Convert to cents for Stripe
        items: cartItems,
        currency: 'usd'
      })
    });
    
    if (!intentResponse.ok) {
      throw new Error('Failed to create payment intent');
    }
    
    const { clientSecret } = await intentResponse.json();
    
    // Get shipping details for Stripe
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    
    // Confirm card payment
    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
        billing_details: {
          name: fullName,
          email: email
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (paymentIntent.status === 'succeeded') {
      // Process successful payment
      await createOrder(paymentIntent.id);
    }
  } catch (error) {
    console.error('Payment failed:', error);
    document.getElementById('stripe-card-errors').textContent = error.message;
    
    payBtn.disabled = false;
    payBtn.textContent = 'Pay Securely';
  }
}

// Create order in the database after successful payment
async function createOrder(paymentIntentId) {
  try {
    // Get cart items
    const cartItems = ShoppingCart.items;
    
    // Get shipping details
    const shippingAddress = {
      fullName: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
      postalCode: document.getElementById('postalCode').value,
      country: document.getElementById('country').value
    };
    
    // Get shipping method
    const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked').value;
    
    // Get payment method
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Calculate totals
    const subtotal = ShoppingCart.getTotalPrice();
    const shippingCost = SHIPPING_RATES[shippingMethod] || SHIPPING_RATES.standard;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shippingCost + tax;
    
    // Get authentication token
    const authToken = localStorage.getItem('e_pharma_auth_token') || 
                     localStorage.getItem('token') || 
                     localStorage.getItem('jwt') || '';
                     
    // Create order on server
    const orderResponse = await fetch(`${API_BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        paymentIntentId,
        items: cartItems,
        shippingAddress,
        shippingMethod,
        paymentMethod,
        subtotal,
        shippingCost,
        tax,
        total
      })
    });
    
    if (!orderResponse.ok) {
      throw new Error('Failed to create order');
    }
    
    const { order } = await orderResponse.json();
    
    // Show confirmation
    showOrderConfirmation(order);
    
    // Clear cart
    ShoppingCart.clearCart();
    
  } catch (error) {
    console.error('Order creation failed:', error);
    alert('Payment was successful, but there was an issue creating your order. Please contact customer support with your payment confirmation.');
  }
}

  
  document.getElementById('confirmationContent').classList.add('active');
  
  // Update steps
  document.querySelectorAll('.step').forEach(step => {
    step.classList.add('completed');
    step.classList.remove('active');
  });
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// Update order summary
function updateOrderSummary() {
  // Get cart items
  const cartItems = ShoppingCart.items;
  
  // Update order items display
  const orderItemsContainer = document.getElementById('orderItems');
  orderItemsContainer.innerHTML = '';
  
  if (cartItems.length === 0) {
    orderItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    
    // Redirect to cart page if empty
    window.location.href = 'cart.html';
    return;
  }
  
  // Add each item to the order summary
  cartItems.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'order-item';
    itemElement.innerHTML = `
      <div class="item-image">
        <img src="${item.image || 'images/product-placeholder.jpg'}" alt="${item.name}">
      </div>
      <div class="item-details">
        <div class="item-name">${item.name}</div>
        <div class="item-quantity">Qty: ${item.quantity}</div>
      </div>
      <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
    `;
    orderItemsContainer.appendChild(itemElement);
  });
  
  // Calculate totals
  const subtotal = ShoppingCart.getTotalPrice();
  const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked')?.value || 'standard';
  const shippingCost = SHIPPING_RATES[shippingMethod] || SHIPPING_RATES.standard;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;
  
  // Update totals display
  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('shipping').textContent = `$${shippingCost.toFixed(2)}`;
  document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Populate review step with data from previous steps
function populateReviewData() {
  // Shipping review
  const shippingReview = document.getElementById("shippingReview");
  shippingReview.innerHTML = `
    <p><strong>Name:</strong> ${document.getElementById("fullName").value}</p>
    <p><strong>Email:</strong> ${document.getElementById("email").value}</p>
    <p><strong>Phone:</strong> ${document.getElementById("phone").value}</p>
    <p><strong>Address:</strong> ${document.getElementById("address").value}</p>
    <p><strong>City:</strong> ${document.getElementById("city").value}</p>
    <p><strong>Postal Code:</strong> ${document.getElementById("postalCode").value}</p>
    <p><strong>Country:</strong> ${document.getElementById("country").options[document.getElementById("country").selectedIndex]?.text || 'Unknown'}</p>
  `;
  
  // Payment review
  const paymentReview = document.getElementById("paymentReview");
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'creditCard';
  
  let paymentText = "Credit Card";
  
  paymentReview.innerHTML = `<p><strong>Payment Method:</strong> ${paymentText}</p>`;
  
  // Order review
  const orderReview = document.getElementById("orderReview");
  const cartItems = ShoppingCart.items;
  
  let orderText = "<ul class='review-items'>";
  
  cartItems.forEach((item) => {
    orderText += `<li>${item.name} × ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`;
  });
  
  orderText += "</ul>";
  
  // Calculate totals
  const subtotal = ShoppingCart.getTotalPrice();
  const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked')?.value || 'standard';
  const shippingCost = SHIPPING_RATES[shippingMethod] || SHIPPING_RATES.standard;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;
  
  orderText += `
    <div class="review-totals">
      <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
      <p><strong>Shipping:</strong> $${shippingCost.toFixed(2)}</p>
      <p><strong>Tax:</strong> $${tax.toFixed(2)}</p>
      <p><strong>Total:</strong> $${total.toFixed(2)}</p>
    </div>
  `;
  
  orderReview.innerHTML = orderText;
}

// Validate form fields for each step
function validateStep(stepNumber) {
  switch (stepNumber) {
    case 1:
      // Shipping validation
      const requiredShippingFields = ["fullName", "email", "phone", "address", "city", "postalCode", "country"];
      return validateRequiredFields(requiredShippingFields);
      
    case 2:
      // Payment validation - card element is validated by Stripe
      return true;
      
    case 3:
      // Terms agreement validation
      return document.getElementById("termsAgreement").checked;
      
    default:
      return true;
  }
}

// Validate required form fields
function validateRequiredFields(fields) {
  let isValid = true;
  let missingFields = [];
  fields.forEach((field) => {
    const input = document.getElementById(field);
    if (input && !input.value.trim()) {
      input.classList.add("error");
      missingFields.push(field);
      isValid = false;
    } else if (input) {
      input.classList.remove("error");
    }
  });
  if (!isValid) {
    const fieldNames = missingFields.map(f => {
      const label = document.querySelector(`label[for='${f}']`);
      return label ? label.textContent : f;
    });
    alert("Please fill in all required fields:\n" + fieldNames.join(", "));
    console.warn("Missing fields:", missingFields);
  }
  return isValid;
}
