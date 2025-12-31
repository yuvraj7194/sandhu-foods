// track.js — Track Your Order logic

document.addEventListener("DOMContentLoaded", () => {
    const trackBtn = document.getElementById("track-order-btn");
    if (!trackBtn) return;

    trackBtn.addEventListener("click", trackOrder);
});

function trackOrder() {
    const orderIdInput = document.getElementById("track-order-id");
    const resultBox = document.getElementById("track-result");

    const orderId = orderIdInput.value.trim();
    if (!orderId) {
        resultBox.style.display = "block";
        resultBox.innerHTML = "<p>Please enter a valid Order ID.</p>";
        return;
    }

    const orders = JSON.parse(localStorage.getItem("sandhu_orders")) || [];
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        resultBox.style.display = "block";
        resultBox.innerHTML = `
            <p><strong>Order not found.</strong></p>
            <p>This order may have been cancelled or the ID is incorrect.</p>
        `;
        return;
    }

    const itemsHTML = order.items
        .map(item => `<li>${item.name} (x${item.quantity})</li>`)
        .join("");

    resultBox.style.display = "block";
    resultBox.innerHTML = `
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
        <p><strong>Total Amount:</strong> ₹${order.total}</p>

        <p>
  <strong>Order Status:</strong>
  <span style="color: ${order.orderStatus === "Cancelled" ? "#d9534f" : "#108040"};">
    ${order.orderStatus}
  </span>
</p>


        <h4>Items</h4>
        <ul>
            ${itemsHTML}
        </ul>
    `;
}
