import '../styles/WelcomePage.css'
import heroImage from '../img/main-img.jpg'

export default function WelcomePage() {
    return (
        <div className="welcome-page">
            <section className="hero">
                <img src={heroImage} alt="Medicine" className="hero-image" />
                <div className="hero-text">
                    <h1>Ласкаво просимо до MediKit</h1>
                    <p>
                        Ваша особиста система управління домашньою аптечкою.
                    </p>
                </div>
            </section>

            <section className="features">
                <h2 className="features-title">Ключові можливості</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <img src="/src/img/pill.svg" alt="MediKit Pill" className="icon" />
                        <h4>Облік медикаментів</h4>
                        <p>
                            Легко додавайте та керуйте своїми ліками, включаючи
                            інформацію про дозування та дати поповнення запасів.
                        </p>
                    </div>
                    <div className="feature-card">
                        <img src="/src/img/calendar.svg" alt="MediKit Calendar" className="icon" />
                        <h4>Розклад прийому</h4>
                        <p>
                            Налаштовуйте нагадування про прийом ліків, щоб
                            ніколи не пропускати дозу.
                        </p>
                    </div>
                    <div className="feature-card">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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
                        <h4>Сповіщення про терміни та запаси</h4>
                        <p>
                            Будьте в курсі ліків зі спливаючим терміном придатності та
                            низьким запасом — аптечка завжди показує, що потребує уваги.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
