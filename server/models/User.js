const pool = require('../db');

const createUsersTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            full_name     VARCHAR(255) NOT NULL,
            email         VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at    TIMESTAMP DEFAULT NOW()
        )
    `);
};

const findById = async (id) => {
    const result = await pool.query(
        'SELECT id, full_name, email, created_at FROM users WHERE id = $1',
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

module.exports = {
    createUsersTable,
    findById,
    findByEmail,
    createUser,
    updateName,
    updateEmail,
    updatePassword,
};
