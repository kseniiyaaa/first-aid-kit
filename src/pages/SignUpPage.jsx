import { useNavigate } from 'react-router-dom';
import '../styles/AuthPage.css';

export default function SignUpPage() {
    const navigate = useNavigate();

    return (
        <div className="auth-page">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Create your account</h2>

                <div className="auth-input-field">
                    <input className="auth-input" type="text" placeholder="Full Name" />
                </div>
                <div className="auth-input-field">
                    <input className="auth-input" type="email" placeholder="Email" />
                </div>
                <div className="auth-input-field">
                    <input className="auth-input" type="password" placeholder="Password" />
                </div>
                <div className="auth-input-field">
                    <input className="auth-input" type="password" placeholder="Confirm Password" />
                </div>

                <div className="auth-input-field">
                    <button className="auth-submit-button" onClick={() => navigate('/home')}>
                        Sign Up
                    </button>
                </div>

                <div className="auth-link-row">
                    Already have an account?{' '}
                    <button className="auth-link-button" onClick={() => navigate('/login')}>
                        Log In
                    </button>
                </div>
            </div>
        </div>
    );
}
