const express = require('express');
const router = express.Router();
const Group = require('../models/Group');

// Create a new group
router.post('/create', async (req, res) => {
  try {
    const {
      title,
      description,
      creatorId,
      activityType,
      subject,
      location,
      startTime,
      endTime,
      maxMembers,
      isPrivate,
    } = req.body;

    const group = new Group({
      title,
      description,
      creatorId,
      activityType,
      subject,
      location,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      maxMembers,
      members: [creatorId], // Creator is automatically a member
      isPrivate,
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('creatorId', 'name branch year')
      .populate('members', 'name branch year');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: populatedGroup,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Browse all active groups with filters
router.get('/browse', async (req, res) => {
  try {
    const { branch, subject, activityType, location } = req.query;

    let filter = {
      status: 'active',
      endTime: { $gt: new Date() }, // Only future/ongoing groups
    };

    if (activityType) filter.activityType = activityType;
    if (subject) filter.subject = subject;
    if (location) filter.location = location;

    let groups = await Group.find(filter)
      .populate('creatorId', 'name branch year')
      .populate('members', 'name branch year')
      .sort({ startTime: 1 });

    // Filter by branch if provided (check creator's branch)
    if (branch) {
      groups = groups.filter(group => group.creatorId.branch === branch);
    }

    res.json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a group
router.post('/join/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    group.members.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('creatorId', 'name branch year')
      .populate('members', 'name branch year');

    res.json({
      success: true,
      message: 'Joined group successfully',
      group: updatedGroup,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a group
router.post('/leave/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.members = group.members.filter(
      member => member.toString() !== userId
    );

    // If creator leaves, cancel the group
    if (group.creatorId.toString() === userId) {
      group.status = 'cancelled';
    }

    await group.save();

    res.json({
      success: true,
      message: 'Left group successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's groups
router.get('/my-groups/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const groups = await Group.find({
      members: userId,
      status: 'active',
    })
      .populate('creatorId', 'name branch year')
      .populate('members', 'name branch year')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a group
router.delete('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body; // Pass userId to verify ownership

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify creator
    if (group.creatorId.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized to delete this group' });
    }

    await Group.findByIdAndDelete(groupId);

    res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Suggested Groups
router.get('/suggested/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const User = require('../models/User'); // Ensure User model is loaded

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get all active future groups the user is NOT in
    const groups = await Group.find({
      status: 'active',
      endTime: { $gt: new Date() },
      members: { $ne: userId }
    })
      .populate('creatorId', 'name branch year')
      .populate('members', 'name branch year');

    // Calculate score
    const scoredGroups = groups.map(group => {
      let score = 0;
      const reasons = [];

      // 1. Subject Match (Highest Priority)
      const userInterests = [...(user.skills || []), ...(user.interests || [])].map(s => s.toLowerCase());
      if (group.subject && userInterests.some(i => group.subject.toLowerCase().includes(i))) {
        score += 20;
        reasons.push(`Example interest: ${group.subject}`);
      }

      // 2. Branch Match
      if (group.creatorId.branch === user.branch) {
        score += 10;
        reasons.push('Same Branch');
      }

      // 3. Year Match
      if (group.creatorId.year === user.year) {
        score += 5;
        reasons.push('Same Year');
      }

      return { ...group.toObject(), score, reasons };
    });

    // Filter out zero scores and sort
    const suggested = scoredGroups
      .filter(g => g.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5

    res.json({
      success: true,
      groups: suggested
    });

  } catch (error) {
    console.error('Error fetching suggested groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;