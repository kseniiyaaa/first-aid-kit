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
            setTokenError('Недійсне посилання для скидання — токен не знайдено.');
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
                setTokenError('Помилка мережі. Спробуйте ще раз.');
            });

        return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const validate = () => {
        const errs = {};
        if (!newPassword) {
            errs.newPassword = 'Новий пароль обов\'язковий';
        } else if (newPassword.length < 8) {
            errs.newPassword = 'Пароль має містити щонайменше 8 символів';
        }
        if (!confirmPassword) {
            errs.confirmPassword = 'Підтвердіть пароль';
        } else if (newPassword !== confirmPassword) {
            errs.confirmPassword = 'Паролі не збігаються';
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
                setServerError(data.error || 'Щось пішло не так. Спробуйте ще раз.');
            } else {
                // Navigate to login with a success flag
                navigate('/login?passwordReset=1');
            }
        } catch {
            setServerError('Помилка мережі. Перевірте з\'єднання.');
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
                        Перевірка посилання…
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
                    <h2 className="auth-form-title">Посилання застаріло</h2>
                    <p className="forgot-password-hint">{tokenError}</p>
                    <div className="auth-input-field">
                        <button
                            className="auth-submit-button"
                            onClick={() => navigate('/forgot-password')}
                        >
                            Запросити нове посилання
                        </button>
                    </div>
                    <div className="auth-link-row">
                        <button className="auth-link-button" onClick={() => navigate('/login')}>
                            Назад до входу
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
                <h2 className="auth-form-title">Встановити новий пароль</h2>
                <p className="forgot-password-hint">
                    Оберіть надійний пароль щонайменше з 8 символів.
                </p>

                <div className="auth-input-field">
                    <div className="auth-password-wrapper">
                        <input
                            className={`auth-input${errors.newPassword ? ' auth-input--invalid' : ''}`}
                            type={showNew ? 'text' : 'password'}
                            placeholder="Новий пароль"
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
                            placeholder="Підтвердіть новий пароль"
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
                        {isLoading ? 'Збереження…' : 'Скинути пароль'}
                    </button>
                </div>
            </div>
        </div>
    );
}
