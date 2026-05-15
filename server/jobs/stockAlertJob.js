const cron = require('node-cron');
const {
    getMedicinesExpiringSoon,
    getLowStockMedicines,
    markExpiryNotified,
    markLowStockNotified,
} = require('../models/Medicine');
const { sendExpiryWarningEmail, sendLowStockEmail } = require('../utils/email');

const EXPIRY_DAYS_AHEAD = 7; // warn when medicine expires within this many days

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByUser(rows) {
    const map = {};
    for (const row of rows) {
        if (!map[row.user_id]) {
            map[row.user_id] = { email: row.user_email, name: row.full_name, ids: [], items: [] };
        }
        map[row.user_id].ids.push(row.id);
        map[row.user_id].items.push(row);
    }
    return Object.values(map);
}

// ── Expiry alerts ─────────────────────────────────────────────────────────────

async function processExpiryAlerts() {
    let medicines;
    try {
        medicines = await getMedicinesExpiringSoon(EXPIRY_DAYS_AHEAD);
    } catch (err) {
        console.error('[StockAlertJob] DB error (expiry):', err.message);
        return;
    }
    if (medicines.length === 0) return;

    const groups = groupByUser(medicines);

    for (const group of groups) {
        const items = group.items.map(m => ({
            name:           m.name,
            expirationDate: m.expiration_date,
            daysLeft:       Math.ceil((new Date(m.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)),
        }));
        // Sort by soonest expiry first
        items.sort((a, b) => a.daysLeft - b.daysLeft);

        try {
            await sendExpiryWarningEmail({ to: group.email, name: group.name, medicines: items });
            await markExpiryNotified(group.ids);
            console.log(`[StockAlertJob] Expiry alert → ${group.email} (${group.ids.length} medicine(s))`);
        } catch (err) {
            console.error(`[StockAlertJob] Failed expiry alert for ${group.email}:`, err.message);
        }
    }
}

// ── Low-stock alerts ──────────────────────────────────────────────────────────

async function processLowStockAlerts() {
    let medicines;
    try {
        medicines = await getLowStockMedicines();
    } catch (err) {
        console.error('[StockAlertJob] DB error (low stock):', err.message);
        return;
    }
    if (medicines.length === 0) return;

    const groups = groupByUser(medicines);

    for (const group of groups) {
        const items = group.items.map(m => ({
            name:     m.name,
            quantity: m.quantity,
            unit:     m.unit,
        }));
        // Sort by lowest stock first
        items.sort((a, b) => a.quantity - b.quantity);

        try {
            await sendLowStockEmail({ to: group.email, name: group.name, medicines: items });
            await markLowStockNotified(group.ids);
            console.log(`[StockAlertJob] Low-stock alert → ${group.email} (${group.ids.length} medicine(s))`);
        } catch (err) {
            console.error(`[StockAlertJob] Failed low-stock alert for ${group.email}:`, err.message);
        }
    }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

function startStockAlertJob() {
    // Run once on startup (after a short delay to ensure the DB pool is ready),
    // catching any medicines that were added while the server was down.
    setTimeout(async () => {
        console.log('[StockAlertJob] Running startup checks…');
        await processExpiryAlerts();
        await processLowStockAlerts();
    }, 5000);

    // Then every hour as a safety net
    cron.schedule('0 * * * *', async () => {
        console.log('[StockAlertJob] Running hourly checks…');
        await processExpiryAlerts();
        await processLowStockAlerts();
    });

    console.log('[StockAlertJob] Started — startup check + every hour');
}

module.exports = { startStockAlertJob };
