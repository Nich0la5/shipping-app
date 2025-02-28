
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
        // fetch("/api/login", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ email, password })
        // })
        // .then(response => response.json())
        // .then(data => {
        //     if (data.token) {
        //         sessionStorage.setItem("authToken", data.token); // Store token
        //         alert("Login successful!");
        //         window.location.href = "admin.html"; // Redirect to dashboard
        //     } else {
        //         alert("Login failed: " + data.error);
        //     }
        // })
        // .catch(error => console.error("Login error:", error));
        
});
document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem("authToken"); // Remove auth token from sessionStorage
    localStorage.clear(); // Clear all stored data in localStorage
    // Check if the form exists before resetting
    const shipmentForm = document.getElementById("shipmentForm");
    if (shipmentForm) {
        shipmentForm.reset(); // Reset the form if it exists
    }
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
document.getElementById("addShipmentButton").addEventListener("click", async () => {
    const token = sessionStorage.getItem("authToken"); 
    if (!token) {
        alert("User not authenticated. Please log in first.");
        return;
    }
    // Retrieve form values
    const senderName = document.getElementById("senderName").value.trim();
    const senderEmail = document.getElementById("senderEmail").value.trim();
    const senderPhoneNumber = document.getElementById("senderPhoneNumber").value.trim();
    const senderAddress = document.getElementById("senderAddress").value.trim();
    const receiverName = document.getElementById("receiverName").value.trim();
    const receiverEmail = document.getElementById("receiverEmail").value.trim();
    const receiverPhoneNumber = document.getElementById("receiverPhoneNumber").value.trim();
    const receiverAddress = document.getElementById("receiverAddress").value.trim();
    const pickupLocation = document.getElementById("pickupLocation").value.trim();
    const dropoffLocation = document.getElementById("dropoffLocation").value.trim();
    const shippingRange = document.querySelector('input[name="shippingRange"]:checked')?.value;
    const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked')?.value;
    const packageType = document.querySelector('input[name="packageType"]:checked')?.value;
    const packageLength = document.getElementById("packageLength").value.trim();
    const packageWidth = document.getElementById("packageWidth").value.trim();
    const packageHeight = document.getElementById("packageHeight").value.trim();
    const packageDescription = document.getElementById("packageDescription").value.trim();
    const weight = document.getElementById("weight").value.trim();
    const pickupDate = document.getElementById("pickupDate").value;
    const dropoffDate = document.getElementById("dropoffDate").value;
    const totalCost = document.getElementById("totalCost").innerText.trim();
    // Validate missing fields
    const missingFields = [];
    if (!senderName) missingFields.push("Sender Name");
    if (!senderEmail) missingFields.push("Sender Email");
    if (!senderPhoneNumber) missingFields.push("Sender Phone");
    if (!senderAddress) missingFields.push("Sender Address");
    if (!receiverName) missingFields.push("Receiver Name");
    if (!receiverEmail) missingFields.push("Receiver Email");
    if (!receiverPhoneNumber) missingFields.push("Receiver Phone");
    if (!receiverAddress) missingFields.push("Receiver Address");
    if (!pickupLocation) missingFields.push("Pickup Location");
    if (!dropoffLocation) missingFields.push("Dropoff Location");
    if (!shippingRange) missingFields.push("Shipping Range");
    if (!shippingMethod) missingFields.push("Shipping Method");
    if (!packageType) missingFields.push("Package Type");
    if (!packageLength) missingFields.push("Package Length");
    if (!packageWidth) missingFields.push("Package Width");
    if (!packageHeight) missingFields.push("Package Height");
    if (!packageDescription) missingFields.push("Package Description");
    if (!weight) missingFields.push("Weight");
    if (!pickupDate) missingFields.push("Pickup Date");
    if (!dropoffDate) missingFields.push("Dropoff Date");
    if (!totalCost) missingFields.push("Total Cost");
    if (missingFields.length > 0) {
        alert(`Please fill in all required fields:\n${missingFields.join(", ")}`);
        return;
    }
    // Create shipment object
    const shipment = {
        senderName, senderEmail, senderPhoneNumber, senderAddress,
        receiverName, receiverEmail, receiverPhoneNumber, receiverAddress,
        pickupLocation, dropoffLocation, shippingRange, shippingMethod, packageType, packageLength, packageWidth, packageHeight,
        packageDescription, weight,
        pickupDate, dropoffDate, totalCost
    };
    try {
        const response = await fetch("/api/shipments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(shipment)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Failed to add shipment");
        }
        alert("Shipment added successfully!");
        // Update UI
        const shipmentsList = document.getElementById("shipments");
        const shipmentItem = document.createElement("li");
        shipmentItem.textContent = `Shipment from ${senderName} to ${receiverName} - ${totalCost} USD`;
        shipmentsList.appendChild(shipmentItem);
        document.getElementById("shipmentForm").reset(); // Reset the form
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

// Auto-populate shipment list from session storage (if implemented)
document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("authToken")) {
        showMainApp();
    }
});
