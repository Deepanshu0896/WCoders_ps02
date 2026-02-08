class OfflineStorage {
    constructor(dbName = 'PeerSyncOffline') {
        this.dbName = dbName;
        this.db = null;
        this.version = 1;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔄 Upgrading IndexedDB schema...');

                // Store for peer information
                if (!db.objectStoreNames.contains('peers')) {
                    const peerStore = db.createObjectStore('peers', { keyPath: 'id' });
                    peerStore.createIndex('name', 'name', { unique: false });
                    peerStore.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('✅ Created peers store');
                }

                // Store for pending messages
                if (!db.objectStoreNames.contains('messages')) {
                    const msgStore = db.createObjectStore('messages', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    msgStore.createIndex('timestamp', 'timestamp', { unique: false });
                    msgStore.createIndex('peerId', 'peerId', { unique: false });
                    msgStore.createIndex('status', 'status', { unique: false });
                    console.log('✅ Created messages store');
                }

                // Store for meetup data
                if (!db.objectStoreNames.contains('meetups')) {
                    const meetupStore = db.createObjectStore('meetups', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    meetupStore.createIndex('timestamp', 'timestamp', { unique: false });
                    meetupStore.createIndex('status', 'status', { unique: false });
                    console.log('✅ Created meetups store');
                }
            };
        });
    }

    // Peer management
    async savePeer(peerData) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['peers'], 'readwrite');
            const store = tx.objectStore('peers');

            const dataWithTimestamp = {
                ...peerData,
                timestamp: Date.now()
            };

            const request = store.put(dataWithTimestamp);

            request.onsuccess = () => {
                console.log('💾 Saved peer:', peerData.name);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getPeers() {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['peers'], 'readonly');
            const store = tx.objectStore('peers');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPeer(peerId) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['peers'], 'readonly');
            const store = tx.objectStore('peers');
            const request = store.get(peerId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deletePeer(peerId) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['peers'], 'readwrite');
            const store = tx.objectStore('peers');
            const request = store.delete(peerId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Message queue management
    async saveMessage(messageData) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['messages'], 'readwrite');
            const store = tx.objectStore('messages');

            const dataWithDefaults = {
                ...messageData,
                timestamp: messageData.timestamp || Date.now(),
                status: messageData.status || 'pending'
            };

            const request = store.add(dataWithDefaults);

            request.onsuccess = () => {
                console.log('💾 Saved message:', request.result);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getMessages(filter = {}) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['messages'], 'readonly');
            const store = tx.objectStore('messages');
            const request = store.getAll();

            request.onsuccess = () => {
                let results = request.result;

                // Apply filters
                if (filter.status) {
                    results = results.filter(msg => msg.status === filter.status);
                }
                if (filter.peerId) {
                    results = results.filter(msg => msg.peerId === filter.peerId);
                }

                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateMessageStatus(messageId, status) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['messages'], 'readwrite');
            const store = tx.objectStore('messages');

            const getRequest = store.get(messageId);

            getRequest.onsuccess = () => {
                const message = getRequest.result;
                if (message) {
                    message.status = status;
                    const updateRequest = store.put(message);
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    reject(new Error('Message not found'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deleteMessage(messageId) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['messages'], 'readwrite');
            const store = tx.objectStore('messages');
            const request = store.delete(messageId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Meetup management
    async saveMeetup(meetupData) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['meetups'], 'readwrite');
            const store = tx.objectStore('meetups');

            const dataWithDefaults = {
                ...meetupData,
                timestamp: meetupData.timestamp || Date.now(),
                status: meetupData.status || 'pending'
            };

            const request = store.add(dataWithDefaults);

            request.onsuccess = () => {
                console.log('💾 Saved meetup:', request.result);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getMeetups(filter = {}) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['meetups'], 'readonly');
            const store = tx.objectStore('meetups');
            const request = store.getAll();

            request.onsuccess = () => {
                let results = request.result;

                // Apply filters
                if (filter.status) {
                    results = results.filter(m => m.status === filter.status);
                }

                // Sort by timestamp descending
                results.sort((a, b) => b.timestamp - a.timestamp);

                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateMeetup(meetupId, updates) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['meetups'], 'readwrite');
            const store = tx.objectStore('meetups');

            const getRequest = store.get(meetupId);

            getRequest.onsuccess = () => {
                const meetup = getRequest.result;
                if (meetup) {
                    Object.assign(meetup, updates);
                    const updateRequest = store.put(meetup);
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    reject(new Error('Meetup not found'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deleteMeetup(meetupId) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['meetups'], 'readwrite');
            const store = tx.objectStore('meetups');
            const request = store.delete(meetupId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Cleanup old data
    async cleanup(daysToKeep = 7) {
        if (!this.db) throw new Error('Database not initialized');

        const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['messages', 'meetups'], 'readwrite');

            // Clean messages
            const msgStore = tx.objectStore('messages');
            const msgIndex = msgStore.index('timestamp');
            const msgRange = IDBKeyRange.upperBound(cutoffTime);
            const msgRequest = msgIndex.openCursor(msgRange);

            msgRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            // Clean meetups
            const meetupStore = tx.objectStore('meetups');
            const meetupIndex = meetupStore.index('timestamp');
            const meetupRange = IDBKeyRange.upperBound(cutoffTime);
            const meetupRequest = meetupIndex.openCursor(meetupRange);

            meetupRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            tx.oncomplete = () => {
                console.log('🧹 Cleaned up old data');
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    }

    close() {
        if (this.db) {
            this.db.close();
            console.log('🔌 Closed IndexedDB');
        }
    }
}

// Make available globally
window.OfflineStorage = OfflineStorage;
