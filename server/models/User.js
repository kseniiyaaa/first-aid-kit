const pool = require('../db');

const createUsersTable = async () => {
    // Base table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            full_name     VARCHAR(255) NOT NULL,
            email         VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at    TIMESTAMP DEFAULT NOW()
        )
    `);

    // Email verification columns (idempotent ALTER TABLE)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified    BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token   VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP`);

    // Pending email change columns
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email         VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email_token   VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email_expires TIMESTAMP`);
};

const findById = async (id) => {
    const result = await pool.query(
        'SELECT id, full_name, email, is_email_verified, created_at FROM users WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
};

const findByEmail = async (email) => {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0] || null;
};

const createUser = async (fullName, email, passwordHash) => {
    const result = await pool.query(
        `INSERT INTO users (full_name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, full_name, email, created_at`,
        [fullName, email, passwordHash]
    );
    return result.rows[0];
};

const updateName = async (id, fullName) => {
    const result = await pool.query(
        `UPDATE users SET full_name = $1 WHERE id = $2
         RETURNING id, full_name, email`,
        [fullName, id]
    );
    return result.rows[0];
};

const updateEmail = async (id, email) => {
    const result = await pool.query(
        `UPDATE users SET email = $1 WHERE id = $2
         RETURNING id, full_name, email`,
        [email, id]
    );
    return result.rows[0];
};

const updatePassword = async (id, passwordHash) => {
    await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, id]
    );
};

// ── Email verification ──────────────────────────────────────────────────────

// Store a verification token for the current email address
const setVerificationToken = async (id, token, expiresAt) => {
    await pool.query(
        `UPDATE users
         SET email_verification_token = $1, email_verification_expires = $2
         WHERE id = $3`,
        [token, expiresAt, id]
    );
};

// Consume a token: handles both new-account verification and pending email change.
// Returns the updated row + a `changeType` hint, or null if token is invalid/expired.
//
// NOTE: We intentionally do NOT clear the tokens after first use.
// This makes the endpoint idempotent — calling it twice with the same token
// (e.g. React StrictMode double-effect in dev) returns success both times.
// Tokens expire naturally via the _expires column.
const consumeVerificationToken = async (token) => {
    // 1. Try regular email-verification token
    //    Only sets is_email_verified = true; token stays so duplicate calls succeed.
    const r1 = await pool.query(
        `UPDATE users
         SET is_email_verified = true
         WHERE email_verification_token = $1
           AND email_verification_expires > NOW()
         RETURNING id, full_name, email, is_email_verified`,
        [token]
    );
    if (r1.rows[0]) return { ...r1.rows[0], changeType: 'verify' };

    // 2. Try pending-email-change token
    //    Applies the new email; keeps pending fields so duplicate calls still succeed.
    const r2 = await pool.query(
        `UPDATE users
         SET email             = pending_email,
             is_email_verified = true
         WHERE pending_email_token = $1
           AND pending_email_expires > NOW()
         RETURNING id, full_name, email, is_email_verified`,
        [token]
    );
    if (r2.rows[0]) return { ...r2.rows[0], changeType: 'email_change' };

    return null;
};

// Store a pending email-change token (sent to the NEW address)
const setPendingEmail = async (id, pendingEmail, token, expiresAt) => {
    await pool.query(
        `UPDATE users
         SET pending_email = $1, pending_email_token = $2, pending_email_expires = $3
         WHERE id = $4`,
        [pendingEmail, token, expiresAt, id]
    );
};

module.exports = {
    createUsersTable,
    findById,
    findByEmail,
    createUser,
    updateName,
    updateEmail,
    updatePassword,
    setVerificationToken,
    consumeVerificationToken,
    setPendingEmail,
};
