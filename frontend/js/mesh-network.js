class MeshNetwork {
    constructor(userId, userName) {
        this.userId = userId;
        this.userName = userName;
        this.socket = null;
        this.peers = new Map(); // socketId -> RTCPeerConnection
        this.dataChannels = new Map(); // socketId -> RTCDataChannel
        this.peerInfo = new Map(); // socketId -> peer user data
        this.onlineMode = true;
        this.messageHandlers = [];
        this.peerListChangeHandlers = [];
        this.connectionStateHandlers = [];
    }

    // Initialize connection to signaling server
    async connect(serverUrl = 'http://localhost:5000') {
        return new Promise((resolve) => {
            try {
                this.socket = io(serverUrl);

                this.socket.on('connect', () => {
                    console.log('✅ Connected to signaling server');
                    this.onlineMode = true;
                    this.socket.emit('register-peer', {
                        userId: this.userId,
                        name: this.userName
                    });
                    this.notifyConnectionState('online');
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    console.warn('⚠️ Failed to connect to signaling server, entering offline mode');
                    console.error('Connection error:', error);
                    this.onlineMode = false;
                    this.notifyConnectionState('offline');
                    resolve(); // Still resolve, but in offline mode
                });

                this.setupSignalingHandlers();
            } catch (error) {
                console.error('Error initializing mesh network:', error);
                this.onlineMode = false;
                resolve();
            }
        });
    }

    setupSignalingHandlers() {
        // When we receive list of online peers
        this.socket.on('online-peers', (peers) => {
            console.log(`📋 Received ${peers.length} online peers:`, peers);
            this.notifyPeerListChange(peers);
        });

        // When a new peer comes online
        this.socket.on('peer-online', ({ socketId, userData }) => {
            console.log('👤 New peer online:', userData.name);
            this.notifyPeerListChange([{ socketId, ...userData }]);
        });

        // WebRTC offer received
        this.socket.on('webrtc-offer', async ({ fromId, offer }) => {
            console.log(`📥 Received WebRTC offer from ${fromId}`);
            await this.handleOffer(fromId, offer);
        });

        // WebRTC answer received
        this.socket.on('webrtc-answer', async ({ fromId, answer }) => {
            console.log(`📥 Received WebRTC answer from ${fromId}`);
            await this.handleAnswer(fromId, answer);
        });

        // ICE candidate received
        this.socket.on('webrtc-ice-candidate', async ({ fromId, candidate }) => {
            console.log(`🧊 Received ICE candidate from ${fromId}`);
            await this.handleIceCandidate(fromId, candidate);
        });

        // Peer went offline
        this.socket.on('peer-offline', (socketId) => {
            console.log(`👋 Peer offline: ${socketId}`);
            this.closePeerConnection(socketId);
        });

        // Socket disconnected
        this.socket.on('disconnect', () => {
            console.warn('❌ Disconnected from signaling server');
            this.onlineMode = false;
            this.notifyConnectionState('offline');
        });
    }

    // Connect to a specific peer via WebRTC
    async connectToPeer(targetSocketId, peerName = 'Unknown') {
        if (this.peers.has(targetSocketId)) {
            console.log('ℹ️ Already connected to peer:', targetSocketId);
            return { success: false, message: 'Already connected' };
        }

        if (!this.socket || !this.socket.connected) {
            return { success: false, message: 'Signaling server not connected' };
        }

        try {
            console.log(`🔗 Initiating P2P connection to ${peerName}...`);

            const peerConnection = this.createPeerConnection(targetSocketId);
            this.peers.set(targetSocketId, peerConnection);

            // Create data channel
            const dataChannel = peerConnection.createDataChannel('mesh-data', {
                ordered: true
            });
            this.setupDataChannel(targetSocketId, dataChannel);

            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            this.socket.emit('webrtc-offer', {
                targetId: targetSocketId,
                offer: offer
            });

            return { success: true, message: 'Connection initiated' };
        } catch (error) {
            console.error('Error connecting to peer:', error);
            return { success: false, message: error.message };
        }
    }

    createPeerConnection(peerId) {
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };

        const pc = new RTCPeerConnection(config);

        pc.onicecandidate = (event) => {
            if (event.candidate && this.socket) {
                this.socket.emit('webrtc-ice-candidate', {
                    targetId: peerId,
                    candidate: event.candidate
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`🔄 Connection state with ${peerId}:`, pc.connectionState);
            if (pc.connectionState === 'connected') {
                console.log(`✅ P2P connection established with ${peerId}`);
                this.notifyConnectionState('p2p-connected', peerId);
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                console.warn(`❌ P2P connection ${pc.connectionState} with ${peerId}`);
                this.closePeerConnection(peerId);
            }
        };

        pc.ondatachannel = (event) => {
            console.log(`📨 Data channel received from ${peerId}`);
            this.setupDataChannel(peerId, event.channel);
        };

        return pc;
    }

    setupDataChannel(peerId, channel) {
        this.dataChannels.set(peerId, channel);

        channel.onopen = () => {
            console.log(`✅ Data channel open with peer: ${peerId}`);
            // Trigger UI status update
            this.notifyConnectionState('data-channel-open', peerId);
            this.sendToPeer(peerId, {
                type: 'handshake',
                userId: this.userId,
                userName: this.userName,
                timestamp: Date.now()
            });
        };

        channel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`📩 Received from ${peerId}:`, data.type);
                this.handlePeerMessage(peerId, data);
            } catch (error) {
                console.error('Error parsing peer message:', error);
            }
        };

        channel.onerror = (error) => {
            console.error(`❌ Data channel error with ${peerId}:`, error);
        };

        channel.onclose = () => {
            console.log(`❌ Data channel closed with peer: ${peerId}`);
            this.dataChannels.delete(peerId);
        };
    }

    async handleOffer(fromId, offer) {
        try {
            const peerConnection = this.createPeerConnection(fromId);
            this.peers.set(fromId, peerConnection);

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            this.socket.emit('webrtc-answer', {
                targetId: fromId,
                answer: answer
            });

            console.log(`📤 Sent WebRTC answer to ${fromId}`);
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(fromId, answer) {
        try {
            const peerConnection = this.peers.get(fromId);
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log(`✅ Set remote description for ${fromId}`);
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async handleIceCandidate(fromId, candidate) {
        try {
            const peerConnection = this.peers.get(fromId);
            if (peerConnection) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    // Send message to specific peer
    sendToPeer(peerId, data) {
        const channel = this.dataChannels.get(peerId);
        if (channel && channel.readyState === 'open') {
            try {
                channel.send(JSON.stringify(data));
                console.log(`📤 Sent to ${peerId}:`, data.type);
                return true;
            } catch (error) {
                console.error('Error sending to peer:', error);
                return false;
            }
        }
        console.warn(`⚠️ Cannot send to ${peerId}: channel not open`);
        return false;
    }

    // Broadcast to all connected peers
    broadcast(data) {
        let sentCount = 0;
        this.dataChannels.forEach((channel, peerId) => {
            if (this.sendToPeer(peerId, data)) {
                sentCount++;
            }
        });
        console.log(`📡 Broadcast to ${sentCount} peers`);
        return sentCount;
    }

    // Handle incoming messages from peers
    handlePeerMessage(peerId, data) {
        // Store peer info on handshake
        if (data.type === 'handshake') {
            this.peerInfo.set(peerId, {
                userId: data.userId,
                userName: data.userName
            });
            console.log(`🤝 Handshake complete with ${data.userName}`);
        }

        // Notify all message handlers
        this.messageHandlers.forEach(handler => {
            try {
                handler(peerId, data);
            } catch (error) {
                console.error('Error in message handler:', error);
            }
        });
    }

    // Event listeners
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    onPeerListChange(handler) {
        this.peerListChangeHandlers.push(handler);
    }

    onConnectionStateChange(handler) {
        this.connectionStateHandlers.push(handler);
    }

    notifyPeerListChange(peers) {
        this.peerListChangeHandlers.forEach(handler => {
            try {
                handler(peers);
            } catch (error) {
                console.error('Error in peer list handler:', error);
            }
        });
    }

    notifyConnectionState(state, peerId = null) {
        this.connectionStateHandlers.forEach(handler => {
            try {
                handler(state, peerId);
            } catch (error) {
                console.error('Error in connection state handler:', error);
            }
        });
    }

    closePeerConnection(peerId) {
        const pc = this.peers.get(peerId);
        if (pc) {
            pc.close();
            this.peers.delete(peerId);
        }
        this.dataChannels.delete(peerId);
        this.peerInfo.delete(peerId);
        console.log(`🔌 Closed connection with ${peerId}`);
    }

    getConnectedPeers() {
        return Array.from(this.dataChannels.keys()).filter(peerId => {
            const channel = this.dataChannels.get(peerId);
            return channel && channel.readyState === 'open';
        });
    }

    getPeerInfo(peerId) {
        return this.peerInfo.get(peerId);
    }

    isOffline() {
        return !this.onlineMode || !this.socket?.connected;
    }

    disconnect() {
        console.log('🔌 Disconnecting mesh network...');
        this.peers.forEach((pc, peerId) => {
            this.closePeerConnection(peerId);
        });
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Make available globally
window.MeshNetwork = MeshNetwork;
