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
            created_at       TIMESTAMP DEFAULT NOW(),
            updated_at       TIMESTAMP DEFAULT NOW()
        )
    `);
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
    const { name, purpose, dosage, quantity, unit, expiration_date, instructions } = data;
    const result = await pool.query(
        `INSERT INTO medicines (user_id, name, purpose, dosage, quantity, unit, expiration_date, instructions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, name, purpose || null, dosage || null, quantity || null, unit || null, expiration_date || null, instructions || null]
    );
    return result.rows[0];
};

const updateMedicine = async (id, userId, data) => {
    const { name, purpose, dosage, quantity, unit, expiration_date, instructions } = data;
    const result = await pool.query(
        `UPDATE medicines
         SET name = $1, purpose = $2, dosage = $3, quantity = $4, unit = $5,
             expiration_date = $6, instructions = $7, updated_at = NOW()
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [name, purpose || null, dosage || null, quantity || null, unit || null, expiration_date || null, instructions || null, id, userId]
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

module.exports = { createMedicinesTable, getMedicinesByUserId, getMedicineById, createMedicine, updateMedicine, deleteMedicine };
