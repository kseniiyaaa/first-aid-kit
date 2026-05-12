const cron = require('node-cron');
const { getDueReminders, markEmailSent } = require('../models/Reminder');
const { sendReminderEmail } = require('../utils/email');

/**
 * Перевіряє, чи сьогодні є заплановане спрацювання для recurring-нагадування.
 * Логіка відповідає getNextOccurrence на фронтенді.
 */
function isTodayScheduled(remindAt, recurrence) {
    if (recurrence === 'daily') return true;

    const remindDate = new Date(remindAt);
    remindDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (recurrence === 'every_other_day') {
        const diffDays = Math.round((today - remindDate) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays % 2 === 0;
    }

    if (recurrence === 'weekly') {
        return today.getDay() === remindDate.getDay();
    }

    if (recurrence === 'monthly') {
        return today.getDate() === remindDate.getDate();
    }

    return false;
}

function formatTime12h(remindAt) {
    return new Date(remindAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

async function processReminders(currentTime) {
    let candidates;
    try {
        candidates = await getDueReminders(currentTime);
    } catch (err) {
        console.error('[ReminderJob] DB error:', err.message);
        return;
    }

    if (candidates.length === 0) return;

    for (const reminder of candidates) {
        // Для recurring — додатково перевіряємо що сьогодні є спрацювання
        if (reminder.recurrence !== 'none' && !isTodayScheduled(reminder.remind_at, reminder.recurrence)) {
            continue;
        }

        try {
            await sendReminderEmail({
                to:            reminder.user_email,
                name:          reminder.full_name || reminder.user_email,
                medicineName:  reminder.medicine_name,
                note:          reminder.note,
                scheduledTime: formatTime12h(reminder.remind_at),
            });
            await markEmailSent(reminder.id);
            console.log(`[ReminderJob] Email sent → ${reminder.user_email} (reminder #${reminder.id}: ${reminder.medicine_name})`);
        } catch (err) {
            console.error(`[ReminderJob] Failed to send email for reminder #${reminder.id}:`, err.message);
        }
    }
}

function startReminderEmailJob() {
    // Запускається щохвилини
    cron.schedule('* * * * *', () => {
        const now = new Date();
        const hh  = String(now.getHours()).padStart(2, '0');
        const mm  = String(now.getMinutes()).padStart(2, '0');
        processReminders(`${hh}:${mm}`);
    });

    console.log('[ReminderJob] Started — checking every minute');
}

module.exports = { startReminderEmailJob };
