const express = require('express');
const router = express.Router();

// In-memory storage (for demo - use MongoDB in production)
let resources = [
    {
        id: 1,
        name: 'Library Room 204',
        type: 'study_room',
        capacity: 8,
        available: true,
        location: 'Library, 2nd Floor',
    },
    {
        id: 2,
        name: 'Computer Lab C',
        type: 'lab',
        capacity: 30,
        available: true,
        location: 'CS Department',
    },
    {
        id: 3,
        name: 'Library Room 305',
        type: 'study_room',
        capacity: 6,
        available: false,
        location: 'Library, 3rd Floor',
    },
    {
        id: 4,
        name: 'Seminar Hall A',
        type: 'hall',
        capacity: 100,
        available: true,
        location: 'Main Building',
    },
];

let nextId = 5;
let bookings = [];

// GET all resources
router.get('/', (req, res) => {
    try {
        const { type, available } = req.query;
        let filtered = [...resources];

        if (type) filtered = filtered.filter(r => r.type === type);
        if (available !== undefined) {
            filtered = filtered.filter(r => r.available === (available === 'true'));
        }

        res.json({
            success: true,
            count: filtered.length,
            resources: filtered,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET single resource
router.get('/:id', (req, res) => {
    try {
        const resource = resources.find(r => r.id === parseInt(req.params.id));

        if (!resource) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        res.json({ success: true, resource });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST book resource
router.post('/book/:id', (req, res) => {
    try {
        const resource = resources.find(r => r.id === parseInt(req.params.id));

        if (!resource) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        if (!resource.available) {
            return res.status(400).json({ success: false, message: 'Not available' });
        }

        const booking = {
            id: bookings.length + 1,
            resourceId: resource.id,
            resourceName: resource.name,
            userId: req.body.userId || 'guest',
            userName: req.body.userName || 'Guest',
            startTime: req.body.startTime || new Date().toISOString(),
            endTime: req.body.endTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            bookedAt: new Date().toISOString(),
        };

        bookings.push(booking);

        res.json({
            success: true,
            message: 'Booked successfully',
            booking,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST create resource (Admin)
router.post('/', (req, res) => {
    try {
        const { name, type, capacity, location } = req.body;

        const newResource = {
            id: nextId++,
            name,
            type,
            capacity: parseInt(capacity),
            available: true,
            location: location || 'Campus',
        };

        resources.push(newResource);

        res.status(201).json({
            success: true,
            message: 'Created successfully',
            resource: newResource,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT update resource (Admin)
router.put('/:id', (req, res) => {
    try {
        const resource = resources.find(r => r.id === parseInt(req.params.id));

        if (!resource) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        const { name, type, capacity, available, location } = req.body;

        if (name) resource.name = name;
        if (type) resource.type = type;
        if (capacity) resource.capacity = parseInt(capacity);
        if (available !== undefined) resource.available = available;
        if (location) resource.location = location;

        res.json({
            success: true,
            message: 'Updated successfully',
            resource,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE resource (Admin)
router.delete('/:id', (req, res) => {
    try {
        const index = resources.findIndex(r => r.id === parseInt(req.params.id));

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        const deleted = resources.splice(index, 1)[0];

        res.json({
            success: true,
            message: 'Deleted successfully',
            resource: deleted,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT toggle availability (Admin)
router.put('/:id/toggle', (req, res) => {
    try {
        const resource = resources.find(r => r.id === parseInt(req.params.id));

        if (!resource) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        resource.available = !resource.available;

        res.json({
            success: true,
            message: `${resource.available ? 'Enabled' : 'Disabled'} successfully`,
            resource,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;