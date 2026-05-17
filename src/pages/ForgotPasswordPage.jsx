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
            setEmailError('Email обов\'язковий');
            return;
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            setEmailError('Введіть дійсну адресу email');
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
                setServerError(data.error || 'Щось пішло не так. Спробуйте ще раз.');
            } else {
                setSubmitted(true);
            }
        } catch {
            setServerError('Помилка мережі. Перевірте з\'єднання.');
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="auth-page">
                <div className="auth-form-container">
                    <h2 className="auth-form-title">Перевірте пошту</h2>
                    <p className="forgot-password-hint">
                        Якщо <strong>{email}</strong> зареєстровано, ми надіслали посилання для скидання пароля.
                        Воно дійсне 24 години.
                    </p>
                    <p className="forgot-password-hint" style={{ marginTop: 8 }}>
                        Не отримали? Перевірте папку спаму або спробуйте ще раз.
                    </p>
                    <div className="auth-input-field">
                        <button
                            className="auth-ghost-button"
                            onClick={() => { setSubmitted(false); setEmail(''); }}
                        >
                            Спробувати інший email
                        </button>
                    </div>
                    <div className="auth-link-row">
                        <button className="auth-link-button" onClick={() => navigate('/login', { state: { email } })}>
                            Назад до входу
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Забули пароль?</h2>
                <p className="forgot-password-hint">
                    Введіть email, з яким ви реєструвались, і ми надішлемо посилання для скидання пароля.
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
                        {isLoading ? 'Надсилання…' : 'Надіслати посилання'}
                    </button>
                </div>

                <div className="auth-link-row">
                    <button className="auth-link-button" onClick={() => navigate('/login', { state: { email } })}>
                        Назад до входу
                    </button>
                </div>
            </div>
        </div>
    );
}
