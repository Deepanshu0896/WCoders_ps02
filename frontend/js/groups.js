const API_URL = 'http://localhost:5000/api';

const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    window.location.href = 'login.html';
}


// Show Admin Panel link if user is admin
if (user && user.isAdmin) {
    const nav = document.querySelector('.sidebar-nav');
    if (nav) {
        const adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.className = 'nav-item';
        adminLink.innerHTML = '<span class="icon">🛡️</span> Admin Panel';
        nav.appendChild(adminLink);
    }
}

// Browse Groups Page
if (document.getElementById('groupsList')) {
    loadGroups();
}

async function loadGroups(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();

    try {
        const response = await fetch(`${API_URL}/groups/browse?${queryParams}`);
        const data = await response.json();

        displayGroups(data.groups);
    } catch (error) {
        console.error('Error loading groups:', error);
        document.getElementById('groupsList').innerHTML = '<p class="info-message">Error loading groups</p>';
    }
}

function displayGroups(groups) {
    const container = document.getElementById('groupsList');

    if (groups.length === 0) {
        container.innerHTML = '<p class="info-message">No groups found. Be the first to create one!</p>';
        return;
    }

    container.innerHTML = groups.map(group => {
        const isCreator = group.creatorId._id === user.id;
        const isAdmin = user.isAdmin;
        const canDelete = isCreator || isAdmin;

        return `
        <div class="group-card">
            <div class="group-header">
                <h3 class="group-title">${group.title}</h3>
                <span class="group-badge">${formatActivityType(group.activityType)}</span>
            </div>
            ${group.description ? `<p class="group-description">${group.description}</p>` : ''}
            <div class="group-meta">
                <div>📍 ${group.location}</div>
                <div>⏰ ${formatDateTime(group.startTime)}</div>
                ${group.subject ? `<div>📚 ${group.subject}</div>` : ''}
                <div>👤 Created by ${group.creatorId.name} (${group.creatorId.branch} - ${group.creatorId.year})</div>
            </div>
            <div class="group-footer">
                <span class="members-count">👥 ${group.members.length}/${group.maxMembers} members</span>
                <div class="action-buttons">
                    ${group.members.length < group.maxMembers && !group.members.some(m => m._id === user.id)
                ? `<button class="btn-join" onclick="joinGroup('${group._id}')">Join Group</button>`
                : group.members.some(m => m._id === user.id)
                    ? `<button class="btn-join" style="background: var(--secondary-color);" disabled>Joined ✓</button>`
                    : `<button class="btn-join" disabled>Full</button>`
            }
                    ${canDelete ? `<button class="btn-danger-outline" onclick="deleteGroup('${group._id}')" style="margin-left: 10px;">Delete</button>` : ''}
                </div>
            </div>
        </div>
    `}).join('');
}

async function deleteGroup(groupId) {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/groups/${groupId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Group deleted successfully!');
            loadGroups();
        } else {
            alert(data.message || 'Failed to delete group');
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Error deleting group');
    }
}

async function joinGroup(groupId) {
    try {
        const response = await fetch(`${API_URL}/groups/join/${groupId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Successfully joined the group!');
            loadGroups();
        } else {
            alert(data.message || 'Failed to join group');
        }
    } catch (error) {
        console.error('Error joining group:', error);
        alert('Error joining group');
    }
}

function applyFilters() {
    const filters = {};

    const activityType = document.getElementById('activityTypeFilter').value;
    const subject = document.getElementById('subjectFilter').value;
    const location = document.getElementById('locationFilter').value;

    if (activityType) filters.activityType = activityType;
    if (subject) filters.subject = subject;
    if (location) filters.location = location;

    loadGroups(filters);
}

function clearFilters() {
    document.getElementById('activityTypeFilter').value = '';
    document.getElementById('subjectFilter').value = '';
    document.getElementById('locationFilter').value = '';
    loadGroups();
}

// Create Group Page
if (document.getElementById('createGroupForm')) {
    // Set minimum date/time to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('startTime').min = now.toISOString().slice(0, 16);
    document.getElementById('endTime').min = now.toISOString().slice(0, 16);

    document.getElementById('createGroupForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const groupData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            creatorId: user.id,
            activityType: document.getElementById('activityType').value,
            subject: document.getElementById('subject').value,
            location: document.getElementById('location').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            maxMembers: parseInt(document.getElementById('maxMembers').value),
            isPrivate: document.getElementById('isPrivate').checked,
        };

        try {
            const response = await fetch(`${API_URL}/groups/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(groupData),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Group created successfully!');
                window.location.href = 'groups.html';
            } else {
                showError(data.message || 'Failed to create group');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            showError('Error creating group');
        }
    });
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
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');

    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}