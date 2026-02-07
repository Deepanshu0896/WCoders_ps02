const API_URL = 'http://localhost:5000/api';

let allResources = [];
let editingResourceId = null;
// Check authentication and admin status
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
const isAdmin = localStorage.getItem('isAdmin') === 'true';

if (!user || !token) {
    window.location.href = 'login.html';
}

if (!isAdmin) {
    alert('Access Denied: Admin privileges required.');
    window.location.href = 'dashboard.html';
}

loadResources();

async function loadResources() {
    try {
        const response = await fetch(`${API_URL}/resources`);
        const data = await response.json();

        allResources = Array.isArray(data) ? data : (data.resources || []);
        displayResources(allResources);
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('resourcesTableBody').innerHTML = `
            <tr><td colspan="6" class="error">Error loading resources</td></tr>
        `;
    }
}


function displayResources(resources) {
    const container = document.getElementById('resourcesGrid');

    if (resources.length === 0) {
        container.innerHTML = '<p class="info-message">No resources found. Click "Add Resource" to create one.</p>';
        return;
    }

    container.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <div class="resource-header">
                <div class="resource-icon">${getResourceIcon(resource.type)}</div>
                <span class="resource-badge ${resource.available ? 'badge-available' : 'badge-occupied'}">
                    ${resource.available ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <h3 class="resource-name">${resource.name}</h3>
            <div class="resource-info">
                <div>📊 Capacity: ${resource.capacity} people</div>
                <div>🏷️ Type: ${formatResourceType(resource.type)}</div>
            </div>
            <div class="resource-actions">
                <button onclick="editResource(${resource.id})" class="btn-icon" title="Edit">✏️ Edit</button>
                <button onclick="toggleResourceStatus(${resource.id})" class="btn-icon" title="Toggle Status">
                    ${resource.available ? '🔒 Disable' : '🔓 Enable'}
                </button>
                <button onclick="deleteResource(${resource.id})" class="btn-icon btn-danger" title="Delete">🗑️ Delete</button>
            </div>
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

function showAddResourceModal() {
    editingResourceId = null;
    document.getElementById('modalTitle').textContent = 'Add New Resource';
    document.getElementById('resourceForm').reset();
    document.getElementById('resourceAvailable').checked = true;
    document.getElementById('resourceModal').style.display = 'flex';
}

function editResource(id) {
    const resource = allResources.find(r => r.id === id);
    if (!resource) return;

    editingResourceId = id;
    document.getElementById('modalTitle').textContent = 'Edit Resource';
    document.getElementById('resourceId').value = id;
    document.getElementById('resourceName').value = resource.name;
    document.getElementById('resourceType').value = resource.type;
    document.getElementById('resourceCapacity').value = resource.capacity;
    document.getElementById('resourceAvailable').checked = resource.available;

    document.getElementById('resourceModal').style.display = 'flex';
}

function closeResourceModal() {
    document.getElementById('resourceModal').style.display = 'none';
    editingResourceId = null;
}

document.getElementById('resourceForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const resourceData = {
        name: document.getElementById('resourceName').value,
        type: document.getElementById('resourceType').value,
        capacity: parseInt(document.getElementById('resourceCapacity').value),
        available: document.getElementById('resourceAvailable').checked
    };

    try {
        // Point to the correct functional backend route (resources.js)
        const url = editingResourceId
            ? `${API_URL}/resources/${editingResourceId}`
            : `${API_URL}/resources`;

        const method = editingResourceId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resourceData),
        });

        if (response.ok) {
            alert(editingResourceId ? 'Resource updated successfully!' : 'Resource created successfully!');
            closeResourceModal();
            loadResources();
        } else {
            alert('Failed to save resource');
        }
    } catch (error) {
        console.error('Error saving resource:', error);
        alert('Error saving resource');
    }
});

async function toggleResourceStatus(id) {
    const resource = allResources.find(r => r.id === id);
    if (!resource) return;

    try {
        // Use the functional backend route
        const response = await fetch(`${API_URL}/resources/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ available: !resource.available }),
        });

        if (response.ok) {
            loadResources();
        }
    } catch (error) {
        console.error('Error toggling resource status:', error);
    }
}

async function deleteResource(id) {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
        const response = await fetch(`${API_URL}/resources/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Resource deleted successfully!');
            loadResources();
        } else {
            alert('Failed to delete resource');
        }
    } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Error deleting resource');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}