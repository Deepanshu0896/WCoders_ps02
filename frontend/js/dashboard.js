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