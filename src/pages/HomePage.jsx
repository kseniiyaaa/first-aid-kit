import { Pill, TrendingDown, Siren } from 'lucide-react';
import '../styles/HomePage.css'
import Header from '../components/header/Header'

export default function HomePage() {
    return (
        <div className="medikit-container">
            <Header isLoggedIn={true} />

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
                        <div className="reminder-item">
                            <div className="reminder-icon">
                                <Pill className="pill-icon" />
                            </div>
                            <div className="reminder-details">
                                <div className="reminder-name">Ibuprofen</div>
                                <div className="reminder-instruction">Take 1 tablet</div>
                            </div>
                            <div className="reminder-time">Today, 8:00 AM</div>
                        </div>
                        <div className="reminder-item">
                            <div className="reminder-icon">
                                <Pill className="pill-icon" />
                            </div>
                            <div className="reminder-details">
                                <div className="reminder-name">Vitamin D</div>
                                <div className="reminder-instruction">Take 2 capsules</div>
                            </div>
                            <div className="reminder-time">Tomorrow, 9:00 AM</div>
                        </div>
                        <div className="reminder-item">
                            <div className="reminder-icon">
                                <Pill className="pill-icon" />
                            </div>
                            <div className="reminder-details">
                                <div className="reminder-name">Hydrocortisone Cream</div>
                                <div className="reminder-instruction">Apply to affected area</div>
                            </div>
                            <div className="reminder-time">In 2 days, 10:00 AM</div>
                        </div>
                    </div>
                </section>

                <section className="low-stock">
                    <h2 className="section-title">Low Stock</h2>
                    <div className="stock-list">
                        <div className="stock-item">
                            <div className="stock-icon">
                                <TrendingDown className="low-stock-icon" />
                            </div>
                            <div className="stock-details">
                                <div className="stock-name">Acetaminophen</div>
                                <div className="stock-quantity">5 tablets remaining</div>
                            </div>
                            <button className="reorder-btn">Reorder</button>
                        </div>
                        <div className="stock-item">
                            <div className="stock-icon">
                                <TrendingDown className="low-stock-icon" />
                            </div>
                            <div className="stock-details">
                                <div className="stock-name">Antihistamine</div>
                                <div className="stock-quantity">2 capsules remaining</div>
                            </div>
                            <button className="reorder-btn">Reorder</button>
                        </div>
                        <div className="stock-item">
                            <div className="stock-icon">
                                <TrendingDown className="low-stock-icon" />
                            </div>
                            <div className="stock-details">
                                <div className="stock-name">Antibiotic Ointment</div>
                                <div className="stock-quantity">1 tube remaining</div>
                            </div>
                            <button className="reorder-btn">Reorder</button>
                        </div>
                    </div>
                </section>

                <section className="expiration-soon">
                    <h2 className="section-title">Expiring soon</h2>
                    <div className="expire-list">
                        <div className="expiring-item">
                            <div className="expire-icon">
                                <Siren className="siren-icon" />
                            </div>
                            <div className="expire-details">
                                <div className="expire-name">Affida</div>
                            </div>
                            <div className="expiration-date">15.08.2025</div>
                        </div>
                        <div className="expiring-item">
                            <div className="expire-icon">
                                <Siren className="siren-icon" />
                            </div>
                            <div className="expire-details">
                                <div className="expire-name">Betaferon</div>
                            </div>
                            <div className="expiration-date">25.08.2025</div>
                        </div>
                        <div className="expiring-item">
                            <div className="expire-icon">
                                <Siren className="siren-icon" />
                            </div>
                            <div className="expire-details">
                                <div className="expire-name">Fanigan</div>
                            </div>
                            <div className="expiration-date">27.08.2025</div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
