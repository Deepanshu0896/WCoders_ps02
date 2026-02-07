const API_URL = 'http://localhost:5000/api';

const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    window.location.href = 'login.html';
}

loadResources();

async function loadResources(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();

    try {
        const response = await fetch(`${API_URL}/resources?${queryParams}`);
        const data = await response.json();

        displayResources(data.resources);
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('resourcesList').innerHTML = '<p class="info-message">Error loading resources</p>';
    }
}

function displayResources(resources) {
    const container = document.getElementById('resourcesList');

    if (resources.length === 0) {
        container.innerHTML = '<p class="info-message">No resources found</p>';
        return;
    }

    container.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <div class="resource-header">
                <div class="resource-icon">${getResourceIcon(resource.type)}</div>
                <span class="resource-badge ${resource.available ? 'badge-available' : 'badge-occupied'}">
                    ${resource.available ? 'Available' : 'Occupied'}
                </span>
            </div>
            <h3 class="resource-name">${resource.name}</h3>
            <div class="resource-info">
                <div>📊 Capacity: ${resource.capacity} people</div>
                <div>🏷️ Type: ${formatResourceType(resource.type)}</div>
            </div>
            <button 
                class="btn-book" 
                onclick="bookResource(${resource.id}, '${resource.name}')"
                ${!resource.available ? 'disabled' : ''}
            >
                ${resource.available ? 'Book Now' : 'Not Available'}
            </button>
        </div>
    `).join('');
}

function getResourceIcon(type) {
    const icons = {
        'study_room': '📚',
        'lab': '💻',
        'hall': '🎓',
        'sports': '⚽'
    };
    return icons[type] || '📍';
}

function formatResourceType(type) {
    const types = {
        'study_room': 'Study Room',
        'lab': 'Computer Lab',
        'hall': 'Seminar Hall',
        'sports': 'Sports Facility'
    };
    return types[type] || type;
}

async function bookResource(resourceId, resourceName) {
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now

    try {
        const response = await fetch(`${API_URL}/resources/book/${resourceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: user.id,
                startTime,
                endTime
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Successfully booked ${resourceName}!\n\nBooking time: 2 hours\nFrom: ${new Date(startTime).toLocaleTimeString()}\nTo: ${new Date(endTime).toLocaleTimeString()}`);
            loadResources();
        } else {
            alert(data.message || 'Failed to book resource');
        }
    } catch (error) {
        console.error('Error booking resource:', error);
        alert('Error booking resource');
    }
}

function applyResourceFilters() {
    const filters = {};

    const type = document.getElementById('resourceTypeFilter').value;
    const available = document.getElementById('availabilityFilter').value;

    if (type) filters.type = type;
    if (available) filters.available = available;

    loadResources(filters);
}

function clearResourceFilters() {
    document.getElementById('resourceTypeFilter').value = '';
    document.getElementById('availabilityFilter').value = '';
    loadResources();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}