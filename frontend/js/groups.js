const API_URL = 'http://localhost:5000/api';

const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    window.location.href = 'login.html';
}

// Browse Groups Page
if (document.getElementById('groupsList')) {
    loadSuggestedGroups(); // Load AI suggestions
    loadGroups();
}

async function loadSuggestedGroups() {
    try {
        const response = await fetch(`${API_URL}/groups/suggested/${user.id}`);
        const data = await response.json();

        if (data.success && data.groups.length > 0) {
            document.getElementById('recommendedSection').style.display = 'block';
            displayGroups(data.groups, 'recommendedList', true);
        }
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

async function loadGroups(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();

    try {
        const response = await fetch(`${API_URL}/groups/browse?${queryParams}`);
        const data = await response.json();

        displayGroups(data.groups, 'groupsList');
    } catch (error) {
        console.error('Error loading groups:', error);
        document.getElementById('groupsList').innerHTML = '<p class="info-message">Error loading groups</p>';
    }
}

function displayGroups(groups, containerId, isRecommended = false) {
    const container = document.getElementById(containerId);

    if (groups.length === 0) {
        container.innerHTML = '<p class="info-message">No groups found.</p>';
        return;
    }

    container.innerHTML = groups.map(group => {
        // AI Reason badge if recommended
        const recommendationHtml = isRecommended && group.reasons
            ? `<div style="background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; margin-bottom: 8px;">✨ ${group.reasons.join(', ')}</div>`
            : '';

        // Check if user is creator
        const isCreator = group.creatorId._id === user.id || group.creatorId === user.id;

        return `
        <div class="group-card" ${isRecommended ? 'style="border: 2px solid var(--secondary-color);"' : ''}>
            ${recommendationHtml}
            <div class="group-header">
                <h3 class="group-title">${group.title}</h3>
                <span class="group-badge">${formatActivityType(group.activityType)}</span>
            </div>
            ${group.description ? `<p class="group-description">${group.description}</p>` : ''}
            <div class="group-meta">
                <div>📍 ${group.location}</div>
                <div>⏰ ${formatDateTime(group.startTime)} - ${formatTime(group.endTime)}</div>
                ${group.subject ? `<div>📚 ${group.subject}</div>` : ''}
                <div>👤 Created by ${group.creatorId.name} (${group.creatorId.branch} - ${group.creatorId.year})</div>
            </div>
            <div class="group-footer">
                <span class="members-count">👥 ${group.members.length}/${group.maxMembers} members</span>
                ${isCreator
                ? `<button class="btn-join" style="background: var(--danger-color);" onclick="deleteGroup('${group._id}')">Delete Group</button>`
                : group.members.some(m => (m._id || m) === user.id)
                    ? `<button class="btn-join" style="background: var(--secondary-color);" disabled>Joined ✓</button>`
                    : group.members.length >= group.maxMembers
                        ? `<button class="btn-join" disabled>Full</button>`
                        : `<button class="btn-join" onclick="joinGroup('${group._id}')">Join Group</button>`
            }
            </div>
        </div>
    `}).join('');
}

async function deleteGroup(groupId) {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
        const response = await fetch(`${API_URL}/groups/${groupId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
        });

        if (response.ok) {
            alert('Group deleted successfully');
            loadGroups();
            loadSuggestedGroups();
        } else {
            const data = await response.json();
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

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
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