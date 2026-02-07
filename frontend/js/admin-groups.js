const API_URL = 'http://localhost:5000/api';

let allGroups = [];

// Check authentication
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

loadGroups();

async function loadGroups() {
    const container = document.getElementById('groupsGrid');
    container.innerHTML = '<div class="loading">Loading groups...</div>';

    try {
        // Use the public browse route or an admin specific route if available
        // Assuming /api/groups/browse returns all groups
        const response = await fetch(`${API_URL}/groups/browse`);
        const data = await response.json();

        allGroups = data.groups || [];
        displayGroups(allGroups);
    } catch (error) {
        console.error('Error loading groups:', error);
        container.innerHTML = '<p class="error-message">Error loading groups. Please ensure backend is running.</p>';
    }
}

function displayGroups(groups) {
    const container = document.getElementById('groupsGrid');
    const countElement = document.getElementById('totalGroupsCount');

    if (countElement) countElement.textContent = groups.length;

    if (groups.length === 0) {
        container.innerHTML = '<p class="info-message">No active groups found.</p>';
        return;
    }

    container.innerHTML = groups.map(group => `
        <div class="group-card">
            <div class="group-header">
                <h3 class="group-title">${group.title}</h3>
                <span class="group-badge">${formatActivityType(group.activityType)}</span>
            </div>
            <div class="group-meta">
                <div>📍 ${group.location}</div>
                <div>⏰ ${formatDateTime(group.startTime)} - ${formatTime(group.endTime)}</div>
                <div>👥 ${group.members ? group.members.length : 0}/${group.maxMembers} members</div>
                <div class="group-id">ID: ${group._id}</div>
            </div>
            <div class="group-footer">
                <div class="members-count">Created by: ${group.creator ? group.creator.name : 'Unknown'}</div>
                <button onclick="deleteGroup('${group._id}')" class="btn-danger btn-sm">Delete Group</button>
            </div>
        </div>
    `).join('');
}

function formatActivityType(type) {
    const types = {
        'study_group': 'Study Group',
        'project_work': 'Project Work',
        'assignment_help': 'Assignment Help',
        'exam_prep': 'Exam Prep',
        'skill_workshop': 'Workshop'
    };
    return types[type] || type;
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function deleteGroup(groupId) {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${API_URL}/groups/${groupId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}` // Ensure auth header if needed, though backend might not check for admin here yet
            }
        });

        if (response.ok) {
            alert('Group deleted successfully!');
            loadGroups();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete group');
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Error deleting group');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}
