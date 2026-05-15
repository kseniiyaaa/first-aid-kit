const pool = require('../db');
const { sendExpiryWarningEmail, sendLowStockEmail } = require('./email');
const { markExpiryNotified, markLowStockNotified, LOW_STOCK_THRESHOLD } = require('../models/Medicine');

/**
 * Checks one or more medicines for expiry / low-stock conditions and sends
 * alert emails grouped by user (one email per type per user, not per medicine).
 *
 * Deduplication is guaranteed at the DB level:
 *   - Expiry:    expiry_notified_at IS NULL   → sent exactly once per medicine
 *   - Low stock: low_stock_notified_at set     → not re-sent within 7 days
 * So calling this from both the immediate trigger and the hourly cron is safe —
 * the second call will find nothing to send.
 *
 * Fire-and-forget usage:
 *   checkAndSendAlerts([id]).catch(() => {});
 */
async function checkAndSendAlerts(medicineIds) {
    if (!medicineIds || !medicineIds.length) return;

    let rows;
    try {
        const result = await pool.query(
            `SELECT m.id, m.name, m.quantity, m.unit,
                    m.expiration_date, m.expiry_notified_at, m.low_stock_notified_at,
                    u.email AS user_email, u.full_name, u.is_email_verified
             FROM medicines m
             JOIN users u ON u.id = m.user_id
             WHERE m.id = ANY($1)`,
            [medicineIds]
        );
        rows = result.rows.filter(m => m.is_email_verified);
    } catch (err) {
        console.error('[Alert] DB lookup failed:', err.message);
        return;
    }
    if (!rows.length) return;

    const today      = new Date(); today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Group by user email, collect expiry and low-stock items separately
    const byUser = {};
    for (const m of rows) {
        if (!byUser[m.user_email]) {
            byUser[m.user_email] = {
                email: m.user_email, name: m.full_name,
                expiryItems: [], expiryIds: [],
                lowStockItems: [], lowStockIds: [],
            };
        }
        const u = byUser[m.user_email];

        // Expiry: only if not yet notified
        if (m.expiration_date && !m.expiry_notified_at) {
            const expiry   = new Date(m.expiration_date); expiry.setHours(0, 0, 0, 0);
            const daysLeft = Math.round((expiry - today) / (1000 * 60 * 60 * 24));
            if (daysLeft >= 0 && daysLeft <= 7) {
                u.expiryItems.push({ name: m.name, expirationDate: m.expiration_date, daysLeft });
                u.expiryIds.push(m.id);
            }
        }

        // Low stock: only if not notified in the last 7 days
        if (m.quantity !== null && m.quantity <= LOW_STOCK_THRESHOLD) {
            const notifiedAt = m.low_stock_notified_at ? new Date(m.low_stock_notified_at) : null;
            if (!notifiedAt || notifiedAt < sevenDaysAgo) {
                u.lowStockItems.push({ name: m.name, quantity: m.quantity, unit: m.unit });
                u.lowStockIds.push(m.id);
            }
        }
    }

    // Send one email per user per type
    for (const data of Object.values(byUser)) {
        if (data.expiryItems.length) {
            data.expiryItems.sort((a, b) => a.daysLeft - b.daysLeft);
            try {
                await sendExpiryWarningEmail({ to: data.email, name: data.name, medicines: data.expiryItems });
                await markExpiryNotified(data.expiryIds);
                console.log(`[Alert] Expiry email → ${data.email} (${data.expiryIds.length} medicine(s))`);
            } catch (err) {
                console.error('[Alert] Expiry email failed:', err.message);
            }
        }

        if (data.lowStockItems.length) {
            data.lowStockItems.sort((a, b) => a.quantity - b.quantity);
            try {
                await sendLowStockEmail({ to: data.email, name: data.name, medicines: data.lowStockItems });
                await markLowStockNotified(data.lowStockIds);
                console.log(`[Alert] Low-stock email → ${data.email} (${data.lowStockIds.length} medicine(s))`);
            } catch (err) {
                console.error('[Alert] Low-stock email failed:', err.message);
            }
        }
    }
}

module.exports = { checkAndSendAlerts };
