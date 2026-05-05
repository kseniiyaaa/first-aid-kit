import { Search, Bell, Brain, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { useAuth } from "../../context/AuthProvider.jsx";

export default function Header() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="header">
            <div className="logo">
                <img src="/src/img/logo.svg" alt="MediKit Logo" className="logo-image" />
                MediKit
            </div>

            {isAuthenticated ? (
                // Header for logged in users (HomePage)
                <div className="header-icons">
                    <div className="search-icon"><Search className="icon" size={window.innerWidth < 768 ? 20 : 24} /></div>
                    <div className="notification-icon"><Bell className="icon" size={window.innerWidth < 768 ? 20 : 24} /></div>
                    {/*<div className="ai-icon"><Brain className="icon" size={window.innerWidth < 768 ? 20 : 24} /></div>*/}
                    <div className="profile-icon" onClick={() => navigate('/account')} style={{ cursor: 'pointer' }}>
                        <UserRound className="icon" size={window.innerWidth < 768 ? 20 : 24} />
                    </div>
                </div>
            ) : (
                // Header for welcome page (not logged in)
                <div className="auth-buttons">
                    <button className="login" onClick={() => navigate('/login')}>Login</button>
                    <button className="signup" onClick={() => navigate('/signup')}>Sign Up</button>
                </div>
            )}
        </header>
    );
}
