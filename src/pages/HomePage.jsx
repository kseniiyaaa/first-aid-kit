import { useState } from 'react';
import '../styles/HomePage.css';
import ItemCard from "../components/item-card/ItemCard.jsx";

export default function HomePage() {
    const [takenReminders, setTakenReminders] = useState({});

    const toggleReminder = (name) => {
        setTakenReminders(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const reminders = [
        { type: 'reminder', name: 'Ibuprofen', subtitle: 'Take 1 tablet', dateOrTime: 'Today, 8:00 AM' },
        { type: 'reminder', name: 'Vitamin D', subtitle: 'Take 2 capsules', dateOrTime: 'Tomorrow, 9:00 AM' },
        { type: 'reminder', name: 'Hydrocortisone Cream', subtitle: 'Apply to affected area', dateOrTime: 'In 2 days, 10:00 AM' },
    ];

    const lowStock = [
        { type: 'stock', name: 'Acetaminophen', subtitle: '5 tablets remaining', buttonText: 'Reorder' },
        { type: 'stock', name: 'Antihistamine', subtitle: '2 capsules remaining', buttonText: 'Reorder' },
        { type: 'stock', name: 'Antibiotic Ointment', subtitle: '1 tube remaining', buttonText: 'Reorder' },
    ];

    const expiringSoon = [
        { type: 'expiring', name: 'Affida', dateOrTime: '15.08.2025' },
        { type: 'expiring', name: 'Betaferon', dateOrTime: '25.08.2025' },
        { type: 'expiring', name: 'Fanigan', dateOrTime: '27.08.2025' },
    ];

    return (
        <div className="medikit-container">
            <main className="main-content">
                <h1 className="page-title">Kseniia's MediKit</h1>

                <section className="quick-actions">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="action-buttons">
                        <button className="btn btn-primary btn-rounded">Add Item</button>
                        <button className="btn btn-secondary btn-rounded">Set Reminder</button>
                    </div>
                </section>

                <section className="kit-summary">
                    <div className="section-header">
                        <h2 className="section-title">Kit Summary</h2>
                        <button className="btn btn-view-kit">View kit</button>
                    </div>
                    <div className="summary-cards">
                        <div className="summary-card">
                            <div className="card-label">Total Items</div>
                            <div className="card-value">25</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Upcoming Reminders</div>
                            <div className="card-value">3</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Low Stock</div>
                            <div className="card-value">5</div>
                        </div>
                    </div>
                </section>

                <section className="upcoming-reminders">
                    <h2 className="section-title">Upcoming Reminders</h2>
                    <div className="reminder-list">
                        {reminders.map((item, i) => (
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
                        {lowStock.map((item, i) => (
                            <ItemCard key={i} data={item} />
                        ))}
                    </div>
                </section>

                <section className="expiration-soon">
                    <h2 className="section-title">Expiring soon</h2>
                    <div className="expire-list">
                        {expiringSoon.map((item, i) => (
                            <ItemCard key={i} data={item} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
