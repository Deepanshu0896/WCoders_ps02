const API_URL = 'http://localhost:5000/api';

const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    window.location.href = 'login.html';
}

// Check if user is admin
const isAdmin = localStorage.getItem('isAdmin') === 'true';
if (!isAdmin) {
    alert('Access Denied: Admin privileges required.');
    window.location.href = 'dashboard.html';
}

loadDashboardStats();
loadRecentActivity();

async function loadDashboardStats() {
    try {
        // Load total users
        const usersResponse = await fetch(`${API_URL}/admin/users/count`);
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            document.getElementById('totalUsers').textContent = usersData.count || '0';
        }

        // Load total groups
        const groupsResponse = await fetch(`${API_URL}/groups/browse`);
        if (groupsResponse.ok) {
            const groupsData = await groupsResponse.json();
            document.getElementById('totalGroups').textContent = groupsData.count || '0';
        }

        // Load total resources
        const resourcesResponse = await fetch(`${API_URL}/resources`);
        if (resourcesResponse.ok) {
            const resourcesData = await resourcesResponse.json();
            document.getElementById('totalResources').textContent = resourcesData.count || '0';
        }

        // Mock bookings for now
        document.getElementById('totalBookings').textContent = '12';
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentActivity() {
    const container = document.getElementById('activityLog');
    container.innerHTML = '<div class="loading">Loading activity...</div>';

    try {
        const [usersRes, groupsRes] = await Promise.all([
            fetch(`${API_URL}/admin/users`),
            fetch(`${API_URL}/groups/browse`)
        ]);

        const usersData = await usersRes.json();
        const groupsData = await groupsRes.json();

        // Create activity items from real data
        const activities = [];

        // Add User activities
        (usersData.users || []).forEach(u => {
            activities.push({
                type: 'user',
                message: `New user joined: ${u.name}`,
                timestamp: new Date(u.createdAt),
                sortTime: new Date(u.createdAt).getTime()
            });
        });

        // Add Group activities
        (groupsData.groups || []).forEach(g => {
            activities.push({
                type: 'group',
                message: `New group created: ${g.title}`,
                timestamp: g.createdAt ? new Date(g.createdAt) : new Date(), // Fallback if createdAt missing
                sortTime: g.createdAt ? new Date(g.createdAt).getTime() : Date.now()
            });
        });

        // Sort by newest first and take top 5
        activities.sort((a, b) => b.sortTime - a.sortTime);
        const recentActivities = activities.slice(0, 5);

        if (recentActivities.length === 0) {
            container.innerHTML = '<div class="empty">No recent activity</div>';
            return;
        }

        container.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">${getActivityIcon(activity.type)}</div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <span class="activity-time">${timeAgo(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading activity:', error);
        container.innerHTML = '<div class="error">Failed to load activity</div>';
    }
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
}

function getActivityIcon(type) {
    const icons = {
        'user': '👤',
        'group': '👥',
        'booking': '📅',
        'resource': '📍'
    };
    return icons[type] || '📝';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}