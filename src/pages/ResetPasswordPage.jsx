import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/AuthPage.css';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    // Token validation state
    const [tokenStatus, setTokenStatus] = useState('loading'); // 'loading' | 'valid' | 'invalid'
    const [tokenError,  setTokenError]  = useState('');

    // Form state
    const [newPassword,     setNewPassword]     = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew,         setShowNew]         = useState(false);
    const [showConfirm,     setShowConfirm]     = useState(false);
    const [errors,          setErrors]          = useState({});
    const [isLoading,       setIsLoading]       = useState(false);
    const [serverError,     setServerError]     = useState('');

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setTokenStatus('invalid');
            setTokenError('Invalid reset link — no token found.');
            return;
        }

        const controller = new AbortController();

        fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
            signal: controller.signal,
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    setTokenStatus('invalid');
                    setTokenError(data.error);
                } else {
                    setTokenStatus('valid');
                }
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setTokenStatus('invalid');
                setTokenError('Network error. Please try again.');
            });

        return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const validate = () => {
        const errs = {};
        if (!newPassword) {
            errs.newPassword = 'New password is required';
        } else if (newPassword.length < 8) {
            errs.newPassword = 'Password must be at least 8 characters';
        }
        if (!confirmPassword) {
            errs.confirmPassword = 'Please confirm your password';
        } else if (newPassword !== confirmPassword) {
            errs.confirmPassword = 'Passwords do not match';
        }
        return errs;
    };

    const handleReset = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        setIsLoading(true);
        setServerError('');

        try {
            const res  = await fetch('/api/auth/reset-password', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ token, newPassword }),
            });
            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || 'Something went wrong. Please try again.');
            } else {
                // Navigate to login with a success flag
                navigate('/login?passwordReset=1');
            }
        } catch {
            setServerError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (tokenStatus === 'loading') {
        return (
            <div className="auth-page">
                <div className="auth-form-container">
                    <p style={{ textAlign: 'center', color: '#4F8796', padding: '32px 0' }}>
                        Validating link…
                    </p>
                </div>
            </div>
        );
    }

    // ── Invalid / expired token ──────────────────────────────────────────────
    if (tokenStatus === 'invalid') {
        return (
            <div className="auth-page">
                <div className="auth-form-container">
                    <h2 className="auth-form-title">Link expired</h2>
                    <p className="forgot-password-hint">{tokenError}</p>
                    <div className="auth-input-field">
                        <button
                            className="auth-submit-button"
                            onClick={() => navigate('/forgot-password')}
                        >
                            Request a new link
                        </button>
                    </div>
                    <div className="auth-link-row">
                        <button className="auth-link-button" onClick={() => navigate('/login')}>
                            Back to Log In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Reset form ───────────────────────────────────────────────────────────
    return (
        <div className="auth-page">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Set new password</h2>
                <p className="forgot-password-hint">
                    Choose a strong password with at least 8 characters.
                </p>

                <div className="auth-input-field">
                    <div className="auth-password-wrapper">
                        <input
                            className={`auth-input${errors.newPassword ? ' auth-input--invalid' : ''}`}
                            type={showNew ? 'text' : 'password'}
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            autoFocus
                        />
                        <button
                            type="button"
                            className="auth-password-toggle"
                            onClick={() => setShowNew((v) => !v)}
                            tabIndex={-1}
                        >
                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.newPassword && (
                        <span className="auth-field-error">{errors.newPassword}</span>
                    )}
                </div>

                <div className="auth-input-field">
                    <div className="auth-password-wrapper">
                        <input
                            className={`auth-input${errors.confirmPassword ? ' auth-input--invalid' : ''}`}
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="auth-password-toggle"
                            onClick={() => setShowConfirm((v) => !v)}
                            tabIndex={-1}
                        >
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <span className="auth-field-error">{errors.confirmPassword}</span>
                    )}
                </div>

                {serverError && <div className="auth-server-error">{serverError}</div>}

                <div className="auth-input-field">
                    <button
                        className="auth-submit-button"
                        onClick={handleReset}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving…' : 'Reset Password'}
                    </button>
                </div>
            </div>
        </div>
    );
}
