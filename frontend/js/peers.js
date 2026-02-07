const API_URL = 'http://localhost:5000/api';

const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    window.location.href = 'login.html';
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

// Invite Logic
let selectedPeerId = null;

async function invitePeer(peerId, peerName) {
    selectedPeerId = peerId;
    document.getElementById('inviteText').textContent = `Select a group to invite ${peerName}:`;

    // Fetch user's created groups
    try {
        // We reuse the browse endpoint but filter client-side or assume we have a "my-created-groups" endpoint
        // Actually we have /my-groups which returns groups I'm a MEMBER of. 
        // We need to filter for groups where I am the CREATOR.
        const response = await fetch(`${API_URL}/groups/my-groups/${user.id}`);
        const data = await response.json();

        if (data.success) {
            const myCreatedGroups = data.groups.filter(g =>
                (g.creatorId._id === user.id || g.creatorId === user.id) && g.status === 'active'
            );

            const select = document.getElementById('groupSelect');
            select.innerHTML = '';

            if (myCreatedGroups.length === 0) {
                select.innerHTML = '<option value="">No created groups found</option>';
            } else {
                myCreatedGroups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group._id;
                    option.textContent = group.title;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error fetching groups:', error);
        document.getElementById('groupSelect').innerHTML = '<option value="">Error loading groups</option>';
    }

    document.getElementById('inviteModal').style.display = 'block';
}

function closeInviteModal() {
    document.getElementById('inviteModal').style.display = 'none';
    selectedPeerId = null;
}

// Close modal if clicked outside
window.onclick = function (event) {
    const modal = document.getElementById('inviteModal');
    if (event.target == modal) {
        closeInviteModal();
    }
}

async function confirmInvite() {
    const groupId = document.getElementById('groupSelect').value;

    if (!groupId) {
        alert('Please select a valid group (or create one first!)');
        return;
    }

    if (!selectedPeerId) return;

    try {
        const response = await fetch(`${API_URL}/groups/${groupId}/add-member`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: selectedPeerId,
                creatorId: user.id
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('User successfully added to the group!');
            closeInviteModal();
        } else {
            alert(data.message || 'Failed to add user');
        }
    } catch (error) {
        console.error('Error inviting info:', error);
        alert('Error sending invite');
    }
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