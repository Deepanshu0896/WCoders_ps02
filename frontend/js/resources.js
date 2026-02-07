const API_URL = 'http://localhost:5000/api';

const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    window.location.href = 'login.html';
}

loadResources();

async function loadResources(filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        if (filters.type) queryParams.append('type', filters.type);
        if (filters.available) queryParams.append('available', filters.available);

        const queryString = queryParams.toString();
        const url = queryString ? `${API_URL}/resources?${queryString}` : `${API_URL}/resources`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            displayResources(data.resources);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('resourcesList').innerHTML =
            '<p class="error-message">Failed to load resources</p>';
    }
}

function displayResources(resources) {
    const container = document.getElementById('resourcesList');

    if (!resources || resources.length === 0) {
        container.innerHTML = '<p class="info-message">No resources found</p>';
        return;
    }

    container.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <div class="resource-header">
                <div class="resource-icon">${getResourceIcon(resource.type)}</div>
                <span class="badge ${resource.available ? 'badge-available' : 'badge-occupied'}">
                    ${resource.available ? 'Available' : 'Occupied'}
                </span>
            </div>
            <h3>${resource.name}</h3>
            <div class="resource-info">
                <div>📊 ${resource.capacity} people</div>
                <div>🏷️ ${formatResourceType(resource.type)}</div>
                <div>📍 ${resource.location}</div>
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
    try {
        const startTime = new Date();
        const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

        const response = await fetch(`${API_URL}/resources/book/${resourceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                userName: user.name,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            }),
        });

        const data = await response.json();

        if (data.success) {
            alert(`Booked ${resourceName}!\n\nTime: 2 hours\nFrom: ${startTime.toLocaleTimeString()}\nTo: ${endTime.toLocaleTimeString()}`);
            loadResources();
        } else {
            alert(data.message || 'Booking failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error booking resource');
    }
}

function applyResourceFilters() {
    const filters = {};
    const type = document.getElementById('resourceTypeFilter')?.value;
    const avail = document.getElementById('availabilityFilter')?.value;

    if (type) filters.type = type;
    if (avail) filters.available = avail;

    loadResources(filters);
}

function clearResourceFilters() {
    const typeFilter = document.getElementById('resourceTypeFilter');
    const availFilter = document.getElementById('availabilityFilter');

    if (typeFilter) typeFilter.value = '';
    if (availFilter) availFilter.value = '';

    loadResources();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}