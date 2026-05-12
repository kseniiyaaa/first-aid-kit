import '../styles/WelcomePage.css'
import heroImage from '../img/main-img.jpg'

export default function WelcomePage() {
    return (
        <div className="welcome-page">
            <section className="hero">
                <img src={heroImage} alt="Medicine" className="hero-image" />
                <div className="hero-text">
                    <h1>Welcome to MediKit</h1>
                    <p>
                        Your personal medicine kit management system.
                    </p>
                </div>
            </section>

            <section className="features">
                <h2 className="features-title">Key Features</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <img src="/src/img/pill.svg" alt="MediKit Pill" className="icon" />
                        <h4>Medication Tracking</h4>
                        <p>
                            Easily add and manage your medications, including dosage
                            information and refill dates.
                        </p>
                    </div>
                    <div className="feature-card">
                        <img src="/src/img/calendar.svg" alt="MediKit Calendar" className="icon" />
                        <h4>Dosage Scheduling</h4>
                        <p>
                            Set up reminders for your medication schedule to ensure you never
                            miss a dose.
                        </p>
                    </div>
                    <div className="feature-card">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                             className="lucide lucide-siren" aria-hidden="true">
                            <path d="M7 18v-6a5 5 0 1 1 10 0v6"></path>
                            <path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"></path>
                            <path d="M21 12h1"></path>
                            <path d="M18.5 4.5 18 5"></path>
                            <path d="M2 12h1"></path>
                            <path d="M12 2v1"></path>
                            <path d="m4.929 4.929.707.707"></path>
                            <path d="M12 12v6"></path>
                        </svg>
                        <h4>Expiry &amp; Stock Notice</h4>
                        <p>
                            Stay ahead of expired medications and low-stock items -
                            your kit always shows what needs restocking or discarding.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
