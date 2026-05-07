import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import '../styles/AuthPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!EMAIL_REGEX.test(email)) {
            newErrors.email = 'Enter a valid email address';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        return newErrors;
    };

    const handleLogin = async () => {
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        setServerError('');
        setErrors({});

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || 'Login failed. Please try again.');
                return;
            }

            login(data.token, data.user);
            navigate('/home');
        } catch {
            setServerError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <div className="auth-page">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Welcome to MediKit</h2>

                <div className="auth-input-field">
                    <input
                        className={`auth-input${errors.email ? ' auth-input--invalid' : ''}`}
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    {errors.email && <span className="auth-field-error">{errors.email}</span>}
                </div>

                <div className="auth-input-field">
                    <input
                        className={`auth-input${errors.password ? ' auth-input--invalid' : ''}`}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    {errors.password && <span className="auth-field-error">{errors.password}</span>}
                </div>

                {serverError && (
                    <div className="auth-server-error">{serverError}</div>
                )}

                <div className="auth-input-field">
                    <button
                        className="auth-submit-button"
                        onClick={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in…' : 'Log In'}
                    </button>
                </div>

                <div className="auth-link-row">
                    <button className="auth-link-button">Forgot password?</button>
                </div>

                <div className="auth-input-field">
                    <button
                        className="auth-ghost-button"
                        onClick={() => navigate('/signup')}
                        disabled={isLoading}
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}
