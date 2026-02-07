const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Timetable = require('../models/Timetable');

// Get all available peers with filters
router.get('/available', async (req, res) => {
  try {
    const { branch, year, subject, currentUserId } = req.query;

    let filter = { isAvailable: true };
    
    if (branch) filter.branch = branch;
    if (year) filter.year = parseInt(year);
    if (currentUserId) filter._id = { $ne: currentUserId }; // Exclude current user

    let peers = await User.find(filter).select('-password');

    // If subject filter is provided, filter by skills/interests
    if (subject) {
      peers = peers.filter(peer => 
        peer.skills.includes(subject) || peer.interests.includes(subject)
      );
    }

    res.json({
      success: true,
      count: peers.length,
      peers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Detect current free slots for a user
router.get('/free-now/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = new Date().toTimeString().slice(0, 5); // "14:30"

    const timetable = await Timetable.findOne({ userId });
    
    if (!timetable) {
      return res.json({ isFree: true, message: 'No timetable found' });
    }

    // Check if current time falls in any class slot
    const busySlot = timetable.slots.find(slot => 
      slot.day === currentDay &&
      currentTime >= slot.startTime &&
      currentTime <= slot.endTime
    );

    if (busySlot) {
      return res.json({
        isFree: false,
        currentClass: busySlot.subject,
        endsAt: busySlot.endTime,
      });
    }

    // Find next class
    const todaySlots = timetable.slots
      .filter(slot => slot.day === currentDay && slot.startTime > currentTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const nextClass = todaySlots[0];

    res.json({
      isFree: true,
      freeUntil: nextClass ? nextClass.startTime : '23:59',
      nextClass: nextClass ? nextClass.subject : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user availability
router.put('/availability/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAvailable, currentLocation } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isAvailable, currentLocation },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;