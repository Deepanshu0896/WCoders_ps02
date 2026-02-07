const API_URL = 'http://localhost:5000/api';

// Check authentication
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    window.location.href = 'login.html';
}

// Display user name
document.getElementById('userName').textContent = user.name;

// Availability toggle
const availabilityToggle = document.getElementById('availabilityToggle');
availabilityToggle.addEventListener('change', async (e) => {
    const isAvailable = e.target.checked;

    try {
        const response = await fetch(`${API_URL}/peers/availability/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isAvailable }),
        });

        if (response.ok) {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error updating availability:', error);
    }
});

// Load dashboard data
async function loadDashboardData() {
    // Check free time status
    try {
        const response = await fetch(`${API_URL}/peers/free-now/${user.id}`);
        const data = await response.json();

        const statusElement = document.getElementById('freeTimeStatus');
        if (data.isFree) {
            statusElement.textContent = `Free until ${data.freeUntil}`;
            statusElement.style.color = 'var(--secondary-color)';
        } else {
            statusElement.textContent = `In class: ${data.currentClass}`;
            statusElement.style.color = 'var(--warning-color)';
        }
    } catch (error) {
        console.error('Error checking free time:', error);
    }

    // Get available peers count
    try {
        const response = await fetch(`${API_URL}/peers/available?currentUserId=${user.id}`);
        const data = await response.json();

        document.getElementById('availablePeers').textContent = data.count;
    } catch (error) {
        console.error('Error fetching peers:', error);
    }

    // Get user's groups
    try {
        const response = await fetch(`${API_URL}/groups/my-groups/${user.id}`);
        const data = await response.json();

        document.getElementById('activeGroups').textContent = data.count;
        displayUpcomingGroups(data.groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
    }
}

function displayUpcomingGroups(groups) {
    const container = document.getElementById('upcomingGroups');

    if (groups.length === 0) {
        container.innerHTML = '<p class="info-message">No upcoming groups. Create one or join existing groups!</p>';
        return;
    }

    container.innerHTML = groups.slice(0, 3).map(group => {
        const isCreator = group.creatorId === user.id || (group.creatorId._id === user.id);

        return `
        <div class="group-card">
            <div class="group-header">
                <h3 class="group-title">${group.title}</h3>
                <span class="group-badge">${formatActivityType(group.activityType)}</span>
            </div>
            <div class="group-meta">
                <div>📍 ${group.location}</div>
                <div>⏰ ${formatDateTime(group.startTime)} - ${formatTime(group.endTime)}</div>
                <div>👥 ${group.members.length}/${group.maxMembers} members</div>
            </div>
            <div class="group-footer" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                ${isCreator
                ? `<button class="btn-sm btn-danger" onclick="deleteGroup('${group._id}')" style="background: var(--danger-color); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>`
                : `<button class="btn-sm btn-warning" onclick="leaveGroup('${group._id}')" style="background: var(--warning-color); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Leave</button>`
            }
            </div>
        </div>
    `}).join('');
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

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}


// Check for admin status and add link
// Check for admin status and add link
const storedUser = JSON.parse(localStorage.getItem('user'));

// Use user object as source of truth. Sync isAdmin key for other scripts (admin.js)
if (storedUser && storedUser.isAdmin) {
    if (localStorage.getItem('isAdmin') !== 'true') {
        localStorage.setItem('isAdmin', 'true');
    }

    const sidebarNav = document.querySelector('.sidebar-nav');
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html';
    adminLink.className = 'nav-item';
    adminLink.innerHTML = '<span class="icon">👨‍💼</span> Admin Panel';

    // Insert before the logout button's container or append
    sidebarNav.appendChild(adminLink);
}

// Live Time Update
function updateLiveTime() {
    const timeElement = document.getElementById('liveTime');
    if (timeElement) {
        const now = new Date();
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        timeElement.textContent = '🕒 ' + now.toLocaleString('en-US', options);
    }
}

// Update every second
setInterval(updateLiveTime, 1000);
updateLiveTime(); // Initial call

// Load data on page load
loadDashboardData();
loadAiSuggestions();

async function loadAiSuggestions() {
    try {
        const response = await fetch(`${API_URL}/groups/suggested/${user.id}`);
        const data = await response.json();

        const container = document.getElementById('aiSuggestions');

        if (!data.success || data.groups.length === 0) {
            container.innerHTML = '<p class="info-message">Turn on "Available" or add interests to get suggestions!</p>';
            return;
        }

        container.innerHTML = data.groups.slice(0, 3).map(group => `
            <div class="group-card" style="border: 2px solid var(--secondary-color);">
                <div style="background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; margin-bottom: 8px;">
                    ✨ ${group.reasons.join(', ')}
                </div>
                <div class="group-header">
                    <h3 class="group-title">${group.title}</h3>
                    <span class="group-badge">${formatActivityType(group.activityType)}</span>
                </div>
                <div class="group-meta">
                    <div>📍 ${group.location}</div>
                    <div>⏰ ${formatDateTime(group.startTime)} - ${formatTime(group.endTime)}</div>
                    <div>👥 ${group.members.length}/${group.maxMembers} members</div>
                </div>
                <div class="group-footer" style="margin-top: 1rem;">
                    <button class="btn-join" onclick="joinGroup('${group._id}')">Join Group</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading suggestions:', error);
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

        if (response.ok) {
            alert('Successfully joined the group!');
            loadDashboardData(); // Reload upcoming groups
            loadAiSuggestions(); // Refresh suggestions
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to join group');
        }
    } catch (error) {
        console.error('Error joining group:', error);
        alert('Error joining group');
    }
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
            loadDashboardData(); // Reload dashboard
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete group');
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Error deleting group');
    }
}

async function leaveGroup(groupId) {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
        const response = await fetch(`${API_URL}/groups/leave/${groupId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
        });

        if (response.ok) {
            alert('Left group successfully');
            loadDashboardData(); // Reload dashboard
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to leave group');
        }
    } catch (error) {
        console.error('Error leaving group:', error);
        alert('Error leaving group');
    }
}