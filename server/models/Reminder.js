const pool = require('../db');

const createRemindersTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS reminders (
            id            SERIAL PRIMARY KEY,
            user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            medicine_id   INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
            medicine_name VARCHAR(255) NOT NULL,
            note          TEXT,
            remind_at     TIMESTAMP NOT NULL,
            recurrence    VARCHAR(20) NOT NULL DEFAULT 'none',
            end_date      DATE,
            is_taken      BOOLEAN NOT NULL DEFAULT FALSE,
            taken_date    DATE,
            created_at    TIMESTAMP DEFAULT NOW()
        )
    `);
    // Міграція для існуючих БД
    await pool.query(`
        ALTER TABLE reminders ADD COLUMN IF NOT EXISTS end_date DATE
    `);
};

const getRemindersByUserId = async (userId) => {
    const result = await pool.query(
        `SELECT id, user_id, medicine_id, medicine_name, note,
                remind_at, recurrence, end_date, is_taken, taken_date,
                (is_taken AND taken_date = CURRENT_DATE) AS taken_today
         FROM reminders
         WHERE user_id = $1
         ORDER BY remind_at ASC`,
        [userId]
    );
    return result.rows;
};

const createReminder = async (userId, data) => {
    const { medicine_id, medicine_name, note, remind_at, recurrence, end_date } = data;
    const result = await pool.query(
        `INSERT INTO reminders (user_id, medicine_id, medicine_name, note, remind_at, recurrence, end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, medicine_id || null, medicine_name, note || null, remind_at, recurrence || 'none', end_date || null]
    );
    return result.rows[0];
};

const toggleReminderTaken = async (id, userId) => {
    // First check whether it's currently "taken today"
    const check = await pool.query(
        `SELECT (is_taken AND taken_date = CURRENT_DATE) AS taken_today
         FROM reminders WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    if (!check.rows[0]) return null;

    const takenToday = check.rows[0].taken_today;

    let result;
    if (takenToday) {
        // Mark un-taken
        result = await pool.query(
            `UPDATE reminders
             SET is_taken = FALSE, taken_date = NULL
             WHERE id = $1 AND user_id = $2
             RETURNING *, FALSE AS taken_today`,
            [id, userId]
        );
    } else {
        // Mark taken for today
        result = await pool.query(
            `UPDATE reminders
             SET is_taken = TRUE, taken_date = CURRENT_DATE
             WHERE id = $1 AND user_id = $2
             RETURNING *, TRUE AS taken_today`,
            [id, userId]
        );
    }
    return result.rows[0] || null;
};

const getReminderById = async (id, userId) => {
    const result = await pool.query(
        'SELECT * FROM reminders WHERE id = $1 AND user_id = $2',
        [id, userId]
    );
    return result.rows[0] || null;
};

const updateReminder = async (id, userId, data) => {
    const { medicine_id, medicine_name, note, remind_at, recurrence, end_date } = data;
    const result = await pool.query(
        `UPDATE reminders
         SET medicine_id = $1, medicine_name = $2, note = $3, remind_at = $4,
             recurrence = $5, end_date = $6
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [medicine_id || null, medicine_name, note || null, remind_at, recurrence || 'none', end_date || null, id, userId]
    );
    return result.rows[0] || null;
};

const deleteReminder = async (id, userId) => {
    const result = await pool.query(
        'DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
    );
    return result.rows[0] || null;
};

module.exports = {
    createRemindersTable,
    getRemindersByUserId,
    getReminderById,
    createReminder,
    updateReminder,
    toggleReminderTaken,
    deleteReminder,
};
