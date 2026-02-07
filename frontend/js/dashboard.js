const API_URL = 'http://localhost:5000/api';

// Check authentication
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    window.location.href = 'login.html';
}

// Display user name
document.getElementById('userName').textContent = user.name;

// Show Admin Panel link if user is admin
if (user.isAdmin) {
    const nav = document.querySelector('.sidebar-nav');
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html';
    adminLink.className = 'nav-item';
    adminLink.innerHTML = '<span class="icon">🛡️</span> Admin Panel';

    // Insert before the last item (Settings) or append
    // Let's append it to the end of the navigation links
    nav.appendChild(adminLink);
}

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

    // Load AI Suggestions
    loadSuggestions();
}

async function loadSuggestions() {
    try {
        const response = await fetch(`${API_URL}/peers/suggestions/${user.id}`);
        const data = await response.json();

        const container = document.getElementById('aiSuggestions');

        if (!data.success || data.suggestions.length === 0) {
            container.innerHTML = '<p class="info-message">No suggestions found. Try adding more skills/interests!</p>';
            return;
        }

        container.innerHTML = data.suggestions.map(peer => `
            <div class="suggestion-card">
                <div class="suggestion-header">
                    <span class="avatar">${getInitials(peer.name)}</span>
                    <div class="suggestion-info">
                        <h4>${peer.name}</h4>
                        <span class="match-score">🔥 ${peer.score} Match Points</span>
                    </div>
                </div>
                <p class="match-reason">✨ ${peer.matchReason}</p>
                <button onclick="window.location.href='peers.html'" class="btn-sm btn-outline">View Profile</button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading suggestions:', error);
        document.getElementById('aiSuggestions').innerHTML = '<p class="error-message">Failed to load suggestions</p>';
    }
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function displayUpcomingGroups(groups) {
    const container = document.getElementById('upcomingGroups');

    if (groups.length === 0) {
        container.innerHTML = '<p class="info-message">No upcoming groups. Create one or join existing groups!</p>';
        return;
    }

    container.innerHTML = groups.slice(0, 3).map(group => `
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

// Load data on page load
loadDashboardData();