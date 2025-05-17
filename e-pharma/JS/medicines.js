document.addEventListener("DOMContentLoaded", async () => {
    const medicineGrid = document.getElementById("medicine-grid");
    const loading = document.getElementById("loading");
    const noResults = document.getElementById("no-results");
    const searchInput = document.getElementById("medicine-search");
    const categoryFilter = document.getElementById("category-filter");
    const sortBy = document.getElementById("sort-by");
    const inStockOnly = document.getElementById("in-stock-only");
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');

    let fetchedMedicines = [];
    let currentPage = 1;
    let totalPages = 1;
    const itemsPerPage = 10; // removed local cart

    function updatePaginationControls() {
        currentPageSpan.textContent = `Page ${currentPage}`;
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage >= totalPages;
    }

    prevButton.addEventListener('click', async () => {
        if (currentPage > 1) {
            currentPage--;
            await loadMedicines(currentPage);
        }
    });

    nextButton.addEventListener('click', async () => {
        if (currentPage < totalPages) {
            await loadMoreMedicines();
        }
    });

    async function fetchMedicines(page = 1) {
        try {
            const response = await fetch(`http://localhost:5000/api/medicines?page=${page}&limit=${itemsPerPage}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const responseData = await response.json();
            
            if (responseData.success && responseData.data && Array.isArray(responseData.data.medicines)) {
                totalPages = responseData.data.pages;
                return {
                    newMedicines: responseData.data.medicines,
                    allMedicines: [...fetchedMedicines, ...responseData.data.medicines]
                };
            }
            throw new Error(`Unexpected API format: ${JSON.stringify(responseData)}`);
        } catch (error) {
            console.error('Error fetching medicines:', error);
            noResults.innerHTML = `<p>Error loading medicines. Please try again later.</p>`;
            noResults.style.display = 'block';
            return { newMedicines: [], allMedicines: fetchedMedicines };
        }
    }

    async function loadMedicines(page) {
        loading.style.display = "flex";
        const { allMedicines } = await fetchMedicines(page);
        fetchedMedicines = allMedicines;
        displayMedicines(fetchedMedicines);
        updatePaginationControls();
        loading.style.display = "none";
    }

    async function loadMoreMedicines() {
        loading.style.display = "flex";
        const { newMedicines, allMedicines } = await fetchMedicines(currentPage + 1);
        if (newMedicines.length > 0) {
            currentPage++;
            fetchedMedicines = allMedicines;
            displayMedicines(fetchedMedicines);
            updatePaginationControls();
        }
        loading.style.display = "none";
    }

    function displayMedicines(medicinesList) {
        if (!Array.isArray(medicinesList)) {
            console.error('displayMedicines requires an array, received:', medicinesList);
            medicinesList = [];
        }
        
        if (medicinesList.length === 0) {
            noResults.style.display = "block";
            medicineGrid.innerHTML = "";
            return;
        }

        noResults.style.display = "none";
        medicineGrid.innerHTML = "";

        medicinesList.forEach((medicine) => {
            const medicineCard = document.createElement("div");
            medicineCard.className = "medicine-card";
            
            const price = medicine.price ? parseFloat(medicine.price).toFixed(2) : '0.00';
            const category = medicine.category || 'Uncategorized';
            const description = medicine.description || 'Description not available';
            
            // Improved stock status calculation
            const hasStockProperty = medicine.hasOwnProperty('stock');
            const inStock = hasStockProperty ? medicine.stock > 0 : (medicine.inStock !== false);
            const stockText = hasStockProperty ? 
                (medicine.stock > 0 ? `In Stock (${medicine.stock})` : 'Out of Stock') : 
                (medicine.inStock ? 'In Stock' : 'Out of Stock');

            medicineCard.innerHTML = `
                <div class="medicine-content">
                    <div class="medicine-header">
                        <h3 class="medicine-title">${medicine.name || 'Unnamed Medicine'}</h3>
                        <span class="medicine-price">${price} JOD</span>
                    </div>
                    <div class="medicine-meta">
                        <span class="medicine-category">${category}</span>
                        <span class="medicine-manufacturer">${medicine.manufacturer || 'Unknown Manufacturer'}</span>
                    </div>
                    ${description ? `<p class="medicine-description">${description}</p>` : ''}
                    <div class="medicine-footer">
                        <div class="stock-status ${inStock ? "in-stock" : "out-of-stock"}">
                            <i class="fas fa-${inStock ? "check-circle" : "times-circle"}"></i>
                            <span>${stockText}</span>
                        </div>
                        <button class="btn btn-primary add-to-cart" 
                                data-id="${medicine.id}" 
                                data-name="${medicine.name}" 
                                data-price="${medicine.price}" 
                                data-image="${medicine.image || ''}" 
                                ${!inStock ? "disabled" : ""}>
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;

            medicineGrid.appendChild(medicineCard);
        });


    }

    function filterAndSortMedicines() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const sortOption = sortBy.value;
        const stockFilter = inStockOnly.checked;

        const filteredMedicines = fetchedMedicines.filter((medicine) => {
            const matchesSearch =
                medicine.name.toLowerCase().includes(searchTerm) ||
                medicine.description.toLowerCase().includes(searchTerm) ||
                medicine.category.toLowerCase().includes(searchTerm);

            const matchesCategory = category === "" || medicine.category === category;

            if (stockFilter) {
                if (medicine.hasOwnProperty('stock')) {
                    return medicine.stock > 0;
                }
                return medicine.inStock !== false;
            }
            return matchesSearch && matchesCategory;
        });

        displayMedicines(filteredMedicines);
    }

    function addToCart(medicineId) {
        const medicine = fetchedMedicines.find((m) => m.id === medicineId);
        if (!medicine) return;
        if (typeof ShoppingCart !== 'undefined' && ShoppingCart.addItem) {
            ShoppingCart.addItem({
                id: medicine.id,
                name: medicine.name,
                price: parseFloat(medicine.price),
                image: medicine.image || '',
                quantity: 1
            });
        }
        updateCartUIFromShoppingCart();
    }

    function updateCartUIFromShoppingCart() {
        const cartItems = document.getElementById("cart-items");
        const cartCount = document.getElementById("cart-count");
        const cartTotalAmount = document.getElementById("cart-total-amount");

        if (!ShoppingCart || !ShoppingCart.items) return;
        const items = ShoppingCart.items;
        const totalItems = ShoppingCart.getTotalItems();
        const totalPrice = ShoppingCart.getTotalPrice();
        cartCount.textContent = totalItems;
        cartItems.innerHTML = "";

        if (items.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            cartTotalAmount.textContent = "$0.00";
            return;
        }

        items.forEach((item) => {
            const cartItem = document.createElement("div");
            cartItem.className = "cart-item";
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">$${parseFloat(item.price).toFixed(2)} x ${item.quantity}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease-quantity" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase-quantity" data-id="${item.id}">+</button>
                    <button class="delete-btn" title="Remove from cart" data-id="${item.id}">
                        <span aria-hidden="true">🗑️</span>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        // Attach delete event listeners
        cartItems.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const itemId = btn.getAttribute('data-id');
                if (typeof ShoppingCart !== 'undefined' && ShoppingCart.removeItem) {
                    ShoppingCart.removeItem(itemId);
                }
                updateCartUIFromShoppingCart();
            });
        });
        cartTotalAmount.textContent = `$${totalPrice.toFixed(2)}`;
    }

    function updateQuantity(itemId, change) {
        if (typeof ShoppingCart !== 'undefined' && ShoppingCart.updateQuantity) {
            const item = ShoppingCart.items.find(item => item.id == itemId);
            if (!item) return;
            const newQuantity = item.quantity + change;
            ShoppingCart.updateQuantity(itemId, newQuantity);
        }
        updateCartUIFromShoppingCart();
    }

    searchInput.addEventListener("input", filterAndSortMedicines);
    categoryFilter.addEventListener("change", filterAndSortMedicines);
    sortBy.addEventListener("change", filterAndSortMedicines);
    inStockOnly.addEventListener("change", filterAndSortMedicines);

    // Listen for cart updates from ShoppingCart and update UI
    document.addEventListener('cart:updated', updateCartUIFromShoppingCart);
    updateCartUIFromShoppingCart();
    await loadMedicines(currentPage);

    // Defensive: Attach add-to-cart event handler using dataset attributes and validation
    // REMOVED: Duplicate add-to-cart handler to prevent double add
    // document.addEventListener('click', function(e) {
    //     if (e.target.classList.contains('add-to-cart')) {
    //         e.preventDefault();
    //         const btn = e.target;
    //         let id = btn.dataset.id;
    //         const name = btn.dataset.name;
    //         const price = parseFloat(btn.dataset.price);
    //         const image = btn.dataset.image;
    //         // Defensive: Ensure id is a string and not NaN
    //         if (!id || typeof id !== 'string' || id.trim() === '' || !name || isNaN(price)) {
    //             alert("Invalid product data. Please try again.");
    //             console.error('Add to Cart Validation Failed:', { id, name, price, image });
    //             return;
    //         }
    //         // Optionally, trim id
    //         id = id.trim();
    //         console.log('Add to Cart Click:', { id, name, price, image }); // DEBUG LOG
    //         if (typeof ShoppingCart !== 'undefined' && ShoppingCart.addItem) {
    //             ShoppingCart.addItem({ id, name, price, image, quantity: 1 });
    //         }
    //     }
    // });
});


