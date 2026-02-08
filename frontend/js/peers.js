const API_URL = 'http://localhost:5000/api';

const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    window.location.href = 'login.html';
}

// Initialize mesh network and offline storage
let meshNetwork = null;
let offlineStorage = null;
let availableSocketPeers = []; // Store socket IDs of available peers

// Initialize mesh network
async function initializeMeshNetwork() {
    try {
        console.log('🚀 Initializing mesh network...');

        meshNetwork = new MeshNetwork(user.id, user.name);
        offlineStorage = new OfflineStorage();

        await offlineStorage.init();
        await meshNetwork.connect();

        // Handle connection state changes
        meshNetwork.onConnectionStateChange((state, peerId) => {
            updateMeshStatus();
            if (state === 'p2p-connected' || state === 'data-channel-open') {
                showNotification(`✅ P2P connection established!`);
                showP2PChat(); // Show the chat UI
            } else if (state === 'offline') {
                document.querySelector('.status-indicator').textContent = '📡 Offline Mode';
                document.querySelector('.status-indicator').className = 'status-indicator status-offline';
                // Don't hide chat in offline mode - we want to use it!
            }
        });

        // Handle peer list changes
        meshNetwork.onPeerListChange((peers) => {
            console.log('📋 Available peers updated:', peers);
            availableSocketPeers = peers;
            updateMeshStatus();
        });

        // Handle incoming P2P messages
        meshNetwork.onMessage((peerId, data) => {
            handleMeshMessage(peerId, data);
        });

        updateMeshStatus();
        console.log('✅ Mesh network initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing mesh network:', error);
        updateMeshStatus('error');
    }
}

// Initialize on page load
initializeMeshNetwork();

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

    container.innerHTML = peers.map(peer => {
        // Find matching socket peer if available
        const socketPeer = availableSocketPeers.find(sp => sp.userId === peer._id);
        const canConnectP2P = socketPeer && meshNetwork && !meshNetwork.isOffline();

        return `
        <div class="peer-card">
            <div class="peer-avatar">${getInitials(peer.name)}</div>
            <h3 class="peer-name">${peer.name}</h3>
            <p class="peer-info">${peer.branch} - Year ${peer.year}</p>
            ${peer.currentLocation ? `<p class="peer-info">📍 ${peer.currentLocation}</p>` : ''}
            <div class="peer-skills">
                ${peer.skills.slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="peer-actions" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <button class="btn-invite" onclick="invitePeer('${peer._id}', '${peer.name}')">Invite to Group</button>
                ${canConnectP2P ?
                `<button class="btn-p2p" onclick="connectP2P('${socketPeer.socketId}', '${peer.name}')">🔗 Connect P2P</button>` :
                `<button class="btn-p2p" disabled title="Peer not online">⚡ Offline</button>`
            }
            </div>
        </div>
    `;
    }).join('');
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

// ========== MESH NETWORK FUNCTIONS ==========

// Update mesh network status indicator
// Update mesh network status indicator
// Update mesh network status indicator
function updateMeshStatus(state = null) {
    const statusDiv = document.getElementById('meshStatus');
    if (!statusDiv) return;

    const connectedPeers = meshNetwork ? meshNetwork.getConnectedPeers() : [];
    const isOffline = meshNetwork ? meshNetwork.isOffline() : true;

    // Show/Hide chat based on connection - FAILSAFE
    if (connectedPeers.length > 0) {
        showP2PChat();
    }

    let statusHTML = '';
    const chatBtn = `<button onclick="showP2PChat()" style="margin-left:10px; padding:2px 8px; font-size:0.8rem; cursor:pointer; background:#2563eb; color:white; border:none; border-radius:4px;">💬 Chat</button>`;

    if (state === 'error') {
        statusHTML = `
            <span class="status-offline">❌ Mesh Error</span>
        `;
    } else if (isOffline) {
        statusHTML = `
            <span class="status-offline">📡 Offline Mode</span>
            <span class="p2p-count">P2P: ${connectedPeers.length}</span>
            ${connectedPeers.length > 0 ? chatBtn : ''}
        `;
    } else {
        statusHTML = `
            <span class="status-online">🌐 Online</span>
            <span class="p2p-count">P2P: ${connectedPeers.length}</span>
            ${connectedPeers.length > 0 ? chatBtn : ''}
        `;
    }

    statusDiv.innerHTML = statusHTML;
}

// Connect to peer via WebRTC
async function connectP2P(socketId, peerName) {
    if (!meshNetwork) {
        alert('❌ Mesh network not initialized');
        return;
    }

    const result = await meshNetwork.connectToPeer(socketId, peerName);

    if (result.success) {
        showNotification(`🔗 Connecting to ${peerName}...`);
    } else {
        alert(`❌ Failed to connect: ${result.message}`);
    }
}

// Handle incoming P2P messages
function handleMeshMessage(peerId, data) {
    console.log('📩 Received message:', data.type, 'from', peerId);

    switch (data.type) {
        case 'handshake':
            console.log(`🤝 Handshake with ${data.userName}`);
            showNotification(`✅ Connected to ${data.userName}`);
            updateMeshStatus();
            showP2PChat(); // Show chat when handshake complete
            break;

        case 'chat':
            displayP2PMessage(data.sender, data.message);
            showP2PChat(); // Make sure chat is visible
            break;

        case 'meetup-request':
            handleMeetupRequest(peerId, data);
            break;

        case 'meetup-response':
            handleMeetupResponse(peerId, data);
            break;

        case 'peer-sync':
            handlePeerSync(peerId, data);
            break;

        default:
            console.log('Unknown message type:', data.type);
    }
}

// Handle meetup request
async function handleMeetupRequest(peerId, data) {
    const peerInfo = meshNetwork.getPeerInfo(peerId);
    const peerName = peerInfo ? peerInfo.userName : 'Unknown';

    // Save to offline storage
    if (offlineStorage) {
        await offlineStorage.saveMeetup({
            type: 'received',
            from: peerName,
            fromPeerId: peerId,
            location: data.location,
            time: data.time,
            timestamp: data.timestamp,
            status: 'pending'
        });
    }

    const accept = confirm(
        `📍 Meetup Request from ${peerName}\n\n` +
        `Location: ${data.location}\n` +
        `Time: ${data.time}\n\n` +
        `Accept this meetup?`
    );

    // Send response
    meshNetwork.sendToPeer(peerId, {
        type: 'meetup-response',
        accepted: accept,
        from: user.name,
        timestamp: Date.now()
    });

    showNotification(accept ? '✅ Meetup accepted!' : '❌ Meetup declined');
}

// Handle meetup response
function handleMeetupResponse(peerId, data) {
    const peerInfo = meshNetwork.getPeerInfo(peerId);
    const peerName = peerInfo ? peerInfo.userName : 'Unknown';

    if (data.accepted) {
        showNotification(`✅ ${peerName} accepted your meetup!`);
    } else {
        showNotification(`❌ ${peerName} declined your meetup`);
    }
}

// Handle peer sync
function handlePeerSync(peerId, data) {
    console.log('🔄 Peer sync received:', data);
    // Could implement data synchronization logic here
}

// Send meetup request to connected peer
function sendMeetupRequest(peerId) {
    const location = prompt('📍 Enter meetup location:');
    if (!location) return;

    const time = prompt('🕐 Enter meetup time:');
    if (!time) return;

    const success = meshNetwork.sendToPeer(peerId, {
        type: 'meetup-request',
        from: user.name,
        location: location,
        time: time,
        timestamp: Date.now()
    });

    if (success) {
        showNotification('📤 Meetup request sent!');

        // Save to offline storage
        if (offlineStorage) {
            offlineStorage.saveMeetup({
                type: 'sent',
                to: peerId,
                location: location,
                time: time,
                timestamp: Date.now(),
                status: 'pending'
            });
        }
    } else {
        alert('❌ Failed to send meetup request. Peer not connected.');
    }
}

// Show notification
function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'mesh-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 0.9rem;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

function logout() {
    // Disconnect mesh network before logout
    if (meshNetwork) {
        meshNetwork.disconnect();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// --- P2P Chat UI Helpers ---

function showP2PChat() {
    const chatContainer = document.getElementById('p2pChatContainer');
    if (chatContainer) {
        chatContainer.style.display = 'block';
        console.log('💬 Showing P2P Chat UI');
    } else {
        console.error('❌ P2P Chat Container not found!');
    }
}

function hideP2PChat() {
    const chatContainer = document.getElementById('p2pChatContainer');
    if (chatContainer) chatContainer.style.display = 'none';
}

function displayP2PMessage(senderName, text, isSelf = false) {
    const messagesDiv = document.getElementById('p2pMessages');
    if (!messagesDiv) return;

    // Remove "No messages" placeholder
    if (messagesDiv.children.length === 1 && messagesDiv.children[0].innerText === 'No messages yet') {
        messagesDiv.innerHTML = '';
    }

    const msgEl = document.createElement('div');
    msgEl.style.marginBottom = '4px';
    msgEl.style.textAlign = isSelf ? 'right' : 'left';

    msgEl.innerHTML = `
        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background: ${isSelf ? '#3b82f6' : '#334155'}; color: white; max-width: 80%;">
            <strong style="font-size: 0.8em; display: block; opacity: 0.8;">${senderName}</strong>
            ${text}
        </span>
    `;

    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendP2PMessage() {
    const input = document.getElementById('p2pInput');
    const text = input.value.trim();
    if (!text) return;

    const peers = meshNetwork.getConnectedPeers();
    if (peers.length === 0) {
        alert('No P2P connection! Connect to a peer first.');
        return;
    }

    // Broadcast to all connected peers (simple mesh)
    peers.forEach(peerId => {
        meshNetwork.sendToPeer(peerId, {
            type: 'chat',
            message: text,
            sender: user.name,
            timestamp: Date.now()
        });
    });

    displayP2PMessage('You', text, true);
    input.value = '';
}

function sendMeetupPrompt() {
    const peers = meshNetwork.getConnectedPeers();
    if (peers.length === 0) {
        alert('No P2P connection!');
        return;
    }
    // Just send to first peer for now
    sendMeetupRequest(peers[0]);
}