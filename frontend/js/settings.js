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

// Load user profile data
loadUserProfile();

function loadUserProfile() {
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileBranch').value = user.branch || 'CSE';
    document.getElementById('profileYear').value = user.year || '1';

    // Load skills and interests from localStorage if available
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    document.getElementById('profileSkills').value = (userDetails.skills || []).join(', ');
    document.getElementById('profileInterests').value = (userDetails.interests || []).join(', ');

    // Load notification preferences from localStorage
    const notifPrefs = JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
    document.getElementById('notifGroupInvites').checked = notifPrefs.groupInvites !== false;
    document.getElementById('notifNewGroups').checked = notifPrefs.newGroups !== false;
    document.getElementById('notifPeerSuggestions').checked = notifPrefs.peerSuggestions !== false;
    document.getElementById('notifResources').checked = notifPrefs.resources || false;

    // Load privacy settings from localStorage
    const privacyPrefs = JSON.parse(localStorage.getItem('privacyPreferences') || '{}');
    document.getElementById('privacyProfileVisible').checked = privacyPrefs.profileVisible !== false;
    document.getElementById('privacyOnlineStatus').checked = privacyPrefs.onlineStatus !== false;
    document.getElementById('privacyLocation').checked = privacyPrefs.location || false;
}

// Handle profile form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('profileName').value.trim();
    const branch = document.getElementById('profileBranch').value;
    const year = parseInt(document.getElementById('profileYear').value);
    const skills = document.getElementById('profileSkills').value.split(',').map(s => s.trim()).filter(Boolean);
    const interests = document.getElementById('profileInterests').value.split(',').map(s => s.trim()).filter(Boolean);

    try {
        // In a real implementation, this would update the backend
        // For now, we'll update localStorage

        user.name = name;
        user.branch = branch;
        user.year = year;

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userDetails', JSON.stringify({ skills, interests }));

        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
    }
});

// Save notification preferences when changed
document.getElementById('notifGroupInvites').addEventListener('change', saveNotificationPreferences);
document.getElementById('notifNewGroups').addEventListener('change', saveNotificationPreferences);
document.getElementById('notifPeerSuggestions').addEventListener('change', saveNotificationPreferences);
document.getElementById('notifResources').addEventListener('change', saveNotificationPreferences);

function saveNotificationPreferences() {
    const preferences = {
        groupInvites: document.getElementById('notifGroupInvites').checked,
        newGroups: document.getElementById('notifNewGroups').checked,
        peerSuggestions: document.getElementById('notifPeerSuggestions').checked,
        resources: document.getElementById('notifResources').checked
    };

    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    showToast('Notification preferences saved');
}

// Save privacy preferences when changed
document.getElementById('privacyProfileVisible').addEventListener('change', savePrivacyPreferences);
document.getElementById('privacyOnlineStatus').addEventListener('change', savePrivacyPreferences);
document.getElementById('privacyLocation').addEventListener('change', savePrivacyPreferences);

function savePrivacyPreferences() {
    const preferences = {
        profileVisible: document.getElementById('privacyProfileVisible').checked,
        onlineStatus: document.getElementById('privacyOnlineStatus').checked,
        location: document.getElementById('privacyLocation').checked
    };

    localStorage.setItem('privacyPreferences', JSON.stringify(preferences));
    showToast('Privacy settings saved');
}

function changePassword() {
    const currentPassword = prompt('Enter current password:');
    if (!currentPassword) return;

    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    const confirmPassword = prompt('Confirm new password:');
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // In a real implementation, this would call the backend API
    alert('Password change functionality would be implemented here.\n\nFor demo purposes, this is a placeholder.');
}

function clearData() {
    if (confirm('Are you sure you want to clear all your data? This will remove your groups and preferences.')) {
        localStorage.removeItem('userDetails');
        localStorage.removeItem('notificationPreferences');
        localStorage.removeItem('privacyPreferences');

        alert('Data cleared successfully! Your account information is preserved.');
        loadUserProfile();
    }
}

function deleteAccount() {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');

    if (confirmation === 'DELETE') {
        if (confirm('This action is irreversible. Are you absolutely sure?')) {
            // In a real implementation, this would call the backend API
            alert('Account deletion would be implemented here.\n\nFor demo purposes, logging you out instead.');
            logout();
        }
    } else {
        alert('Account deletion cancelled.');
    }
}

function showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}