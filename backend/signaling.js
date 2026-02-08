const socketIO = require('socket.io');

function initializeSignaling(server) {
    const io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Track online peers
    const onlinePeers = new Map();

    io.on('connection', (socket) => {
        console.log('🔗 Peer connected:', socket.id);

        // Register peer with user data
        socket.on('register-peer', (userData) => {
            onlinePeers.set(socket.id, {
                ...userData,
                socketId: socket.id,
                timestamp: Date.now()
            });

            console.log(`👤 Peer registered: ${userData.name} (${socket.id})`);

            // Broadcast to others that a new peer is available
            socket.broadcast.emit('peer-online', {
                socketId: socket.id,
                userData
            });

            // Send list of currently online peers to the newly connected peer
            const peers = Array.from(onlinePeers.values())
                .filter(p => p.socketId !== socket.id);
            socket.emit('online-peers', peers);

            console.log(`📋 Sent ${peers.length} online peers to ${userData.name}`);
        });

        // WebRTC Signaling - Relay offer from one peer to another
        socket.on('webrtc-offer', ({ targetId, offer }) => {
            console.log(`📤 Relaying WebRTC offer from ${socket.id} to ${targetId}`);
            io.to(targetId).emit('webrtc-offer', {
                fromId: socket.id,
                offer
            });
        });

        // WebRTC Signaling - Relay answer
        socket.on('webrtc-answer', ({ targetId, answer }) => {
            console.log(`📥 Relaying WebRTC answer from ${socket.id} to ${targetId}`);
            io.to(targetId).emit('webrtc-answer', {
                fromId: socket.id,
                answer
            });
        });

        // WebRTC Signaling - Relay ICE candidates
        socket.on('webrtc-ice-candidate', ({ targetId, candidate }) => {
            console.log(`🧊 Relaying ICE candidate from ${socket.id} to ${targetId}`);
            io.to(targetId).emit('webrtc-ice-candidate', {
                fromId: socket.id,
                candidate
            });
        });

        // Handle peer disconnect
        socket.on('disconnect', () => {
            const peer = onlinePeers.get(socket.id);
            if (peer) {
                console.log(`👋 Peer disconnected: ${peer.name || 'Unknown'} (${socket.id})`);
                onlinePeers.delete(socket.id);
                socket.broadcast.emit('peer-offline', socket.id);
            }
        });
    });

    // Log status every 30 seconds
    setInterval(() => {
        console.log(`📊 Active P2P connections: ${onlinePeers.size}`);
    }, 30000);

    return io;
}

module.exports = initializeSignaling;
