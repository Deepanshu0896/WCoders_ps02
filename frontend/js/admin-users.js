const API_URL = 'http://localhost:5000/api';

let allUsers = [];
let filteredUsers = [];
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

loadUsers();

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`);
        const data = await response.json();

        allUsers = data.users || [];
        filteredUsers = allUsers;
        displayUsers(filteredUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr><td colspan="7" class="error">Error loading users</td></tr>
        `;
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user._id.substring(0, 8)}...</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.branch}</td>
            <td>${user.year}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td class="actions">
                <button onclick="viewUser('${user._id}')" class="btn-icon" title="View Details">👁️</button>
                <button onclick="editUserTimetable('${user._id}')" class="btn-icon" title="Edit Timetable">📅</button>
                <button onclick="toggleUserStatus('${user._id}')" class="btn-icon" title="Toggle Status">
                    ${user.isAvailable ? '🟢' : '🔴'}
                </button>
                <button onclick="deleteUser('${user._id}', '${user.name}')" class="btn-icon btn-danger" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function searchUsers() {
    const query = document.getElementById('userSearch').value.toLowerCase();
    filteredUsers = allUsers.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
    displayUsers(filteredUsers);
}

function filterUsers() {
    const branch = document.getElementById('branchFilter').value;
    const year = document.getElementById('yearFilter').value;

    filteredUsers = allUsers.filter(user => {
        const branchMatch = !branch || user.branch === branch;
        const yearMatch = !year || user.year === parseInt(year);
        return branchMatch && yearMatch;
    });

    displayUsers(filteredUsers);
}

function clearUserFilters() {
    document.getElementById('branchFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('userSearch').value = '';
    filteredUsers = allUsers;
    displayUsers(filteredUsers);
}

async function viewUser(userId) {
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`);
        const data = await response.json();

        const user = data.user;
        document.getElementById('userDetails').innerHTML = `
            <div class="user-info-grid">
                <div class="info-section">
                    <h3>Basic Information</h3>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Branch:</strong> ${user.branch}</p>
                    <p><strong>Year:</strong> ${user.year}</p>
                    <p><strong>Joined:</strong> ${formatDate(user.createdAt)}</p>
                </div>
                
                <div class="info-section">
                    <h3>Skills</h3>
                    <div class="tags">
                        ${(user.skills || []).map(skill => `<span class="tag">${skill}</span>`).join('')}
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>Interests</h3>
                    <div class="tags">
                        ${(user.interests || []).map(interest => `<span class="tag">${interest}</span>`).join('')}
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>Activity</h3>
                    <p><strong>Groups Joined:</strong> ${user.groupsCount || 0}</p>
                    <p><strong>Currently Available:</strong> ${user.isAvailable ? 'Yes' : 'No'}</p>
                    <p><strong>Location:</strong> ${user.currentLocation || 'Not set'}</p>
                </div>
            </div>
        `;

        document.getElementById('userModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading user details:', error);
        alert('Error loading user details');
    }
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function editUserTimetable(userId) {
    document.getElementById('timetableUserId').value = userId;

    // Clear existing slots
    document.getElementById('timeSlots').innerHTML = '';

    // Add one empty slot
    addTimeSlot();

    document.getElementById('timetableModal').style.display = 'flex';
}

function closeTimetableModal() {
    document.getElementById('timetableModal').style.display = 'none';
}

let slotCounter = 0;

function addTimeSlot() {
    const container = document.getElementById('timeSlots');
    const slotId = slotCounter++;

    const slotHtml = `
        <div class="time-slot" id="slot-${slotId}">
            <div class="form-row">
                <div class="form-group">
                    <label>Day</label>
                    <select name="day-${slotId}" required>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Start Time</label>
                    <input type="time" name="startTime-${slotId}" required>
                </div>
                
                <div class="form-group">
                    <label>End Time</label>
                    <input type="time" name="endTime-${slotId}" required>
                </div>
                
                <div class="form-group">
                    <label>Subject</label>
                    <input type="text" name="subject-${slotId}" placeholder="e.g., Data Structures" required>
                </div>
                
                <button type="button" onclick="removeTimeSlot(${slotId})" class="btn-icon btn-danger">🗑️</button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', slotHtml);
}

function removeTimeSlot(slotId) {
    document.getElementById(`slot-${slotId}`).remove();
}

document.getElementById('timetableForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('timetableUserId').value;
    const slots = [];

    // Collect all time slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        const slotId = slot.id.split('-')[1];
        slots.push({
            day: slot.querySelector(`[name="day-${slotId}"]`).value,
            startTime: slot.querySelector(`[name="startTime-${slotId}"]`).value,
            endTime: slot.querySelector(`[name="endTime-${slotId}"]`).value,
            subject: slot.querySelector(`[name="subject-${slotId}"]`).value
        });
    });

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/timetable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ slots }),
        });

        if (response.ok) {
            alert('Timetable updated successfully!');
            closeTimetableModal();
        } else {
            alert('Failed to update timetable');
        }
    } catch (error) {
        console.error('Error updating timetable:', error);
        alert('Error updating timetable');
    }
});

async function toggleUserStatus(userId) {
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/toggle-status`, {
            method: 'PUT',
        });

        if (response.ok) {
            loadUsers();
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
    }
}

async function deleteUser(userId, userName) {
    const confirmation = prompt(`Type "${userName}" to confirm deletion:`);

    if (confirmation !== userName) {
        alert('Deletion cancelled - name did not match');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('User deleted successfully!');
            loadUsers();
        } else {
            alert('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}