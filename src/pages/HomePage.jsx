import { useState, useEffect } from 'react';
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

// hardcoded upcoming reminders (no reminders DB yet)
const REMINDERS = [
    { type: 'reminder', name: 'Ibuprofen',           subtitle: 'Take 1 tablet',          dateOrTime: 'Today, 8:00 AM' },
    { type: 'reminder', name: 'Vitamin D',            subtitle: 'Take 2 capsules',         dateOrTime: 'Tomorrow, 9:00 AM' },
    { type: 'reminder', name: 'Hydrocortisone Cream', subtitle: 'Apply to affected area',  dateOrTime: 'In 2 days, 10:00 AM' },
];

export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [medicines, setMedicines] = useState([]);
    const [medicinesLoaded, setMedicinesLoaded] = useState(false);
    const [takenReminders, setTakenReminders] = useState({});

    useEffect(() => {
        authFetch('/api/medicines')
            .then((res) => res.json())
            .then((data) => setMedicines(Array.isArray(data) ? data : []))
            .catch(() => setMedicines([]))
            .finally(() => setMedicinesLoaded(true));
    }, []);

    const toggleReminder = (name) =>
        setTakenReminders((prev) => ({ ...prev, [name]: !prev[name] }));

    // Derived data
    const todayDate = new Date();
    const expiryLimit = new Date(todayDate.getTime() + THIRTY_DAYS_MS);
    const expiryLimitStr = expiryLimit.toISOString().split('T')[0];

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

    return (
        <div className="medikit-container">
            <main className="main-content">
                <h1 className="page-title">
                    {user?.fullName ? `${user.fullName}'s MediKit` : 'My MediKit'}
                </h1>

                <section className="quick-actions">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="action-buttons">
                        <button className="btn btn-primary btn-rounded" onClick={() => navigate('/add')}>Add Item</button>
                        <button className="btn btn-secondary btn-rounded">Set Reminder</button>
                    </div>
                </section>

                <section className="kit-summary">
                    <div className="section-header">
                        <h2 className="section-title">Kit Summary</h2>
                        <button className="btn btn-view-kit" onClick={() => navigate('/kit')}>View kit</button>
                    </div>
                    <div className="summary-cards">
                        <div className="summary-card">
                            <div className="card-label">Total Items</div>
                            <div className="card-value">{medicinesLoaded ? medicines.length : '…'}</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Upcoming Reminders</div>
                            <div className="card-value">{REMINDERS.length}</div>
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
                        {REMINDERS.map((item, i) => (
                            <ItemCard
                                key={i}
                                data={item}
                                isDone={!!takenReminders[item.name]}
                                onToggle={() => toggleReminder(item.name)}
                            />
                        ))}
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
                            <p className="section-empty-state">No medicines expiring in the next 30 days.</p>
                        ) : (
                            expiringSoonItems.map((item, i) => <ItemCard key={i} data={item} />)
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
