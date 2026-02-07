const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');

// GET /api/timetable/:userId - Get user's timetable
router.get('/:userId', async (req, res) => {
    try {
        const timetable = await Timetable.findOne({ userId: req.params.userId });

        if (!timetable) {
            return res.json({ success: true, timetable: [] });
        }

        res.json({ success: true, timetable: timetable.slots });
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/timetable - Save/Update user's timetable
router.post('/', async (req, res) => {
    try {
        const { userId, slots } = req.body;

        if (!userId || !slots) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Find and update or create new
        let timetable = await Timetable.findOne({ userId });

        if (timetable) {
            timetable.slots = slots;
            await timetable.save();
        } else {
            timetable = new Timetable({
                userId,
                semester: 'Current', // Default semester
                slots
            });
            await timetable.save();
        }

        res.json({ success: true, message: 'Timetable saved successfully', timetable });
    } catch (error) {
        console.error('Error saving timetable:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
