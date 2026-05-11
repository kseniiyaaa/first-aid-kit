const pool = require('../db');

const createPasswordResetTokensTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token      VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used       BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);
};

// Create a new reset token; invalidate any previous unused tokens for this user
const createResetToken = async (userId, token, expiresAt) => {
    await pool.query(
        `UPDATE password_reset_tokens SET used = true
         WHERE user_id = $1 AND used = false`,
        [userId]
    );
    const result = await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3) RETURNING id`,
        [userId, token, expiresAt]
    );
    return result.rows[0];
};

// Find a token that is valid (not expired, not used)
const findValidToken = async (token) => {
    const result = await pool.query(
        `SELECT prt.*, u.id AS uid, u.full_name, u.email
         FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE prt.token     = $1
           AND prt.expires_at > NOW()
           AND prt.used       = false`,
        [token]
    );
    return result.rows[0] || null;
};

// Mark token as used after password is changed
const markTokenUsed = async (token) => {
    await pool.query(
        `UPDATE password_reset_tokens SET used = true WHERE token = $1`,
        [token]
    );
};

module.exports = {
    createPasswordResetTokensTable,
    createResetToken,
    findValidToken,
    markTokenUsed,
};
