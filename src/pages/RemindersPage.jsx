import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Pencil, Trash2 } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import '../styles/RemindersPage.css';

const RECURRENCE_LABELS = {
    none:            'Does not repeat',
    daily:           'Every day',
    every_other_day: 'Every other day',
    weekly:          'Every week',
    monthly:         'Every month',
};

/** Returns a YYYY-MM-DD string for the current local day */
function localTodayStr() {
    const n = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

/** Normalises any date value to a YYYY-MM-DD string */
function toDateStr(val) {
    if (!val) return '';
    const s = typeof val === 'string' ? val : new Date(val).toISOString();
    return s.slice(0, 10);
}

/** Formats a date as DD.MM.YYYY */
function toDMY(val) {
    const s = toDateStr(val);
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}.${m}.${y}`;
}

/** Formats the time portion of a remind_at value */
function timeOf(remindAt) {
    return new Date(remindAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

/** Builds the metadata string displayed on a reminder row */
function reminderMeta(r, isArchive) {
    const time  = timeOf(r.remind_at);
    const label = RECURRENCE_LABELS[r.recurrence] ?? r.recurrence;

    if (r.recurrence === 'none') {
        return `${toDMY(r.remind_at)} · ${time}`;
    }

    // Archived recurring — show full date range
    if (isArchive && r.end_date) {
        return `${label} · ${time} · ${toDMY(r.remind_at)} – ${toDMY(r.end_date)}`;
    }

    // Active recurring — label and time only
    const endStr = r.end_date ? `  (until ${toDMY(r.end_date)})` : '';
    return `${label} · ${time}${endStr}`;
}

export default function RemindersPage() {
    const navigate = useNavigate();

    const [reminders,    setReminders]    = useState([]);
    const [tab,          setTab]          = useState('active');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting,   setIsDeleting]   = useState(false);

    useEffect(() => {
        authFetch('/api/reminders')
            .then((r) => r.json())
            .then((data) => setReminders(Array.isArray(data) ? data : []))
            .catch(() => setReminders([]));
    }, []);

    const todayStr = localTodayStr();

    /**
     * A reminder is considered archived if:
     * - one-time and remind_at < today
     * - recurring and end_date is set and end_date < today
     */
    const isArchived = (r) => {
        if (r.recurrence === 'none') return toDateStr(r.remind_at) < todayStr;
        return !!r.end_date && toDateStr(r.end_date) < todayStr;
    };

    const activeReminders  = reminders.filter((r) => !isArchived(r));
    const archiveReminders = reminders.filter((r) =>  isArchived(r));

    const list = tab === 'active' ? activeReminders : archiveReminders;

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await authFetch(`/api/reminders/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                setReminders((prev) => prev.filter((r) => r.id !== deleteTarget.id));
                setDeleteTarget(null);
            }
        } catch {
            /* ignore */
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="reminders-page">
            <button className="back-btn" onClick={() => navigate('/home')}>← Home</button>
            <h1 className="reminders-title">Reminders</h1>

            {/* ── Tabs ── */}
            <div className="reminders-tabs">
                <button
                    className={`reminders-tab${tab === 'active' ? ' reminders-tab--active' : ''}`}
                    onClick={() => setTab('active')}
                >
                    Active
                </button>
                <button
                    className={`reminders-tab${tab === 'archive' ? ' reminders-tab--active' : ''}`}
                    onClick={() => setTab('archive')}
                >
                    Archive
                </button>
            </div>

            {/* ── List ── */}
            <div className="reminders-list">
                {list.length === 0 ? (
                    <p className="reminders-empty">
                        {tab === 'active'
                            ? 'No active reminders. Tap "Set Reminder" on the home page to add one.'
                            : 'No archived reminders yet.'}
                    </p>
                ) : (
                    list.map((r) => (
                        <div
                            key={r.id}
                            className={`reminders-row${tab === 'archive' ? ' reminders-row--archive' : ''}`}
                        >
                            <div className="reminders-row-icon">
                                <Bell size={20} />
                            </div>

                            <div className="reminders-row-info">
                                <div className="reminders-row-name">{r.medicine_name}</div>
                                <div className="reminders-row-meta">
                                    {reminderMeta(r, tab === 'archive')}
                                </div>
                                {r.note && (
                                    <div className="reminders-row-note">{r.note}</div>
                                )}
                            </div>

                            <div className="reminders-row-actions">
                                {tab === 'active' && (
                                    <button
                                        className="reminders-action-btn"
                                        title="Edit reminder"
                                        onClick={() => navigate(`/reminders/${r.id}/edit`)}
                                    >
                                        <Pencil size={15} />
                                    </button>
                                )}
                                <button
                                    className="reminders-action-btn reminders-action-btn--delete"
                                    title="Delete reminder"
                                    onClick={() => setDeleteTarget(r)}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Delete confirmation modal ── */}
            {deleteTarget && (
                <div
                    className="reminders-modal-overlay"
                    onClick={() => !isDeleting && setDeleteTarget(null)}
                >
                    <div className="reminders-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete reminder?</h3>
                        <p>
                            Are you sure you want to delete the reminder for{' '}
                            <strong>{deleteTarget.medicine_name}</strong>? This action cannot be
                            undone.
                        </p>
                        <div className="reminders-modal-actions">
                            <button
                                className="reminders-modal-delete"
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting…' : 'Yes, delete'}
                            </button>
                            <button
                                className="reminders-modal-cancel"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
