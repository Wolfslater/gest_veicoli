// Dati di esempio (in memoria)
let users = [
    {
        id: 1,
        username: 'admin',
        password: 'admin123',
        fullName: 'Amministratore',
        isAdmin: true,
        permissions: {
            canReserve: true,
            canViewAll: true,
            canManageVehicles: true
        }
    },
    {
        id: 2,
        username: 'mario',
        password: 'mario123',
        fullName: 'Mario Rossi',
        isAdmin: false,
        permissions: {
            canReserve: true,
            canViewAll: false,
            canManageVehicles: false
        }
    }
];

let vehicles = [
    {
        id: 1,
        name: 'Fiat Panda',
        plate: 'AB123CD',
        type: 'auto',
        seats: 5,
        status: 'available'
    },
    {
        id: 2,
        name: 'Ford Transit',
        plate: 'EF456GH',
        type: 'furgone',
        seats: 3,
        status: 'available'
    },
    {
        id: 3,
        name: 'Mercedes Sprinter',
        plate: 'IJ789KL',
        type: 'minibus',
        seats: 12,
        status: 'available'
    }
];

let reservations = [
    {
        id: 1,
        vehicleId: 1,
        userId: 2,
        startDate: new Date('2025-05-30T10:00'),
        endDate: new Date('2025-05-30T18:00'),
        notes: 'Trasporto materiali',
        status: 'active'
    }
];

let currentUser = null;
let nextUserId = 3;
let nextVehicleId = 4;
let nextReservationId = 2;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const userWelcome = document.getElementById('userWelcome');
const logoutBtn = document.getElementById('logoutBtn');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Modals
const reservationModal = document.getElementById('reservationModal');
const vehicleModal = document.getElementById('vehicleModal');
const userModal = document.getElementById('userModal');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    startReservationChecker();
});

function initializeApp() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Tab navigation
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Modal cancel buttons
    document.getElementById('cancelReservation').addEventListener('click', closeAllModals);
    document.getElementById('cancelVehicle').addEventListener('click', closeAllModals);
    document.getElementById('cancelUser').addEventListener('click', closeAllModals);
    
    // Forms
    document.getElementById('reservationForm').addEventListener('submit', handleReservation);
    document.getElementById('vehicleForm').addEventListener('submit', handleAddVehicle);
    document.getElementById('userForm').addEventListener('submit', handleUserForm);
    
    // Add buttons
    document.getElementById('addVehicleBtn').addEventListener('click', () => openVehicleModal());
    document.getElementById('addUserBtn').addEventListener('click', () => openUserModal());
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Update vehicle statuses
    updateVehicleStatuses();
    
    // Show login screen
    showScreen('login');
}

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (screen === 'login') {
        loginScreen.classList.remove('active');
    } else if (screen === 'dashboard') {
        dashboardScreen.classList.add('active');
    }
}

function handleLogin(e) {
    console.log("Tentativo di login...");
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        userWelcome.textContent = `Benvenuto, ${user.fullName}`;
        
        // Show/hide admin elements
        if (user.isAdmin) {
            document.body.classList.add('admin');
        } else {
            document.body.classList.remove('admin');
        }
        
        showScreen('dashboard');
        loadDashboard();
        loginError.textContent = '';
        loginForm.reset();
    } else {
        if (loginError) loginError.textContent = 'Nome utente o password non corretti';
    }
}

function handleLogout() {
    currentUser = null;
    document.body.classList.remove('admin');
    showScreen('login');
    closeAllModals();
}

function switchTab(tabName) {
    // Update tab buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load tab content
    if (tabName === 'vehicles') {
        loadVehicles();
    } else if (tabName === 'reservations') {
        loadReservations();
    } else if (tabName === 'users') {
        loadUsers();
    }
}

function loadDashboard() {
    loadVehicles();
}

function loadVehicles() {
    const vehiclesGrid = document.getElementById('vehiclesGrid');
    vehiclesGrid.innerHTML = '';
    
    vehicles.forEach(vehicle => {
        const vehicleCard = createVehicleCard(vehicle);
        vehiclesGrid.appendChild(vehicleCard);
    });
}

function createVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = `vehicle-card ${vehicle.status}`;
    
    const reservation = reservations.find(r => r.vehicleId === vehicle.id && r.status === 'active');
    const isReserved = reservation && new Date() < new Date(reservation.endDate);
    
    const statusText = isReserved ? 'Prenotato' : 'Disponibile';
    const statusClass = isReserved ? 'reserved' : 'available';
    
    card.innerHTML = `
        <div class="vehicle-header">
            <div class="vehicle-name">${vehicle.name}</div>
            <div class="vehicle-status ${statusClass}">${statusText}</div>
        </div>
        <div class="vehicle-info">
            <div class="vehicle-detail"><strong>Targa:</strong> ${vehicle.plate}</div>
            <div class="vehicle-detail"><strong>Tipo:</strong> ${capitalizeFirst(vehicle.type)}</div>
            <div class="vehicle-detail"><strong>Posti:</strong> ${vehicle.seats}</div>
            <div class="vehicle-detail"><strong>ID:</strong> ${vehicle.id}</div>
        </div>
        ${reservation ? `<div class="reservation-info">
            <small>Prenotato fino al: ${formatDateTime(reservation.endDate)}</small>
        </div>` : ''}
        <div class="vehicle-actions">
            ${!isReserved && currentUser.permissions.canReserve ? 
                `<button class="btn btn-primary btn-small" onclick="openReservationModal(${vehicle.id})">Prenota</button>` : ''}
            ${currentUser.isAdmin ? 
                `<button class="btn btn-danger btn-small" onclick="deleteVehicle(${vehicle.id})">Elimina</button>` : ''}
        </div>
    `;
    
    return card;
}

function loadReservations() {
    const reservationsList = document.getElementById('reservationsList');
    reservationsList.innerHTML = '';
    
    const userReservations = currentUser.permissions.canViewAll ? 
        reservations : 
        reservations.filter(r => r.userId === currentUser.id);
    
    if (userReservations.length === 0) {
        reservationsList.innerHTML = '<p>Nessuna prenotazione trovata.</p>';
        return;
    }
    
    userReservations.forEach(reservation => {
        const reservationCard = createReservationCard(reservation);
        reservationsList.appendChild(reservationCard);
    });
}

function createReservationCard(reservation) {
    const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
    const user = users.find(u => u.id === reservation.userId);
    const card = document.createElement('div');
    card.className = 'reservation-card';
    
    const isActive = new Date() < new Date(reservation.endDate);
    const statusText = isActive ? 'Attiva' : 'Scaduta';
    
    card.innerHTML = `
        <div class="reservation-header">
            <div class="reservation-vehicle">🚗 ${vehicle.name} (${vehicle.plate})</div>
            <div class="reservation-status ${isActive ? 'active' : 'expired'}">${statusText}</div>
        </div>
        ${currentUser.permissions.canViewAll ? `<div class="reservation-user">Utente: ${user.fullName}</div>` : ''}
        <div class="reservation-dates">
            <div class="date-info">
                <strong>Inizio:</strong><br>
                ${formatDateTime(reservation.startDate)}
            </div>
            <div class="date-info">
                <strong>Fine:</strong><br>
                ${formatDateTime(reservation.endDate)}
            </div>
        </div>
        ${reservation.notes ? `<div class="reservation-notes"><strong>Note:</strong> ${reservation.notes}</div>` : ''}
        <div class="reservation-actions">
            ${isActive ? `<button class="btn btn-danger btn-small" onclick="cancelReservation(${reservation.id})">Annulla</button>` : ''}
        </div>
    `;
    
    return card;
}

function loadUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userCard = createUserCard(user);
        usersList.appendChild(userCard);
    });
}

function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    
    const permissions = [];
    if (user.isAdmin) permissions.push('Admin');
    if (user.permissions.canReserve) permissions.push('Prenotazioni');
    if (user.permissions.canViewAll) permissions.push('Vista Completa');
    if (user.permissions.canManageVehicles) permissions.push('Gestione Veicoli');
    
    card.innerHTML = `
        <div class="user-info-card">
            <div class="user-name">${user.fullName} (${user.username})</div>
            <div class="user-permissions">
                ${permissions.map(p => `<span class="permission-badge ${user.isAdmin ? 'admin' : ''}">${p}</span>`).join('')}
            </div>
        </div>
        <div class="user-actions">
            <button class="btn btn-primary btn-small" onclick="editUser(${user.id})">Modifica</button>
            ${user.id !== currentUser.id ? `<button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">Elimina</button>` : ''}
        </div>
    `;
    
    return card;
}

function openReservationModal(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    document.getElementById('modalVehicleTitle').textContent = `Prenota ${vehicle.name}`;

    // Set minimum date to now
    const now = new Date();
    const minDateTime = now.toISOString().slice(0, 16);
    const startDateTime = document.getElementById('startDateTime');
    const endDateTime = document.getElementById('endDateTime');

    startDateTime.min = minDateTime;
    endDateTime.min = minDateTime;

    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    startDateTime.value = nextHour.toISOString().slice(0, 16);

    const defaultEnd = new Date(nextHour.getTime() + 4 * 60 * 60 * 1000);
    endDateTime.value = defaultEnd.toISOString().slice(0, 16);

    // Aggiorna dinamicamente il minimo per la data di fine
    startDateTime.addEventListener('change', function () {
        endDateTime.min = this.value;
        if (endDateTime.value && endDateTime.value <= this.value) {
            const newEndTime = new Date(this.value);
            newEndTime.setHours(newEndTime.getHours() + 1);
            endDateTime.value = newEndTime.toISOString().slice(0, 16);
        }
    });

    reservationModal.dataset.vehicleId = vehicleId;
    reservationModal.classList.add('active');
}

function openVehicleModal() {
    document.getElementById('vehicleForm').reset();
    vehicleModal.classList.add('active');
}

function openUserModal(userId = null) {
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');
    
    if (userId) {
        const user = users.find(u => u.id === userId);
        title.textContent = 'Modifica Utente';
        document.getElementById('newUsername').value = user.username;
        document.getElementById('newPassword').value = user.password;
        document.getElementById('fullName').value = user.fullName;
        document.getElementById('isAdmin').checked = user.isAdmin;
        document.getElementById('canReserve').checked = user.permissions.canReserve;
        document.getElementById('canViewAll').checked = user.permissions.canViewAll;
        document.getElementById('canManageVehicles').checked = user.permissions.canManageVehicles;
        userModal.dataset.userId = userId;
    } else {
        title.textContent = 'Aggiungi Nuovo Utente';
        form.reset();
        document.getElementById('canReserve').checked = true;
        delete userModal.dataset.userId;
    }
    
    userModal.classList.add('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function handleReservation(e) {
    e.preventDefault();
    
    const vehicleId = parseInt(reservationModal.dataset.vehicleId);
    const startDate = new Date(document.getElementById('startDateTime').value);
    const endDate = new Date(document.getElementById('endDateTime').value);
    const notes = document.getElementById('reservationNotes').value;
    
    // Validation
    if (startDate >= endDate) {
        alert('La data di fine deve essere successiva alla data di inizio');
        return;
    }
    
    if (startDate < new Date()) {
        alert('Non puoi prenotare per una data passata');
        return;
    }
    
    // Check for conflicts
    const hasConflict = reservations.some(r => 
        r.vehicleId === vehicleId && 
        r.status === 'active' &&
        ((startDate >= new Date(r.startDate) && startDate < new Date(r.endDate)) ||
         (endDate > new Date(r.startDate) && endDate <= new Date(r.endDate)) ||
         (startDate <= new Date(r.startDate) && endDate >= new Date(r.endDate)))
    );
    
    if (hasConflict) {
        alert('Il veicolo è già prenotato per questo periodo');
        return;
    }
    
    // Create reservation
    const reservation = {
        id: nextReservationId++,
        vehicleId: vehicleId,
        userId: currentUser.id,
        startDate: startDate,
        endDate: endDate,
        notes: notes,
        status: 'active'
    };
    
    reservations.push(reservation);
    updateVehicleStatuses();
    loadVehicles();
    closeAllModals();
    
    alert('Prenotazione confermata!');
}

function handleAddVehicle(e) {
    e.preventDefault();
    
    const vehicle = {
        id: nextVehicleId++,
        name: document.getElementById('vehicleName').value,
        plate: document.getElementById('vehiclePlate').value.toUpperCase(),
        type: document.getElementById('vehicleType').value,
        seats: parseInt(document.getElementById('vehicleSeats').value),
        status: 'available'
    };
    
    // Check for duplicate plate
    if (vehicles.some(v => v.plate === vehicle.plate)) {
        alert('Esiste già un veicolo con questa targa');
        return;
    }
    
    vehicles.push(vehicle);
    loadVehicles();
    closeAllModals();
    
    alert('Veicolo aggiunto con successo!');
}

function handleUserForm(e) {
    e.preventDefault();
    
    const userId = userModal.dataset.userId ? parseInt(userModal.dataset.userId) : null;
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const fullName = document.getElementById('fullName').value;
    const isAdmin = document.getElementById('isAdmin').checked;
    
    const permissions = {
        canReserve: document.getElementById('canReserve').checked,
        canViewAll: document.getElementById('canViewAll').checked,
        canManageVehicles: document.getElementById('canManageVehicles').checked
    };
    
    // Check for duplicate username (excluding current user when editing)
    if (users.some(u => u.username === username && u.id !== userId)) {
        alert('Nome utente già esistente');
        return;
    }
    
    if (userId) {
        // Edit existing user
        const userIndex = users.findIndex(u => u.id === userId);
        users[userIndex] = {
            ...users[userIndex],
            username,
            password,
            fullName,
            isAdmin,
            permissions
        };
        alert('Utente modificato con successo!');
    } else {
        // Add new user
        const user = {
            id: nextUserId++,
            username,
            password,
            fullName,
            isAdmin,
            permissions
        };
        users.push(user);
        alert('Utente aggiunto con successo!');
    }
    
    loadUsers();
    closeAllModals();
}

function editUser(userId) {
    openUserModal(userId);
}

function deleteUser(userId) {
    if (confirm('Sei sicuro di voler eliminare questo utente?')) {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            users.splice(userIndex, 1);
            // Remove user's reservations
            reservations = reservations.filter(r => r.userId !== userId);
            loadUsers();
            updateVehicleStatuses();
            loadVehicles();
            alert('Utente eliminato');
        }
    }
}

function deleteVehicle(vehicleId) {
    if (confirm('Sei sicuro di voler eliminare questo veicolo?')) {
        const vehicleIndex = vehicles.findIndex(v => v.id === vehicleId);
        if (vehicleIndex > -1) {
            vehicles.splice(vehicleIndex, 1);
            // Remove vehicle's reservations
            reservations = reservations.filter(r => r.vehicleId !== vehicleId);
            loadVehicles();
            alert('Veicolo eliminato');
        }
    }
}

function cancelReservation(reservationId) {
    if (confirm('Sei sicuro di voler annullare questa prenotazione?')) {
        const reservationIndex = reservations.findIndex(r => r.id === reservationId);
        if (reservationIndex > -1) {
            reservations.splice(reservationIndex, 1);
            updateVehicleStatuses();
            loadVehicles();
            loadReservations();
            alert('Prenotazione annullata');
        }
    }
}

function updateVehicleStatuses() {
    const now = new Date();
    
    vehicles.forEach(vehicle => {
        const activeReservation = reservations.find(r => 
            r.vehicleId === vehicle.id && 
            r.status === 'active' &&
            now < new Date(r.endDate)
        );
        
        vehicle.status = activeReservation ? 'reserved' : 'available';
    });
}

function startReservationChecker() {
    setInterval(() => {
        const now = new Date();
        let hasExpired = false;
        
        reservations.forEach(reservation => {
            if (reservation.status === 'active' && now >= new Date(reservation.endDate)) {
                reservation.status = 'expired';
                hasExpired = true;
            }
        });
        
        if (hasExpired) {
            updateVehicleStatuses();
            if (currentUser) {
                loadVehicles();
                loadReservations();
            }
        }
    }, 60000); // Check every minute
}

// Utility functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleString('it-IT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}