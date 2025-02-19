// Utility Functions
function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.add("hidden");
}

function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.remove("hidden");
}

function resetAuthForms() {
    document.getElementById("loginForm").reset();
    document.getElementById("signupForm").reset();
}

// Authentication Event Listeners
document.getElementById("loginButton").addEventListener("click", () => {
    hideElement("authContainer");
    showElement("loginForm");
});

document.getElementById("signupButton").addEventListener("click", () => {
    hideElement("authContainer");
    showElement("signupForm");
});

document.getElementById("signupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    })
        .then((res) => res.json())
        .then((data) => {
            alert(data.message || data.error);
            if (!data.error) {
                resetAuthForms();
                hideElement("signupForm");
                hideElement("loginForm");
                showMainApp();
            }
        })
        .catch((err) => console.error(err));
});

document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.token) {
                sessionStorage.setItem("authToken", data.token);
                resetAuthForms();
                hideElement("signupForm");
                hideElement("loginForm");
                showMainApp();
            } else {
                alert(data.error);
            }
        })
        .catch((err) => console.error(err));
});

document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem("authToken");
    hideElement("mainApp");
    hideElement("shipmentForm");
    showElement("authContainer");

});

// Show Main Application
function showMainApp() {
    hideElement("authContainer");
    showElement("mainApp");
}

// Cost Calculation
document.getElementById("calculateCostButton").addEventListener("click", () => {
    const weight = parseFloat(document.getElementById("weight").value) || 0;
    const shippingRange = document.querySelector('input[name="shippingRange"]:checked');
    const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked');

    if (!shippingRange || !shippingMethod) {
        alert("Please select both a shipping range and a shipping method.");
        return;
    }

    let costPerKg;
    switch (shippingRange.value) {
        case "local":
            costPerKg = 5;
            break;
        case "regional":
            costPerKg = 10;
            break;
        case "national":
            costPerKg = 20;
            break;
        case "international":
            costPerKg = 50;
            break;
        default:
            costPerKg = 0;
    }

    let methodMultiplier;
    switch (shippingMethod.value) {
        case "airFreight":
            methodMultiplier = 2;
            break;
        case "seaFreight":
            methodMultiplier = 1.5;
            break;
        case "landFreight":
            methodMultiplier = 1;
            break;
        case "railFreight":
            methodMultiplier = 1.2;
            break;
        default:
            methodMultiplier = 1;
    }

    const totalCost = weight * costPerKg * methodMultiplier;
    document.getElementById("totalCost").innerText = totalCost.toFixed(2);
});

// Enable Add Shipment Button when Terms are Agreed
document.getElementById("agreeTerms").addEventListener("change", (event) => {
    document.getElementById("addShipmentButton").disabled = !event.target.checked;
});

// Add Shipment
document.getElementById("addShipmentButton").addEventListener("click", () => {
    const senderName = document.getElementById("senderName").value;
    const senderEmail = document.getElementById("senderEmail").value;
    const senderPhone = document.getElementById("senderPhoneNumber").value;
    const senderAddress = document.getElementById("senderAddress").value;
    const receiverName = document.getElementById("receiverName").value;
    const receiverEmail = document.getElementById("receiverEmail").value;
    const receiverPhone = document.getElementById("receiverPhoneNumber").value;
    const receiverAddress = document.getElementById("receiverAddress").value;
    const pickupLocation = document.getElementById("pickupLocation").value;
    const dropoffLocation = document.getElementById("dropoffLocation").value;
    const packageType = document.querySelector('input[name="packageType"]:checked')?.value;
    const weight = document.getElementById("weight").value;
    const pickupDate = document.getElementById("pickupDate").value;
    const dropoffDate = document.getElementById("dropoffDate").value;
    const totalCost = document.getElementById("totalCost").innerText;

    if (!packageType) {
        alert("Please select a package type.");
        return;
    }

    const shipment = {
        senderName, senderEmail, senderPhone, senderAddress,
        receiverName, receiverEmail, receiverPhone, receiverAddress,
        pickupLocation, dropoffLocation, packageType, weight,
        pickupDate, dropoffDate, totalCost
    };

    const shipmentsList = document.getElementById("shipments");
    const shipmentItem = document.createElement("li");
    shipmentItem.textContent = `Shipment from ${senderName} to ${receiverName} - ${totalCost} USD`;
    shipmentsList.appendChild(shipmentItem);

    alert("Shipment added successfully!");
    document.getElementById("shipmentForm").reset(); // Reset the form
});

// Auto-populate shipment list from session storage (if implemented)
document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("authToken")) {
        showMainApp();
    }
});