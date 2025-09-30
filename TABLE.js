const branchBlueprints = {
    dreamwood: {
        name: "Plantopia Dreamwood",
        tables: 12,
        mapUrl: "https://www.google.com/maps/embed?...",
        address: "123 Dreamwood St, San Francisco, CA 94102"
    },
    heavengarden: {
        name: "Plantopia Heavengarden",
        tables: 8,
        mapUrl: "https://www.google.com/maps/embed?...",
        address: "456 Heaven Ave, Los Angeles, CA 90001"
    }
};

let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
let selectedTable = null;
let selectedReservationId = null;

document.addEventListener('DOMContentLoaded', () => {
    setDefaultDate();
    updateBlueprint();
});

function setDefaultDate() {
    const dateInput = document.getElementById('date-select');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
}

function updateBlueprint() {
    const branch = document.getElementById('branch-select').value;
    const date = document.getElementById('date-select').value;
    const grid = document.getElementById('blueprint-grid');
    const map = document.getElementById('branch-map');
    const address = document.getElementById('branch-address');
    const name = document.getElementById('branch-name');

    name.textContent = branchBlueprints[branch].name;
    map.src = branchBlueprints[branch].mapUrl;
    address.textContent = branchBlueprints[branch].address;

    grid.innerHTML = '';
    const tableCount = branchBlueprints[branch].tables;
    const reserved = getReservedTables(date, branch);

    for (let i = 1; i <= tableCount; i++) {
        const div = document.createElement('div');
        div.className = 'table';
        div.id = `table-${i}`;
        div.innerHTML = `<span class="table-number">Table ${i}</span><div class="table-status"></div>`;

        const res = reserved.find(r => r.table === i);

        if (res) {
            div.classList.add('reserved');
            div.onclick = () => showReservationInfo(res);
        } else {
            div.onclick = () => openReservationForm(i);
        }

        grid.appendChild(div);
    }
}

function getReservedTables(date, branch) {
    return reservations
        .filter(r => r.date === date && r.branch === branch && !r.cancelled);
}

function openReservationForm(tableId) {
    selectedTable = tableId;
    selectedReservationId = null;
    document.getElementById('reservation-form').reset();
    document.getElementById('reservation-popup').classList.add('show');
}

function closeReservationForm() {
    document.getElementById('reservation-popup').classList.remove('show');
}

function submitReservation(event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const people = parseInt(document.getElementById('people').value);
    const time = document.getElementById('time').value;
    const terms = document.getElementById('terms').checked;
    const date = document.getElementById('date-select').value;
    const branch = document.getElementById('branch-select').value;

    if (!name || !people || !time || !terms) {
        alert('Please fill all fields and agree to the terms.');
        return;
    }

    const alreadyReserved = reservations.some(r =>
        r.date === date && r.branch === branch && r.table === selectedTable && !r.cancelled
    );

    if (alreadyReserved) {
        alert(`Table ${selectedTable} is already reserved.`);
        return;
    }

    const newReservation = {
        table: selectedTable,
        name,
        people,
        date,
        time,
        branch,
        id: `RES-${Date.now()}`,
        cancelled: false
    };

    reservations.push(newReservation);
    localStorage.setItem('reservations', JSON.stringify(reservations));

    document.getElementById('confirmation-message').textContent =
        `Table ${selectedTable} reserved for ${name} on ${new Date(date).toLocaleDateString()} at ${time} for ${people} guests.`;

    document.getElementById('confirmation-modal').classList.add('show');
    closeReservationForm();
    updateBlueprint();
}

function showReservationInfo(reservation) {
    selectedReservationId = reservation.id;

    const message = `Reserved by ${reservation.name} for ${reservation.people} guests at ${reservation.time} on ${new Date(reservation.date).toLocaleDateString()}.`;
    document.getElementById('cancel-message').textContent = message;

    document.getElementById('cancel-modal').classList.add('show');
}

function cancelReservation() {
    if (!selectedReservationId) return;

    const reservation = reservations.find(r => r.id === selectedReservationId);
    if (reservation) {
        reservation.cancelled = true;
        localStorage.setItem('reservations', JSON.stringify(reservations));
    }

    document.getElementById('cancel-modal').classList.remove('show');
    updateBlueprint();
}

function closeCancelModal() {
    document.getElementById('cancel-modal').classList.remove('show');
}

function closeConfirmationModal() {
    document.getElementById('confirmation-modal').classList.remove('show');
}

function openTermsPopup(event) {
    event.preventDefault();
    document.getElementById('terms-popup').classList.add('show');
}

function closeTermsPopup() {
    document.getElementById('terms-popup').classList.remove('show');
}

function toggleMenu() {
    document.querySelector('.nav-right').classList.toggle('active');
}
