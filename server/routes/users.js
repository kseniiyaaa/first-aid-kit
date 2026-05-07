const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { findById, findByEmail, updateName, updateEmail, updatePassword } = require('../models/User');

const router = express.Router();

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ id: user.id, fullName: user.full_name, email: user.email });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/users/name
router.put('/name', requireAuth, async (req, res) => {
    try {
        const { fullName } = req.body;

        if (!fullName || fullName.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        const user = await updateName(req.userId, fullName.trim());
        res.json({ id: user.id, fullName: user.full_name, email: user.email });
    } catch (err) {
        console.error('Update name error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/users/email
router.put('/email', requireAuth, async (req, res) => {
    try {
        const { email } = req.body;
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({ error: 'Enter a valid email address' });
        }

        const existing = await findByEmail(email.trim());
        if (existing && existing.id !== req.userId) {
            return res.status(409).json({ error: 'Email is already in use' });
        }

        const user = await updateEmail(req.userId, email.trim());
        res.json({ id: user.id, fullName: user.full_name, email: user.email });
    } catch (err) {
        console.error('Update email error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/users/password
router.put('/password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        const { rows } = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.userId]
        );
        const dbUser = rows[0];
        if (!dbUser) return res.status(404).json({ error: 'User not found' });

        const isValid = await bcrypt.compare(currentPassword, dbUser.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await updatePassword(req.userId, newHash);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
