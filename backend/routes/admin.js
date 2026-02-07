const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');
const Timetable = require('../models/Timetable');

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users count
router.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's groups count
    const groupsCount = await Group.countDocuments({ members: req.params.id });

    res.json({
      success: true,
      user: { ...user.toObject(), groupsCount },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also delete user's timetable
    await Timetable.deleteMany({ userId: req.params.id });

    // Remove user from all groups
    await Group.updateMany(
      { members: req.params.id },
      { $pull: { members: req.params.id } }
    );

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user status
router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isAvailable = !user.isAvailable;
    await user.save();

    res.json({
      success: true,
      isAvailable: user.isAvailable,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user timetable
router.post('/users/:id/timetable', async (req, res) => {
  try {
    const { slots } = req.body;

    // Delete existing timetable
    await Timetable.deleteMany({ userId: req.params.id });

    // Create new timetable
    const timetable = new Timetable({
      userId: req.params.id,
      semester: 'Current',
      slots,
    });

    await timetable.save();

    res.json({
      success: true,
      message: 'Timetable updated successfully',
      timetable,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resource management routes
router.post('/resources', async (req, res) => {
  // In production, save to database
  // For now, mock response
  res.status(201).json({
    success: true,
    message: 'Resource created successfully',
  });
});

router.put('/resources/:id', async (req, res) => {
  res.json({
    success: true,
    message: 'Resource updated successfully',
  });
});

router.delete('/resources/:id', async (req, res) => {
  res.json({
    success: true,
    message: 'Resource deleted successfully',
  });
});

// Delete group (admin only)
router.delete('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;