const pool = require('../db');

const createMedicinesTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS medicines (
            id               SERIAL PRIMARY KEY,
            user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name             VARCHAR(255) NOT NULL,
            purpose          VARCHAR(255),
            dosage           VARCHAR(255),
            quantity         INTEGER,
            unit             VARCHAR(50),
            expiration_date  DATE,
            instructions     TEXT,
            photo            TEXT,
            created_at       TIMESTAMP DEFAULT NOW(),
            updated_at       TIMESTAMP DEFAULT NOW()
        )
    `);
    // Migrations for existing databases
    await pool.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS photo TEXT`);
    await pool.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS expiry_notified_at    TIMESTAMP DEFAULT NULL`);
    await pool.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS low_stock_notified_at TIMESTAMP DEFAULT NULL`);
};

const getMedicinesByUserId = async (userId) => {
    const result = await pool.query(
        'SELECT * FROM medicines WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return result.rows;
};

const getMedicineById = async (id, userId) => {
    const result = await pool.query(
        'SELECT * FROM medicines WHERE id = $1 AND user_id = $2',
        [id, userId]
    );
    return result.rows[0] || null;
};

const createMedicine = async (userId, data) => {
    const { name, purpose, dosage, quantity, unit, expiration_date, instructions, photo } = data;
    const result = await pool.query(
        `INSERT INTO medicines (user_id, name, purpose, dosage, quantity, unit, expiration_date, instructions, photo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [userId, name, purpose || null, dosage || null, quantity || null, unit || null, expiration_date || null, instructions || null, photo || null]
    );
    return result.rows[0];
};

const updateMedicine = async (id, userId, data) => {
    const { name, purpose, dosage, quantity, unit, expiration_date, instructions, photo } = data;
    const result = await pool.query(
        `UPDATE medicines
         SET name = $1, purpose = $2, dosage = $3, quantity = $4, unit = $5,
             expiration_date = $6, instructions = $7, photo = $8, updated_at = NOW()
         WHERE id = $9 AND user_id = $10
         RETURNING *`,
        [name, purpose || null, dosage || null, quantity || null, unit || null, expiration_date || null, instructions || null, photo ?? null, id, userId]
    );
    return result.rows[0] || null;
};

const deductMedicineStock = async (id, userId, amount) => {
    const result = await pool.query(
        `UPDATE medicines
         SET quantity = GREATEST(0, quantity - $1), updated_at = NOW()
         WHERE id = $2 AND user_id = $3 AND quantity IS NOT NULL
         RETURNING id, name, quantity, unit`,
        [Number(amount), id, userId]
    );
    return result.rows[0] || null;
};

const deleteMedicine = async (id, userId) => {
    const result = await pool.query(
        'DELETE FROM medicines WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
    );
    return result.rows[0] || null;
};

// ── Alert queries ─────────────────────────────────────────────────────────────

const LOW_STOCK_THRESHOLD = 5;

/**
 * Returns medicines expiring within `daysAhead` days that have not yet been
 * notified (expiry_notified_at IS NULL). Only for verified-email users.
 */
const getMedicinesExpiringSoon = async (daysAhead = 7) => {
    const result = await pool.query(
        `SELECT m.id, m.user_id, m.name, m.expiration_date,
                u.email AS user_email, u.full_name
         FROM medicines m
         JOIN users u ON u.id = m.user_id
         WHERE m.expiration_date IS NOT NULL
           AND m.expiration_date - CURRENT_DATE BETWEEN 0 AND $1
           AND u.is_email_verified = TRUE
           AND m.expiry_notified_at IS NULL`,
        [daysAhead]
    );
    return result.rows;
};

/**
 * Returns medicines with quantity ≤ LOW_STOCK_THRESHOLD that haven't been
 * notified in the last 7 days. Only for verified-email users.
 */
const getLowStockMedicines = async () => {
    const result = await pool.query(
        `SELECT m.id, m.user_id, m.name, m.quantity, m.unit,
                u.email AS user_email, u.full_name
         FROM medicines m
         JOIN users u ON u.id = m.user_id
         WHERE m.quantity IS NOT NULL
           AND m.quantity <= $1
           AND u.is_email_verified = TRUE
           AND (m.low_stock_notified_at IS NULL
                OR m.low_stock_notified_at < NOW() - INTERVAL '7 days')`,
        [LOW_STOCK_THRESHOLD]
    );
    return result.rows;
};

const markExpiryNotified = async (ids) => {
    if (!ids.length) return;
    await pool.query(
        `UPDATE medicines SET expiry_notified_at = NOW() WHERE id = ANY($1)`,
        [ids]
    );
};

const markLowStockNotified = async (ids) => {
    if (!ids.length) return;
    await pool.query(
        `UPDATE medicines SET low_stock_notified_at = NOW() WHERE id = ANY($1)`,
        [ids]
    );
};

module.exports = {
    createMedicinesTable,
    getMedicinesByUserId,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deductMedicineStock,
    deleteMedicine,
    getMedicinesExpiringSoon,
    getLowStockMedicines,
    markExpiryNotified,
    markLowStockNotified,
    LOW_STOCK_THRESHOLD,
};
