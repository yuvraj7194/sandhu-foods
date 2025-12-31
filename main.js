// Part 1: Initializing your specific EmailJS account
(function() {
    emailjs.init("Sm4cgGfqz-6llr3dV"); 
})();

// =======================================================
// CORE DATA MODEL
// =======================================================
let cartItems = []; 
let cartItemCount = 0;
let cartTotalPrice = 0;
let savedOrdersList = JSON.parse(localStorage.getItem('sandhu_orders')) || [];
// =======================================================
// GLOBAL ELEMENT REFERENCES
// =======================================================
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav-new'); 
const cartIcon = document.querySelector('a[href="#cart"]'); 
const cartDrawer = document.getElementById('cart-drawer');
const closeCartBtn = document.querySelector('.close-cart-btn');
const buyNowBtn = document.querySelector('.buy-now-btn');
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
const heroSection = document.getElementById("new-hero-section");


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

// Modal / Auth
const accountBtn = document.getElementById('accountBtn');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModal');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const logoutBtn = document.getElementById('logoutBtn');

// =======================================================
// HELPER FUNCTIONS
// =======================================================

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0
    }).format(price);
} // <--- I ADDED THIS MISSING BRACKET

function saveOrdersToLocalStorage() {
    localStorage.setItem('sandhu_orders', JSON.stringify(savedOrdersList));
}

function cancelOrder(orderId) {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    const order = savedOrdersList.find(o => o.id === orderId);
    if (!order) return;
    order.orderStatus = "Cancelled";

const orderSummary = order.items
    .map(item => `${item.name} (x${item.quantity})`)
    .join(", ");

    // ---------- A. ADMIN EMAIL (FORMSPREE) ----------
    const formData = new FormData();
    formData.append("Order ID", order.id);
    formData.append("Customer Name", order.customerName);
    formData.append("Customer Email", order.customerEmail);
    formData.append("Total Amount", formatPrice(order.total));
    formData.append("Status", "Order Cancelled");
    formData.append("Cancelled Items", orderSummary);


    fetch("https://formspree.io/f/xnjavwya", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
    });

    // ---------- B. CUSTOMER EMAIL (EMAILJS) ----------
    emailjs.send("service_pzxfpm8", "template_8qoa8mo", {
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        order_id: order.id,
        order_summary: orderSummary,
        total_price: formatPrice(order.total),
        message: "Your order has been successfully cancelled."
    });

    // ---------- C. UPDATE ORDER STATUS  ----------
    saveOrdersToLocalStorage();
    renderOrderHistory();
    showToast("Order cancelled and email sent.");

}

function downloadReceipt(orderId) {
    const order = savedOrdersList.find(o => o.id === orderId);
    if (!order) return;

    const itemsHTML = order.items
        .map(item => `<li>${item.name} (x${item.quantity})</li>`)
        .join("");

    const receiptHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Receipt ${order.id}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f5f5f5;
                    padding: 40px;
                }
                .receipt {
                    max-width: 600px;
                    margin: auto;
                    background: #fff;
                    padding: 30px;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                }
                h1 {
                    text-align: center;
                    color: #B8860B;
                }
                .status {
                    text-align: center;
                    font-weight: bold;
                    color: ${order.orderStatus === "Cancelled" ? "#d9534f" : "#108040"};
                }
                ul {
                    padding-left: 20px;
                }
                hr {
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <h1>SANDHU FOODS</h1>
                <p class="status">${order.orderStatus}</p>

                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Date:</strong> ${order.date}</p>
                <p><strong>Customer:</strong> ${order.customerName}</p>

                <hr>

                <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                <p><strong>Total:</strong> ${formatPrice(order.total)}</p>

                <hr>

                <p><strong>Items:</strong></p>
                <ul>${itemsHTML}</ul>

                <hr>

                <p style="text-align:center; font-size:12px;">
                    Thank you for choosing Sandhu Foods
                </p>
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([receiptHTML], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Receipt_${order.id}.html`;
    link.click();
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

// =======================================================
// MODAL / AUTH FUNCTIONS
// =======================================================

function toggleModal() {
    modalOverlay.style.display = modalOverlay.style.display === 'flex' ? 'none' : 'flex';
}

function switchTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        await window.signInWithEmailAndPassword(window.auth, email, password);
        showToast('Login successful!');
        toggleModal();
    } catch (error) {
        showToast('Login failed: ' + error.message);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    try {
        const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
        await userCredential.user.updateProfile({ displayName: name });
        showToast('Account created successfully!');
        toggleModal();
    } catch (error) {
        showToast('Signup failed: ' + error.message);
    }
}

function handleLogout() {
    window.signOut(window.auth).then(() => {
        showToast('Logged out successfully!');
        toggleModal();
    });
}

function updateAuthUI(user) {
    const profileSection = document.getElementById('profile-section');
    const authSection = document.getElementById('auth-section');
    if (user) {
        document.getElementById('profileGreeting').textContent = `Welcome, ${user.displayName || 'User'}!`;
        document.getElementById('profileName').textContent = user.displayName || 'N/A';
        document.getElementById('profileEmail').textContent = user.email;
        profileSection.style.display = 'block';
        authSection.style.display = 'none';
    } else {
        profileSection.style.display = 'none';
        authSection.style.display = 'block';
    }
}

function updateCartSummary() {
    cartTotalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    if(cartCountDisplay) cartCountDisplay.textContent = `🛒 Cart (${cartItemCount})`;
    if(cartHeaderCount) cartHeaderCount.textContent = `Shopping Cart (${cartItemCount})`;
    if(totalDisplay) totalDisplay.textContent = formatPrice(cartTotalPrice);
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
    if(!shippingInfoDiv) return;

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
    }
}



// --- NEW FUNCTIONS START HERE ---

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-popup';
    toast.innerHTML = `<span>✔️</span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function animateFlyToCart(buttonElement) {
    const cartBtn = document.querySelector('.cart-toggle-btn'); 
    if (!cartBtn) return;
    const btnRect = buttonElement.getBoundingClientRect();
    const cartRect = cartBtn.getBoundingClientRect();
    const flyer = document.createElement('div');
    flyer.className = 'flying-item';
    flyer.style.background = '#B8860B'; 
    flyer.style.top = `${btnRect.top}px`;
    flyer.style.left = `${btnRect.left}px`;
    document.body.appendChild(flyer);
    setTimeout(() => {
        flyer.style.top = `${cartRect.top}px`;
        flyer.style.left = `${cartRect.left}px`;
        flyer.style.width = '10px';
        flyer.style.height = '10px';
        flyer.style.opacity = '0';
    }, 50);
    setTimeout(() => flyer.remove(), 800);
}

// =======================================================
// VIEW MANAGEMENT
// =======================================================

function toggleView(view) {
    // Hide everything first
    mainPageSections.forEach(el => el.style.display = 'none');
    allViews.forEach(el => el.style.display = 'none');

    // Hide hero by default
    const heroSection = document.getElementById("new-hero-section");
    if (heroSection) heroSection.style.display = "none";

    window.scrollTo(0, 0);

    if (view === 'main') {
        // Home page → show hero + main content
        if (heroSection) heroSection.style.display = "block";
        mainPageSections.forEach(el => el.style.display = '');
    }

    if (view === 'checkout') {
        checkoutPage.style.display = 'block';
        mirrorCartToCheckout();
    }

    if (view === 'confirmation') {
        confirmationPage.style.display = 'flex';
    }

    if (view === 'orders') {
        ordersHistoryPage.style.display = 'block';
        renderOrderHistory();
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
// THE DOUBLE SUBMIT: FORMSPREE + EMAILJS
// =======================================================

async function handleOrderSubmit(event) {
    event.preventDefault();
    const statusBtn = document.querySelector('.place-order-btn');
    const formData = new FormData(event.target);
    const paymentMethod = formData.get("Payment Method");
const paymentStatus = paymentMethod === "Online" ? "Paid" : "Not Paid (COD)";

    // 1. DATA GATHERING (Using safer selectors)
    // IMPORTANT: Make sure your HTML inputs have these IDs!
    const customerName = document.getElementById('full-name') ? document.getElementById('full-name').value : "Customer";
    const customerEmail = document.getElementById('email') ? document.getElementById('email').value : "No Email";
    const street = document.getElementById('address') ? document.getElementById('address').value : "No Address";
    const city = document.getElementById('city') ? document.getElementById('city').value : "";
    const pincode = document.getElementById('zip') ? document.getElementById('zip').value : "N/A";
    const phone = document.getElementById('phone') ? document.getElementById('phone').value : "N/A";
    
    const orderId = 'SF-' + Math.floor(Math.random() * 90000000);
    const summaryString = cartItems.map(item => `${item.name} (x${item.quantity})`).join(", ");
    const finalTotalText = summaryTotal.textContent;

    const templateParams = {
        customer_name: customerName,
        customer_email: customerEmail, 
        customer_phone: phone,
        order_id: orderId,
        order_summary: summaryString,
        total_price: finalTotalText,
        shipping_address: street,
        shipping_city: city,
        shipping_pincode: pincode
    };

    formData.append("Order_ID", orderId);
    formData.append("Cart_Items", summaryString);
    formData.append("Total", finalTotalText);

    statusBtn.disabled = true;
    statusBtn.textContent = "Processing...";

    try {
        // --- A. Notify Owner (Formspree) ---
        // Change YOUR_FORMSPREE_ID to your actual ID
        await fetch('https://formspree.io/f/xnjavwya', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        // --- B. Notify Customer (EmailJS) ---
        await emailjs.send('service_pzxfpm8', 'template_ssemdv5', templateParams);

        // --- C. UI Updates ---
        lastOrderItems = JSON.parse(JSON.stringify(cartItems));
        lastOrderTotal = cartTotalPrice;
        const newOrder = {
    id: orderId,
    date: new Date().toLocaleString(),
    items: lastOrderItems,
    total: lastOrderTotal,
    customerEmail: customerEmail,
    customerName: customerName,
    paymentMethod: paymentMethod,
    paymentStatus: paymentStatus,
    orderStatus: "Placed"
};

        savedOrdersList.push(newOrder); 
        saveOrdersToLocalStorage();

        renderConfirmationSummary();
        toggleView('confirmation');
        cartItems = [];
        renderCartItems();
        shippingForm.reset();

    } catch (error) {
        console.error("Error:", error);
        alert("There was a problem placing your order. Check console for details.");
    } finally {
        statusBtn.disabled = false;
        statusBtn.textContent = "Place Order";
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

    if (savedOrdersList.length === 0) {
        orderHistoryList.innerHTML = `
            <div class="order-placeholder">
                <p>No orders yet!</p>
            </div>
        `;
        return;
    }

    // 1. Render orders
    savedOrdersList.forEach(order => {
        orderHistoryList.insertAdjacentHTML('beforeend', `
            <div style="
                background:#fff;
                border:1px solid #e5e5e5;
                border-radius:8px;
                padding:25px;
                margin-bottom:25px;
                max-width:700px;
            ">

                <h4 style="margin-top:0;">
                    Order ID: ${order.id}
                </h4>

                <p style="
                    font-weight:600;
                    color:${order.orderStatus === "Cancelled" ? "#d9534f" : "#108040"};
                    margin-top:5px;
                ">
                    ${order.orderStatus}
                </p>

                <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                <p><strong>Total:</strong> ${formatPrice(order.total)}</p>

                <hr style="margin:15px 0;">

                <p style="font-weight:600;">Items:</p>
                <ul style="padding-left:18px;">
                    ${order.items.map(item =>
                        `<li>${item.name} (x${item.quantity})</li>`
                    ).join("")}
                </ul>

                <div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">

                    <button class="download-receipt-btn" data-id="${order.id}"
                        style="
                            background:#eee;
                            border:1px solid #ccc;
                            padding:6px 12px;
                            border-radius:4px;
                            cursor:pointer;
                        ">
                        Download Receipt
                    </button>

                    ${order.orderStatus === "Cancelled" ? "" : `
                        <button class="cancel-order-btn" data-id="${order.id}"
                            style="
                                background:none;
                                border:1px solid #d9534f;
                                color:#d9534f;
                                padding:6px 12px;
                                border-radius:4px;
                                cursor:pointer;
                            ">
                            Cancel Order
                        </button>
                    `}
                </div>

            </div>
        `);
    });

    // 2. Attach button listeners AFTER render
    document.querySelectorAll('.download-receipt-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            downloadReceipt(e.target.dataset.id);
        });
    });

    document.querySelectorAll('.cancel-order-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            cancelOrder(e.target.dataset.id);
        });
    });
}

// =======================================================
// INITIALIZATION
// =======================================================

const storedOrders = localStorage.getItem('sandhu_orders');
if (storedOrders) {
    savedOrdersList = JSON.parse(storedOrders);
}
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

if (buyNowBtn) buyNowBtn.addEventListener('click', (e) => { e.preventDefault(); toggleView('checkout'); });
if (backToCartLink) backToCartLink.addEventListener('click', (e) => { e.preventDefault(); toggleView('main'); toggleCart(); });
if (returnToShopBtn) returnToShopBtn.addEventListener('click', () => toggleView('main'));
if (yourOrdersLink) yourOrdersLink.addEventListener('click', (e) => { e.preventDefault(); toggleView('orders'); });
if (backToShopOrdersBtn) backToShopOrdersBtn.addEventListener('click', () => toggleView('main'));

if (shippingForm) shippingForm.addEventListener('submit', handleOrderSubmit);

// Modal / Auth Event Listeners
if (accountBtn) accountBtn.addEventListener('click', toggleModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', toggleModal);
if (loginTab) loginTab.addEventListener('click', () => switchTab('login'));
if (signupTab) signupTab.addEventListener('click', () => switchTab('signup'));
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (signupForm) signupForm.addEventListener('submit', handleSignup);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

// Firebase Auth State Listener
window.onAuthStateChanged(window.auth, (user) => {
    updateAuthUI(user);
});

// --- Newsletter Functionality ---
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailValue = document.getElementById('newsletter-email').value;
        // This uses the showToast function already in your main.js
        showToast(`Success! ${emailValue} is now subscribed.`);
        newsletterForm.reset();
    });
}