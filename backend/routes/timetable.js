const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');

// Save or Update Timetable
router.post('/save', async (req, res) => {
    try {
        const { userId, slots } = req.body;

        let timetable = await Timetable.findOne({ userId });

        if (timetable) {
            // Update existing
            timetable.slots = slots;
            timetable.updatedAt = Date.now();
        } else {
            // Create new
            timetable = new Timetable({
                userId,
                slots,
                semester: 'Current', // Default value
            });
        }

        await timetable.save();

        res.json({
            success: true,
            message: 'Timetable saved successfully',
            timetable,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Timetable
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const timetable = await Timetable.findOne({ userId });

        if (!timetable) {
            return res.status(404).json({ message: 'Timetable not found' });
        }

        res.json({
            success: true,
            timetable,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
