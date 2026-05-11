import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthProvider.jsx';
import '../styles/AuthPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    const passwordWasReset = searchParams.get('passwordReset') === '1';

    const [email, setEmail] = useState(location.state?.email ?? '');

    // Belt-and-suspenders: also set via effect in case useState initializer
    // runs before the location state is fully available (navigation timing)
    useEffect(() => {
        if (location.state?.email) setEmail(location.state.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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

                {passwordWasReset && (
                    <div className="auth-reset-success">
                        Password updated! You can now log in.
                    </div>
                )}

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
                    <div className="auth-password-wrapper">
                        <input
                            className={`auth-input${errors.password ? ' auth-input--invalid' : ''}`}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="auth-password-toggle"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
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
                    <button
                        className="auth-link-button"
                        onClick={() => navigate('/forgot-password', { state: { email } })}
                    >
                        Forgot password?
                    </button>
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
