document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/';

    // Load data
    fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(users => populateUsersTable(users));

    fetch('/api/admin/shipments', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(shipments => populateShipmentsTable(shipments));

    // Logout
    document.getElementById('adminLogout').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });
});

function populateUsersTable(users) {
    const tbody = document.getElementById('usersList');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.email}</td>
            <td>${user.is_admin ? 'Yes' : 'No'}</td>
        </tr>
    `).join('');
}

function populateShipmentsTable(shipments) {
    const tbody = document.getElementById('shipmentsList');
    tbody.innerHTML = shipments.map(shipment => `
        <tr>
            <td>${shipment.id}</td>
            <td>${shipment.sender_name}</td>
            <td>${shipment.receiver_name}</td>
            <td>${shipment.shipping_method}</td>
            <td>${shipment.status || 'In Transit'}</td>
        </tr>
    `).join('');
}