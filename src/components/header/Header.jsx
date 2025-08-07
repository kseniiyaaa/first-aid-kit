import { Search, Bell, Brain, UserRound } from 'lucide-react';
import './Header.css';

export default function Header({ isLoggedIn = false }) {
    return (
        <header className="header">
            <div className="logo">
                <img src="/src/img/logo.svg" alt="MediKit Logo" className="logo-image" />
                MediKit
            </div>

            {isLoggedIn ? (
                // Header for logged in users (HomePage)
                <div className="header-icons">
                    <div className="search-icon"><Search className="icon" size={window.innerWidth < 768 ? 20 : 24} /></div>
                    <div className="notification-icon"><Bell className="icon" size={window.innerWidth < 768 ? 20 : 24} /></div>
                    <div className="ai-icon"><Brain className="icon" size={window.innerWidth < 768 ? 20 : 24} /></div>
                    <div className="profile-icon"><UserRound className="icon" size={window.innerWidth < 768 ? 20 : 24} /></div>
                </div>
            ) : (
                // Header for welcome page (not logged in)
                <div className="auth-buttons">
                    <button className="login">Login</button>
                    <button className="signup">Sign Up</button>
                </div>
            )}
        </header>
    );
}
