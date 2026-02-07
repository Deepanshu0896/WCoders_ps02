require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const peerRoutes = require('./routes/peers');
const resourceRoutes = require('./routes/resources');
const adminRoutes = require('./routes/admin');
const timetableRoutes = require('./routes/timetable');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/peers', peerRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/timetable', timetableRoutes);
// Health check
app.get('/', (req, res) => {
  res.json({ message: '✅ Resource & Peer Optimizer API is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

