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
            dose_amount   DECIMAL,
            is_taken      BOOLEAN NOT NULL DEFAULT FALSE,
            taken_date    DATE,
            created_at    TIMESTAMP DEFAULT NOW()
        )
    `);
    // Міграції для існуючих БД
    await pool.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS end_date DATE`);
    await pool.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMP`);
    await pool.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS dose_amount DECIMAL`);
};

const getRemindersByUserId = async (userId) => {
    const result = await pool.query(
        `SELECT id, user_id, medicine_id, medicine_name, note,
                remind_at, recurrence, end_date, dose_amount, is_taken, taken_date,
                (is_taken AND taken_date = CURRENT_DATE) AS taken_today
         FROM reminders
         WHERE user_id = $1
         ORDER BY remind_at ASC`,
        [userId]
    );
    return result.rows;
};

const createReminder = async (userId, data) => {
    const { medicine_id, medicine_name, note, remind_at, recurrence, end_date, dose_amount } = data;
    const result = await pool.query(
        `INSERT INTO reminders
             (user_id, medicine_id, medicine_name, note, remind_at, recurrence, end_date, dose_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
            userId,
            medicine_id  || null,
            medicine_name,
            note         || null,
            remind_at,
            recurrence   || 'none',
            end_date     || null,
            dose_amount  != null && dose_amount !== '' ? Number(dose_amount) : null,
        ]
    );
    return result.rows[0];
};

const toggleReminderTaken = async (id, userId) => {
    // Поточний стан + дані для deducting
    const check = await pool.query(
        `SELECT (is_taken AND taken_date = CURRENT_DATE) AS taken_today,
                medicine_id, dose_amount
         FROM reminders WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    if (!check.rows[0]) return null;

    const { taken_today: takenToday, medicine_id, dose_amount } = check.rows[0];

    // Оновлюємо стан нагадування
    let reminderResult;
    if (takenToday) {
        reminderResult = await pool.query(
            `UPDATE reminders SET is_taken = FALSE, taken_date = NULL
             WHERE id = $1 AND user_id = $2
             RETURNING *, FALSE AS taken_today`,
            [id, userId]
        );
    } else {
        reminderResult = await pool.query(
            `UPDATE reminders SET is_taken = TRUE, taken_date = CURRENT_DATE
             WHERE id = $1 AND user_id = $2
             RETURNING *, TRUE AS taken_today`,
            [id, userId]
        );
    }
    const reminder = reminderResult.rows[0];

    // Коригуємо запас ліків, якщо є medicine_id і dose_amount
    let medicine = null;
    if (medicine_id && dose_amount) {
        // taken → відняти; un-taken → повернути
        const delta = takenToday ? Number(dose_amount) : -Number(dose_amount);
        const medResult = await pool.query(
            `UPDATE medicines
             SET quantity = GREATEST(0, quantity + $1)
             WHERE id = $2 AND quantity IS NOT NULL
             RETURNING id, quantity, unit`,
            [delta, medicine_id]
        );
        medicine = medResult.rows[0] || null;
    }

    return { reminder, medicine };
};

const getReminderById = async (id, userId) => {
    const result = await pool.query(
        'SELECT * FROM reminders WHERE id = $1 AND user_id = $2',
        [id, userId]
    );
    return result.rows[0] || null;
};

const updateReminder = async (id, userId, data) => {
    const { medicine_id, medicine_name, note, remind_at, recurrence, end_date, dose_amount } = data;
    const result = await pool.query(
        `UPDATE reminders
         SET medicine_id = $1, medicine_name = $2, note = $3, remind_at = $4,
             recurrence = $5, end_date = $6, dose_amount = $7
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [
            medicine_id  || null,
            medicine_name,
            note         || null,
            remind_at,
            recurrence   || 'none',
            end_date     || null,
            dose_amount  != null && dose_amount !== '' ? Number(dose_amount) : null,
            id,
            userId,
        ]
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

/**
 * Повертає нагадування, яким треба надіслати email прямо зараз.
 * currentTime — рядок "HH:MM" у LOCAL-часі сервера.
 */
const getDueReminders = async (currentTime) => {
    const result = await pool.query(
        `SELECT r.*, u.email AS user_email, u.full_name
         FROM reminders r
         JOIN users u ON u.id = r.user_id
         WHERE
             TO_CHAR(r.remind_at, 'HH24:MI') = $1
             AND (
                 (r.recurrence = 'none'
                     AND DATE(r.remind_at) = CURRENT_DATE
                     AND r.last_email_sent IS NULL)
                 OR
                 (r.recurrence != 'none'
                     AND (r.end_date IS NULL OR r.end_date >= CURRENT_DATE)
                     AND (r.last_email_sent IS NULL OR DATE(r.last_email_sent) < CURRENT_DATE))
             )`,
        [currentTime]
    );
    return result.rows;
};

const markEmailSent = async (id) => {
    await pool.query(
        'UPDATE reminders SET last_email_sent = NOW() WHERE id = $1',
        [id]
    );
};

module.exports = {
    createRemindersTable,
    getRemindersByUserId,
    getReminderById,
    createReminder,
    updateReminder,
    toggleReminderTaken,
    deleteReminder,
    getDueReminders,
    markEmailSent,
};
