import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import '../styles/AuthPage.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = () => {
        login();
        navigate('/home');
    };

    return (
        <div className="auth-page">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Welcome to MediKit</h2>

                <div className="auth-input-field">
                    <input className="auth-input" type="text" placeholder="Username or Email" />
                </div>
                <div className="auth-input-field">
                    <input className="auth-input" type="password" placeholder="Password" />
                </div>

                <div className="auth-input-field">
                    <button className="auth-submit-button" onClick={handleLogin}>
                        Log In
                    </button>
                </div>

                <div className="auth-link-row">
                    <button className="auth-link-button">Forgot password?</button>
                </div>

                <div className="auth-input-field">
                    <button className="auth-ghost-button" onClick={() => navigate('/signup')}>
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}
