import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/AuthPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Pre-fill email passed from LoginPage
    const [email,       setEmail]       = useState(location.state?.email ?? '');
    const [emailError,  setEmailError]  = useState('');
    const [isLoading,   setIsLoading]   = useState(false);
    const [submitted,   setSubmitted]   = useState(false);
    const [serverError, setServerError] = useState('');

    const handleSubmit = async () => {
        if (!email.trim()) {
            setEmailError('Email is required');
            return;
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            setEmailError('Enter a valid email address');
            return;
        }
        setEmailError('');
        setIsLoading(true);
        setServerError('');

        try {
            const res  = await fetch('/api/auth/forgot-password', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || 'Something went wrong. Please try again.');
            } else {
                setSubmitted(true);
            }
        } catch {
            setServerError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="auth-page">
                <div className="auth-form-container">
                    <h2 className="auth-form-title">Check your inbox</h2>
                    <p className="forgot-password-hint">
                        If <strong>{email}</strong> is registered, we've sent a password reset link.
                        It expires in 24 hours.
                    </p>
                    <p className="forgot-password-hint" style={{ marginTop: 8 }}>
                        Didn't get it? Check your spam folder or try again.
                    </p>
                    <div className="auth-input-field">
                        <button
                            className="auth-ghost-button"
                            onClick={() => { setSubmitted(false); setEmail(''); }}
                        >
                            Try another email
                        </button>
                    </div>
                    <div className="auth-link-row">
                        <button className="auth-link-button" onClick={() => navigate('/login', { state: { email } })}>
                            Back to Log In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Forgot password?</h2>
                <p className="forgot-password-hint">
                    Enter the email you signed up with and we'll send you a reset link.
                </p>

                <div className="auth-input-field">
                    <input
                        className={`auth-input${emailError ? ' auth-input--invalid' : ''}`}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        disabled={isLoading}
                        autoFocus
                    />
                    {emailError && <span className="auth-field-error">{emailError}</span>}
                </div>

                {serverError && <div className="auth-server-error">{serverError}</div>}

                <div className="auth-input-field">
                    <button
                        className="auth-submit-button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending…' : 'Send Reset Link'}
                    </button>
                </div>

                <div className="auth-link-row">
                    <button className="auth-link-button" onClick={() => navigate('/login', { state: { email } })}>
                        Back to Log In
                    </button>
                </div>
            </div>
        </div>
    );
}
