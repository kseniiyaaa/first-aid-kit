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
                        <img src="/src/img/bell.svg" alt="MediKit Bell" className="icon" />
                        <h4>Refill Reminders</h4>
                        <p>
                            Receive notifications when it’s time to refill your
                            prescriptions, keeping you on track.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
