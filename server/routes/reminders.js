const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
    getRemindersByUserId,
    getReminderById,
    createReminder,
    updateReminder,
    toggleReminderTaken,
    deleteReminder,
} = require('../models/Reminder');

const router = express.Router();

// GET /api/reminders
router.get('/', requireAuth, async (req, res) => {
    try {
        const reminders = await getRemindersByUserId(req.userId);
        res.json(reminders);
    } catch (err) {
        console.error('Get reminders error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/reminders
router.post('/', requireAuth, async (req, res) => {
    try {
        const { medicine_name, remind_at } = req.body;
        if (!medicine_name || !String(medicine_name).trim()) {
            return res.status(400).json({ error: 'Medicine name is required' });
        }
        if (!remind_at) {
            return res.status(400).json({ error: 'Reminder date and time are required' });
        }
        const reminder = await createReminder(req.userId, req.body);
        res.status(201).json(reminder);
    } catch (err) {
        console.error('Create reminder error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/reminders/:id
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const reminder = await getReminderById(req.params.id, req.userId);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
        res.json(reminder);
    } catch (err) {
        console.error('Get reminder error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/reminders/:id
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { medicine_name, remind_at } = req.body;
        if (!medicine_name || !String(medicine_name).trim()) {
            return res.status(400).json({ error: 'Medicine name is required' });
        }
        if (!remind_at) {
            return res.status(400).json({ error: 'Reminder date and time are required' });
        }
        const reminder = await updateReminder(req.params.id, req.userId, req.body);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
        res.json(reminder);
    } catch (err) {
        console.error('Update reminder error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/reminders/:id/taken
router.patch('/:id/taken', requireAuth, async (req, res) => {
    try {
        const reminder = await toggleReminderTaken(req.params.id, req.userId);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
        res.json(reminder);
    } catch (err) {
        console.error('Toggle reminder taken error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/reminders/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await deleteReminder(req.params.id, req.userId);
        if (!deleted) return res.status(404).json({ error: 'Reminder not found' });
        res.json({ message: 'Reminder deleted' });
    } catch (err) {
        console.error('Delete reminder error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
