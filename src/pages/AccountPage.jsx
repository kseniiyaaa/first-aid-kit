import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import '../styles/AccountPage.css';

export default function AccountPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="account-page-container">
            <h1 className="account-page-title">Account Settings</h1>

            <div className="account-profile-header">
                <div className="account-avatar" />
                <div className="account-display-name">Kseniia</div>
                <div className="account-user-email">kseniia@medikit.app</div>
            </div>

            <section className="account-section">
                <h2 className="account-section-title">Profile</h2>
                <div className="account-input-field">
                    <label className="account-input-label">Name</label>
                    <input className="account-input" type="text" defaultValue="Kseniia" />
                </div>
                <div className="account-action-row">
                    <button className="account-change-button">Change Name</button>
                </div>
            </section>

            <section className="account-section">
                <h2 className="account-section-title">Security</h2>
                <div className="account-input-field">
                    <label className="account-input-label">Password</label>
                    <input className="account-input" type="password" defaultValue="password" />
                </div>
                <div className="account-action-row">
                    <button className="account-change-button">Change Password</button>
                </div>
            </section>

            <section className="account-section">
                <h2 className="account-section-title">Session</h2>
                <div className="account-action-row">
                    <button className="account-logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </section>
        </div>
    );
}
