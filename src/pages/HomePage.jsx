import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';
import ItemCard from '../components/item-card/ItemCard.jsx';
import { useAuth } from '../context/AuthProvider.jsx';
import { authFetch } from '../utils/api.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
};

/** Returns a YYYY-MM-DD string for the current local day */
function localTodayStr() {
    const n = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

/** Normalises any date value (ISO string or Date) to a YYYY-MM-DD string */
function toDateStr(val) {
    if (!val) return '';
    const s = typeof val === 'string' ? val : new Date(val).toISOString();
    return s.slice(0, 10);
}

/** Advances a date by one recurrence step */
function advanceByRecurrence(date, recurrence) {
    const d = new Date(date);
    if      (recurrence === 'daily')           d.setDate(d.getDate() + 1);
    else if (recurrence === 'every_other_day') d.setDate(d.getDate() + 2);
    else if (recurrence === 'weekly')          d.setDate(d.getDate() + 7);
    else if (recurrence === 'monthly')         d.setMonth(d.getMonth() + 1);
    return d;
}

/** Returns the first occurrence >= the start of today */
function getNextOccurrence(remindAt, recurrence) {
    const remind = new Date(remindAt);
    if (recurrence === 'none') return remind;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let candidate = new Date(remind);
    while (candidate < todayStart) {
        candidate = advanceByRecurrence(candidate, recurrence);
    }
    return candidate;
}

/**
 * Generates occurrences for the home page:
 * - one-time: shown if remind_at >= today
 * - recurring: shown ONLY if there is a scheduled occurrence TODAY
 *   (not future days), and only if end_date has not passed
 */
function generateOccurrences(reminder) {
    const todayStr    = localTodayStr();
    const todayStart  = new Date(); todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    if (reminder.recurrence === 'none') {
        const remindDateStr = toDateStr(reminder.remind_at);
        if (remindDateStr < todayStr) return [];
        return [{ ...reminder, occurrenceDate: new Date(reminder.remind_at) }];
    }

    if (reminder.end_date) {
        const endStr = toDateStr(reminder.end_date);
        if (endStr < todayStr) return [];
    }

    // Recurring: show only if there is a scheduled occurrence today
    const nextOcc = getNextOccurrence(reminder.remind_at, reminder.recurrence);
    if (nextOcc >= todayStart && nextOcc < tomorrowStart) {
        return [{ ...reminder, occurrenceDate: nextOcc }];
    }
    return [];
}

function formatReminderTime(date) {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const timeStr = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    if (date.toDateString() === now.toDateString())       return `Today, ${timeStr}`;
    if (date.toDateString() === tomorrow.toDateString())  return `Tomorrow, ${timeStr}`;
    return (
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${timeStr}`
    );
}

export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [medicines,       setMedicines]       = useState([]);
    const [medicinesLoaded, setMedicinesLoaded] = useState(false);
    const [reminders,       setReminders]       = useState([]);
    const [remindersLoaded, setRemindersLoaded] = useState(false);

    useEffect(() => {
        authFetch('/api/medicines')
            .then((res) => res.json())
            .then((data) => setMedicines(Array.isArray(data) ? data : []))
            .catch(() => setMedicines([]))
            .finally(() => setMedicinesLoaded(true));
    }, []);

    useEffect(() => {
        authFetch('/api/reminders')
            .then((res) => res.json())
            .then((data) => setReminders(Array.isArray(data) ? data : []))
            .catch(() => setReminders([]))
            .finally(() => setRemindersLoaded(true));
    }, []);

    const toggleReminder = useCallback(async (id, currentTakenToday) => {
        // Optimistic update
        setReminders((prev) =>
            prev.map((r) => (r.id === id ? { ...r, taken_today: !currentTakenToday } : r))
        );
        try {
            const res = await authFetch(`/api/reminders/${id}/taken`, { method: 'PATCH' });
            if (!res.ok) throw new Error();
            const { reminder: updated, medicine } = await res.json();
            setReminders((prev) =>
                prev.map((r) => (r.id === id ? { ...r, taken_today: updated.taken_today } : r))
            );
            if (medicine) {
                setMedicines((prev) =>
                    prev.map((m) => (m.id === medicine.id ? { ...m, quantity: medicine.quantity } : m))
                );
            }
        } catch {
            // Revert optimistic update
            setReminders((prev) =>
                prev.map((r) => (r.id === id ? { ...r, taken_today: currentTakenToday } : r))
            );
        }
    }, []);

    // ── Derived ──────────────────────────────────────────────────────────────

    const todayStr   = localTodayStr();
    const todayDate  = new Date();
    const expiryLimitStr = new Date(todayDate.getTime() + THIRTY_DAYS_MS)
        .toISOString()
        .split('T')[0];

    const lowStockItems = medicines
        .filter((m) => m.quantity != null && m.quantity <= 5)
        .map((m) => ({
            type: 'stock',
            name: m.name,
            subtitle: `${m.quantity} ${m.unit || 'units'} remaining`,
        }));

    const expiringSoonItems = medicines
        .filter((m) => m.expiration_date && m.expiration_date <= expiryLimitStr)
        .map((m) => ({
            type: 'expiring',
            name: m.name,
            dateOrTime: formatDate(m.expiration_date),
        }));

    // Active (non-archived) reminder count for Kit Summary
    const activeReminderCount = reminders.filter((r) => {
        if (r.recurrence === 'none') return toDateStr(r.remind_at) >= todayStr;
        if (r.end_date)              return toDateStr(r.end_date)  >= todayStr;
        return true; // повторюване без end_date — завжди активне
    }).length;

    // Today's occurrences (max 5)
    const upcomingOccurrences = reminders
        .flatMap((r) => generateOccurrences(r))
        .sort((a, b) => a.occurrenceDate - b.occurrenceDate)
        .slice(0, 5);

    return (
        <div className="medikit-container">
            <main className="main-content">
                <h1 className="page-title">
                    {user?.fullName ? `${user.fullName}'s MediKit` : 'My MediKit'}
                </h1>

                <section className="quick-actions">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="action-buttons">
                        <button
                            className="btn btn-primary btn-rounded"
                            onClick={() => navigate('/add')}
                        >
                            Add Item
                        </button>
                        <button
                            className="btn btn-secondary btn-rounded"
                            onClick={() => navigate('/add/reminder')}
                        >
                            Set Reminder
                        </button>
                    </div>
                </section>

                <section className="kit-summary">
                    <div className="section-header">
                        <h2 className="section-title">Kit Summary</h2>
                        <button className="btn btn-view-kit" onClick={() => navigate('/kit')}>
                            View kit
                        </button>
                    </div>
                    <div className="summary-cards">
                        <div className="summary-card">
                            <div className="card-label">Total Items</div>
                            <div className="card-value">{medicinesLoaded ? medicines.length : '…'}</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Upcoming Reminders</div>
                            <div className="card-value">
                                {remindersLoaded ? activeReminderCount : '…'}
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Low Stock</div>
                            <div className="card-value">{medicinesLoaded ? lowStockItems.length : '…'}</div>
                        </div>
                    </div>
                </section>

                <section className="upcoming-reminders">
                    <h2 className="section-title">Upcoming Reminders</h2>
                    <div className="reminder-list">
                        {!remindersLoaded ? (
                            <p className="section-empty-state">Loading…</p>
                        ) : upcomingOccurrences.length === 0 ? (
                            <p className="section-empty-state">No reminders for today.</p>
                        ) : (
                            upcomingOccurrences.map((r) => {
                                const isDone = !!r.taken_today;
                                return (
                                    <ItemCard
                                        key={`${r.id}-${r.occurrenceDate.toISOString()}`}
                                        data={{
                                            type: 'reminder',
                                            name: r.medicine_name,
                                            subtitle: r.note || '',
                                            dateOrTime: formatReminderTime(r.occurrenceDate),
                                        }}
                                        isDone={isDone}
                                        onToggle={() => toggleReminder(r.id, isDone)}
                                    />
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="low-stock">
                    <h2 className="section-title">Low Stock</h2>
                    <div className="stock-list">
                        {!medicinesLoaded ? (
                            <p className="section-empty-state">Loading…</p>
                        ) : lowStockItems.length === 0 ? (
                            <p className="section-empty-state">No low stock medicines in your kit.</p>
                        ) : (
                            lowStockItems.map((item, i) => <ItemCard key={i} data={item} />)
                        )}
                    </div>
                </section>

                <section className="expiration-soon">
                    <h2 className="section-title">Expiring Soon</h2>
                    <div className="expire-list">
                        {!medicinesLoaded ? (
                            <p className="section-empty-state">Loading…</p>
                        ) : expiringSoonItems.length === 0 ? (
                            <p className="section-empty-state">
                                No medicines expiring in the next 30 days.
                            </p>
                        ) : (
                            expiringSoonItems.map((item, i) => <ItemCard key={i} data={item} />)
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
