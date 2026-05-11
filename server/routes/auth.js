const crypto  = require('crypto');
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

const { findByEmail, findById, createUser, updatePassword, setVerificationToken, consumeVerificationToken } = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { createResetToken, findValidToken, markTokenUsed } = require('../models/PasswordResetToken');

const router = express.Router();

// Helper: generate a 24-hour token
const makeToken = () => ({
    token:   crypto.randomBytes(32).toString('hex'),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
});

const appUrl = () => process.env.APP_URL || 'http://localhost:5173';

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existing = await findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email is already in use' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await createUser(fullName, email, passwordHash);

        // Generate and store verification token (don't block registration on email failure)
        const { token: verifyToken, expires } = makeToken();
        await setVerificationToken(user.id, verifyToken, expires);

        sendVerificationEmail({
            to:        user.email,
            name:      user.full_name,
            verifyUrl: `${appUrl()}/verify-email?token=${verifyToken}`,
        }).catch((err) => console.error('Verification email error:', err));

        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token: jwtToken,
            user: {
                id:            user.id,
                fullName:      user.full_name,
                email:         user.email,
                emailVerified: false,
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const user = await findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id:            user.id,
                fullName:      user.full_name,
                email:         user.email,
                emailVerified: !!user.is_email_verified,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/auth/verify-email?token=xxx ─────────────────────────────────────
// Handles both initial email verification and pending email-change confirmation
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token is required' });

        const user = await consumeVerificationToken(token);
        if (!user) {
            return res.status(400).json({ error: 'This verification link is invalid or has expired.' });
        }

        res.json({
            message: user.changeType === 'email_change'
                ? 'New email address confirmed successfully.'
                : 'Email verified successfully.',
            email: user.email,
        });
    } catch (err) {
        console.error('Verify email error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/auth/resend-verification ───────────────────────────────────────
router.post('/resend-verification', requireAuth, async (req, res) => {
    try {
        const user = await findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.is_email_verified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        const { token: verifyToken, expires } = makeToken();
        await setVerificationToken(user.id, verifyToken, expires);

        await sendVerificationEmail({
            to:        user.email,
            name:      user.full_name,
            verifyUrl: `${appUrl()}/verify-email?token=${verifyToken}`,
        });

        res.json({ message: 'Verification email sent. Check your inbox.' });
    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Always return the same message — never reveal whether the email exists
        const user = await findByEmail(email.trim().toLowerCase());
        if (user) {
            const { token, expires } = makeToken();
            await createResetToken(user.id, token, expires);

            sendPasswordResetEmail({
                to:       user.email,
                name:     user.full_name,
                resetUrl: `${appUrl()}/reset-password?token=${token}`,
            }).catch((err) => console.error('Password reset email error:', err));
        }

        res.json({ message: 'If this email is registered, a reset link is on its way.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/auth/reset-password?token=xxx ───────────────────────────────────
// Validate the token before showing the reset form
router.get('/reset-password', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token is required' });

        const record = await findValidToken(token);
        if (!record) {
            return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
        }

        res.json({ valid: true, email: record.email });
    } catch (err) {
        console.error('Validate reset token error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const record = await findValidToken(token);
        if (!record) {
            return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await updatePassword(record.user_id, passwordHash);
        await markTokenUsed(token);

        res.json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
