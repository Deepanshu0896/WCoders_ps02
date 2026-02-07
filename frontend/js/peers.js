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

loadPeers();

async function loadPeers(filters = {}) {
    filters.currentUserId = user.id; // Exclude current user
    const queryParams = new URLSearchParams(filters).toString();

    try {
        const response = await fetch(`${API_URL}/peers/available?${queryParams}`);
        const data = await response.json();

        displayPeers(data.peers);
    } catch (error) {
        console.error('Error loading peers:', error);
        document.getElementById('peersList').innerHTML = '<p class="info-message">Error loading peers</p>';
    }
}

function displayPeers(peers) {
    const container = document.getElementById('peersList');

    if (peers.length === 0) {
        container.innerHTML = '<p class="info-message">No peers available right now. Check back later!</p>';
        return;
    }

    container.innerHTML = peers.map(peer => `
        <div class="peer-card">
            <div class="peer-avatar">${getInitials(peer.name)}</div>
            <h3 class="peer-name">${peer.name}</h3>
            <p class="peer-info">${peer.branch} - Year ${peer.year}</p>
            ${peer.currentLocation ? `<p class="peer-info">📍 ${peer.currentLocation}</p>` : ''}
            <div class="peer-skills">
                ${peer.skills.slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <button class="btn-invite" onclick="invitePeer('${peer._id}', '${peer.name}')">Invite to Group</button>
        </div>
    `).join('');
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function invitePeer(peerId, peerName) {
    alert(`Invite feature coming soon! You selected ${peerName}`);
    // In a full implementation, this would open a modal to select a group and send invitation
}

function applyPeerFilters() {
    const filters = {};

    const branch = document.getElementById('branchFilter').value;
    const year = document.getElementById('yearFilter').value;
    const search = document.getElementById('searchPeer').value;

    if (branch) filters.branch = branch;
    if (year) filters.year = year;
    // Search would require backend modification to support name search

    loadPeers(filters);
}

function clearPeerFilters() {
    document.getElementById('branchFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('searchPeer').value = '';
    loadPeers();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}