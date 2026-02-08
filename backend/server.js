require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const initializeSignaling = require('./signaling');

// Import routes
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const peerRoutes = require('./routes/peers');
const adminRoutes = require('./routes/admin');
const resourcesRoutes = require('./routes/resources');
const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize WebRTC signaling server
initializeSignaling(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/peers', peerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/timetable', require('./routes/timetable'));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '✅ Resource & Peer Optimizer API is running!',
    meshNetwork: '🌐 WebRTC Signaling Active'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 WebRTC Signaling Server initialized`);
});

