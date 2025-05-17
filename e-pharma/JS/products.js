/**
 * Products management system for E-Pharma
 * Handles fetching and displaying products from different categories
 */

const ProductManager = {
  // API Base URL
  apiBaseUrl: "http://127.0.0.1:5000/api",
  
  // Initialize product manager
  init() {
    console.log('[Products] Initializing product manager');
    this.setupEventListeners();
    this.loadProducts();
  },
  
  // Set up event listeners
  setupEventListeners() {
    // Product category filter buttons
    const categoryButtons = document.querySelectorAll('.category-filter button');
    if (categoryButtons.length) {
      categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
          const category = button.dataset.category;
          this.filterProductsByCategory(category);
          
          // Update active button
          categoryButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
        });
      });
    }
    
    // Search functionality
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.filterProductsBySearch(searchInput.value);
      });
    }
  },
  
  // Load products based on current page
  loadProducts() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage.includes('skincare') || currentPage.includes('skin-care')) {
      this.loadSkincareProducts();
    } else if (currentPage.includes('medicines') || currentPage.includes('existingmed')) {
      this.loadMedicineProducts();
    } else if (currentPage.includes('vitamins')) {
      this.loadVitaminProducts();
    } else {
      // Default to loading all products
      this.loadAllProducts();
    }
  },
  
  // Load skincare products
  async loadSkincareProducts() {
    try {
      // Try to fetch from skincare endpoint first
      let response = await fetch(`${this.apiBaseUrl}/skincare`);
      
      // If it fails, try alternative endpoints
      if (!response.ok) {
        console.log('[Products] Skincare endpoint failed, trying alternative');
        response = await fetch(`${this.apiBaseUrl}/products?category=skincare`);
      }
      
      if (!response.ok) {
        throw new Error('Failed to load skincare products');
      }
      
      const responseData = await response.json();
      // Handle both direct array response and {success, data} format
      const data = responseData.success && responseData.data ? responseData.data : responseData;
      this.displayProducts(data, 'skincare');
    } catch (error) {
      console.error('Error loading skincare products:', error);
      this.displayError('Failed to load products. Please try again later.');
    }
  },
  
  // Load medicine products
  async loadMedicineProducts() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/medicines`);
      
      if (!response.ok) {
        throw new Error('Failed to load medicine products');
      }
      
      const responseData = await response.json();
      // Handle both direct array response and {success, data} format
      const data = responseData.success && responseData.data ? responseData.data : responseData;
      this.displayProducts(data, 'medicine');
    } catch (error) {
      console.error('Error loading medicine products:', error);
      this.displayError('Failed to load products. Please try again later.');
    }
  },
  
  // Load vitamin products - disabled since no vitamins table exists
  async loadVitaminProducts() {
    console.log('[Products] Skipping vitamins loading since no table exists');
    // Return empty array since there's no vitamins table
    return [];
    
    // Original implementation commented out for reference
    /*
    try {
      // Try multiple possible endpoints for vitamins
      let response;
      try {
        response = await fetch(`${this.apiBaseUrl}/vitamins`);
      } catch (e) {
        console.log('[Products] /vitamins endpoint failed, trying alternative');
        try {
          response = await fetch(`${this.apiBaseUrl}/products/vitamins`);
        } catch (e) {
          console.log('[Products] /products/vitamins endpoint failed, trying last alternative');
          response = await fetch(`${this.apiBaseUrl}/products?category=vitamins`);
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to load vitamin products');
      }
      
      const data = await response.json();
      this.displayProducts(data, 'vitamin');
    } catch (error) {
      console.error('Error loading vitamin products:', error);
      this.displayError('Failed to load products. Please try again later.');
    }
    */
  },
  
  // Load all products
  async loadAllProducts() {
    try {
      // Try to load each product category, with fallbacks
      let medicinesResponse, skincareResponse, vitaminsResponse;
      
      try {
        medicinesResponse = await fetch(`${this.apiBaseUrl}/medicines`);
      } catch (e) {
        console.log('[Products] Error fetching medicines, using empty array');
        medicinesResponse = { ok: true, json: () => Promise.resolve([]) };
      }
      
      try {
        skincareResponse = await fetch(`${this.apiBaseUrl}/skincare`);
      } catch (e) {
        console.log('[Products] Error fetching skincare, using empty array');
        skincareResponse = { ok: true, json: () => Promise.resolve([]) };
      }
      
      // Skip vitamins fetch since there's no vitamins table
      console.log('[Products] Skipping vitamins loading in loadAllProducts since no table exists');
      vitaminsResponse = { ok: true, json: () => Promise.resolve([]) };
      
      // Parse responses with fallback handling (handles both direct arrays and {success, data} format)
      let medicines = [];
      let skincare = [];
      let vitamins = [];
      
      try {
        const medicinesData = await medicinesResponse.json();
        medicines = medicinesData.success && medicinesData.data ? medicinesData.data : medicinesData;
        if (!Array.isArray(medicines)) medicines = [];
      } catch (err) {
        console.warn('Error parsing medicines data', err);
      }
      
      try {
        const skincareData = await skincareResponse.json();
        skincare = skincareData.success && skincareData.data ? skincareData.data : skincareData;
        if (!Array.isArray(skincare)) skincare = [];
      } catch (err) {
        console.warn('Error parsing skincare data', err);
      }
      
      try {
        const vitaminsData = await vitaminsResponse.json();
        vitamins = vitaminsData.success && vitaminsData.data ? vitaminsData.data : vitaminsData;
        if (!Array.isArray(vitamins)) vitamins = [];
      } catch (err) {
        console.warn('Error parsing vitamins data', err);
      }
      
      const allProducts = [
        ...medicines.map(item => ({ ...item, type: 'medicine' })),
        ...skincare.map(item => ({ ...item, type: 'skincare' })),
        ...vitamins.map(item => ({ ...item, type: 'vitamin' }))
      ];
      
      this.displayProducts(allProducts, 'all');
    } catch (error) {
      console.error('Error loading all products:', error);
      this.displayError('Failed to load products. Please try again later.');
    }
  },
  
  // Display products in the container
  displayProducts(products, type) {
    const container = document.querySelector('.products-container');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Make sure products is an array
    if (!Array.isArray(products)) {
      console.error('Products is not an array:', products);
      container.innerHTML = '<p class="no-products">Error loading products. Invalid data format.</p>';
      return;
    }
    
    if (products.length === 0) {
      container.innerHTML = '<p class="no-products">No products found.</p>';
      return;
    }
    
    // Store products data for filtering
    this.allProducts = products;
    
    // Create and append product cards
    products.forEach(product => {
      const card = this.createProductCard(product, type);
      container.appendChild(card);
    });
  },
  
  // Create a product card element
  createProductCard(product, type) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    card.dataset.category = product.category?.toLowerCase() || '';
    
    // Determine product image
    const productImage = product.image || 'default-product.jpg';
    const imagePath = `/images/${type}/${productImage}`;
    
    // Create the card HTML
    card.innerHTML = `
      <div class="product-image">
        <img src="${imagePath}" alt="${product.name}" onerror="this.src='/images/default-product.jpg'">
      </div>
      <div class="product-details">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-category">${product.category || 'General'}</p>
        <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
        <p class="product-stock">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
        <div class="product-actions">
          <button class="add-to-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${imagePath}">
            Add to Cart
          </button>
          <button class="view-details" data-id="${product.id}">View Details</button>
        </div>
      </div>
    `;
    
    return card;
  },
  
  // Filter products by category
  filterProductsByCategory(category) {
    if (!this.allProducts) return;
    
    if (category === 'all') {
      this.displayProducts(this.allProducts);
      return;
    }
    
    const filteredProducts = this.allProducts.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
    
    this.displayProducts(filteredProducts);
  },
  
  // Filter products by search term
  filterProductsBySearch(searchTerm) {
    if (!this.allProducts || !searchTerm.trim()) {
      this.displayProducts(this.allProducts);
      return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filteredProducts = this.allProducts.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      (product.description && product.description.toLowerCase().includes(term))
    );
    
    this.displayProducts(filteredProducts);
  },
  
  // Display error message
  displayError(message) {
    const container = document.querySelector('.products-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
      </div>
    `;
  }
};

// Initialize the product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  ProductManager.init();
});
