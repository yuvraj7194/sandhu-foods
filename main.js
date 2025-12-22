// =======================================================
// CORE DATA MODEL
// =======================================================
let cartItems = []; 
let cartItemCount = 0;
let cartTotalPrice = 0;
let savedOrder = null; 

// =======================================================
// GLOBAL ELEMENT REFERENCES
// =======================================================
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav-new'); 
const cartIcon = document.querySelector('a[href="#cart"]'); 
const cartDrawer = document.getElementById('cart-drawer');
const closeCartBtn = document.querySelector('.close-cart-btn');
const buyNowBtn = document.querySelector('.buy-now-btn');
const continueShoppingBtnCart = document.querySelector('#cart-drawer .continue-shopping-btn');

const cartCountDisplay = document.querySelector('.utility-links a[href="#cart"]');
const cartHeaderCount = document.querySelector('.cart-header h3');
const cartListContainer = document.getElementById('cart-items-list');
const totalDisplay = document.getElementById('total-price');

// Page View Management
const mainPageSections = document.querySelectorAll('header, main, footer');
const checkoutPage = document.getElementById('checkout-page');
const confirmationPage = document.getElementById('confirmation-page');
const ordersHistoryPage = document.getElementById('orders-history-page');
const allViews = [checkoutPage, confirmationPage, ordersHistoryPage];

// Checkout / Form
const shippingForm = document.getElementById('shipping-form');
const checkoutItemList = document.getElementById('checkout-item-list');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryShipping = document.getElementById('summary-shipping');
const summaryTotal = document.getElementById('summary-total');
const placeOrderBtn = document.querySelector('.place-order-btn');
const backToCartLink = document.getElementById('back-to-cart');

// Confirmation
const returnToShopBtn = document.getElementById('return-to-shop-btn');
const confItemList = document.getElementById('confirmation-item-list');
const confSubtotal = document.getElementById('conf-subtotal');
const confShipping = document.getElementById('conf-shipping');
const confTotal = document.getElementById('conf-total');
let lastOrderItems = [];
let lastOrderTotal = 0;

// Orders History
const yourOrdersLink = document.querySelector('a[href="#orders"]');
const orderHistoryList = document.getElementById('order-history-list');
const backToShopOrdersBtn = document.getElementById('back-to-shop-orders');

// =======================================================
// HELPER FUNCTIONS
// =======================================================

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2
    }).format(price);
}

function generateCartItemHTML(item) {
    return `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.imageSrc}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <p class="cart-item-title">${item.name}</p>
                <p class="cart-item-price">${formatPrice(item.price)}</p>
                <div class="cart-item-quantity">
                    Qty: 
                    <button class="quantity-btn minus-btn">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn plus-btn">+</button>
                </div>
            </div>
        </div>
    `;
}

function updateCartSummary() {
    cartTotalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    cartCountDisplay.textContent = `🛒 Cart (${cartItemCount})`;
    cartHeaderCount.textContent = `Shopping Cart (${cartItemCount})`;
    totalDisplay.textContent = formatPrice(cartTotalPrice);
}

function renderCartItems() {
    cartListContainer.innerHTML = ''; 
    if (cartItems.length === 0) {
        cartListContainer.insertAdjacentHTML('beforeend', `<div class="empty-cart-message">Your cart is currently empty.</div>`);
    } else {
        cartItems.forEach(item => {
            cartListContainer.insertAdjacentHTML('beforeend', generateCartItemHTML(item));
        });
    }
    updateCartSummary();

    const shippingInfoDiv = document.querySelector('.shipping-info');
    const freeShippingThreshold = 500;
    if (cartTotalPrice >= freeShippingThreshold) {
        shippingInfoDiv.innerHTML = '🎉 **Your order qualifies for FREE Shipping!**';
        shippingInfoDiv.style.backgroundColor = '#E6F7E6';
        shippingInfoDiv.style.color = '#108040';
    } else if (cartTotalPrice > 0) {
        const remainingAmount = freeShippingThreshold - cartTotalPrice;
        shippingInfoDiv.innerHTML = `Spend **${formatPrice(remainingAmount)}** more for **FREE Shipping!**`;
        shippingInfoDiv.style.backgroundColor = '#FFFBE6';
        shippingInfoDiv.style.color = '#B8860B';
    } else {
        shippingInfoDiv.innerHTML = 'Free shipping on orders over ₹499.';
        shippingInfoDiv.style.backgroundColor = '#F0F0F0';
        shippingInfoDiv.style.color = '#333';
    }
}

// =======================================================
// VIEW MANAGEMENT
// =======================================================

function toggleView(view) {
    mainPageSections.forEach(el => el.style.display = 'none');
    allViews.forEach(el => el.style.display = 'none');
    window.scrollTo(0, 0); 
    
    if (view === 'checkout') {
        checkoutPage.style.display = 'block';
        mirrorCartToCheckout();
    } else if (view === 'confirmation') {
        confirmationPage.style.display = 'flex'; 
    } else if (view === 'orders') { 
        ordersHistoryPage.style.display = 'block';
        renderOrderHistory(); 
    } else if (view === 'main') {
        mainPageSections.forEach(el => el.style.display = '');
    }
}

function toggleCart() {
    cartDrawer.classList.toggle('open');
}

// =======================================================
// CART & CHECKOUT LOGIC
// =======================================================

function addItemToCart(productData) {
    const existingItem = cartItems.find(item => item.name === productData.name);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        productData.id = Date.now(); 
        productData.quantity = 1;
        cartItems.push(productData);
    }
    renderCartItems();
}

function animateToCart(button) {
    const productCard = button.closest('.product-card');
    const productImage = productCard.querySelector('.product-image');
    const productData = {
        name: productCard.querySelector('.product-title').textContent,
        price: parseFloat(productCard.querySelector('.card-price').textContent.replace(/[₹,]/g, '').trim()),
        imageSrc: productImage.src
    };
    
    const flyingImg = productImage.cloneNode();
    flyingImg.classList.add('flying-image');
    const startRect = productImage.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    Object.assign(flyingImg.style, {
        position: 'fixed', top: `${startRect.top}px`, left: `${startRect.left}px`,
        width: `${startRect.width}px`, height: `${startRect.height}px`, zIndex: 2000
    });

    document.body.appendChild(flyingImg);
    setTimeout(() => {
        flyingImg.style.transition = 'all 0.8s ease-in-out';
        flyingImg.style.transform = `translate(${endRect.left - startRect.left}px, ${endRect.top - startRect.top}px) scale(0.1)`;
        flyingImg.style.opacity = 0; 
    }, 50);
    setTimeout(() => { flyingImg.remove(); addItemToCart(productData); }, 850); 
}

function handleQuantityChange(itemId, action) {
    const item = cartItems.find(i => i.id === itemId);
    if (item) {
        action === 'plus' ? item.quantity++ : item.quantity--;
        if (item.quantity <= 0) cartItems = cartItems.filter(i => i.id !== itemId);
        renderCartItems();
    }
}

function mirrorCartToCheckout() {
    checkoutItemList.innerHTML = '';
    if (cartItems.length === 0) {
        checkoutItemList.innerHTML = `<div class="summary-placeholder">Your cart is empty.</div>`;
        return;
    }
    cartItems.forEach(item => {
        checkoutItemList.insertAdjacentHTML('beforeend', `
            <div class="summary-item" style="display: flex; margin-bottom: 10px; font-size: 0.9em; align-items: center;">
                <img src="${item.imageSrc}" style="width: 40px; height: 40px; object-fit: cover; margin-right: 10px; border-radius: 4px;">
                <div style="flex-grow: 1;">
                    <p style="margin: 0; font-weight: 600;">${item.name}</p>
                    <span style="color: #666;">Qty: ${item.quantity}</span>
                </div>
                <span style="font-weight: 700;">${formatPrice(item.price * item.quantity)}</span>
            </div>
        `);
    });

    const shippingCost = cartTotalPrice > 500 ? 0 : 50; 
    const finalTotal = cartTotalPrice + shippingCost;
    summarySubtotal.textContent = formatPrice(cartTotalPrice);
    summaryShipping.textContent = shippingCost === 0 ? 'FREE' : formatPrice(shippingCost);
    summaryTotal.textContent = formatPrice(finalTotal);
    placeOrderBtn.textContent = `Place Order - ${formatPrice(finalTotal)}`;
}

// =======================================================
// FORMSPREE & ORDER COMPLETION
// =======================================================

async function handleFormspreeSubmit(event) {
    event.preventDefault();
    const status = document.querySelector('.place-order-btn');
    const formData = new FormData(event.target);

    // 1. Prepare Cart Data for Email
    const orderDetails = cartItems.map(item => `${item.name} (x${item.quantity})`).join(', ');
    formData.append("Order Details", orderDetails);
    formData.append("Total Amount", summaryTotal.textContent);

    status.disabled = true;
    status.textContent = "Processing...";

    try {
        const response = await fetch(event.target.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            // 2. Success Logic
            lastOrderItems = JSON.parse(JSON.stringify(cartItems));
            lastOrderTotal = cartTotalPrice;
            
            savedOrder = {
                id: 'SF-' + Math.floor(Math.random() * 90000000) + 10000000, 
                date: new Date().toISOString(),
                items: lastOrderItems,
                total: lastOrderTotal,
                status: 'Shipped'
            };

            renderConfirmationSummary();
            toggleView('confirmation');

            // 3. Reset Cart
            cartItems = [];
            renderCartItems(); 
            shippingForm.reset();
        } else {
            alert("Oops! There was a problem submitting your order.");
        }
    } catch (error) {
        alert("Error connecting to server. Please try again.");
    } finally {
        status.disabled = false;
        status.textContent = "Place Order";
    }
}

function renderConfirmationSummary() {
    confItemList.innerHTML = '';
    lastOrderItems.forEach(item => {
        confItemList.insertAdjacentHTML('beforeend', `
            <div class="summary-item" style="display: flex; margin-bottom: 8px; font-size: 0.9em; align-items: center;">
                <div style="flex-grow: 1;"><span style="font-weight: 500;">${item.name} (x${item.quantity})</span></div>
                <span style="font-weight: 700;">${formatPrice(item.price * item.quantity)}</span>
            </div>
        `);
    });
    const ship = lastOrderTotal > 500 ? 0 : 50;
    confSubtotal.textContent = formatPrice(lastOrderTotal);
    confShipping.textContent = ship === 0 ? 'FREE' : formatPrice(ship);
    confTotal.textContent = formatPrice(lastOrderTotal + ship);
}

function renderOrderHistory() {
    orderHistoryList.innerHTML = ''; 
    if (!savedOrder) {
        orderHistoryList.innerHTML = `<div class="order-placeholder"><p>No orders yet!</p></div>`;
        return;
    }
    // (Simplified history display logic)
    orderHistoryList.innerHTML = `<div class="single-order-card"><strong>ID: ${savedOrder.id}</strong><br>Total: ${formatPrice(savedOrder.total)}</div>`;
}

// =======================================================
// INITIALIZATION
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    renderCartItems();

    if (menuToggle) menuToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
    
    document.querySelectorAll('.add-to-cart-btn-new').forEach(btn => {
        btn.addEventListener('click', function() { animateToCart(this); });
    });

    if (cartIcon) cartIcon.addEventListener('click', (e) => { e.preventDefault(); toggleCart(); });
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    
    cartListContainer.addEventListener('click', (e) => {
        const action = e.target.classList.contains('plus-btn') ? 'plus' : e.target.classList.contains('minus-btn') ? 'minus' : null;
        if (action) handleQuantityChange(parseInt(e.target.closest('.cart-item').dataset.id), action);
    });

    buyNowBtn.addEventListener('click', (e) => { e.preventDefault(); toggleView('checkout'); });
    backToCartLink.addEventListener('click', (e) => { e.preventDefault(); toggleView('main'); toggleCart(); });
    returnToShopBtn.addEventListener('click', () => toggleView('main'));
    yourOrdersLink.addEventListener('click', () => toggleView('orders'));
    backToShopOrdersBtn.addEventListener('click', () => toggleView('main'));

    // ATTACH THE NEW FORMSPREE HANDLER
    if (shippingForm) shippingForm.addEventListener('submit', handleFormspreeSubmit);
});