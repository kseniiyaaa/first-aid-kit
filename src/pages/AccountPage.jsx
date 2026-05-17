import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CircleCheck } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAuth } from '../context/AuthProvider.jsx';
import '../styles/AccountPage.css';

function SectionFeedback({ error, success }) {
    if (error)   return <span className="account-section-feedback account-section-feedback--error">{error}</span>;
    if (success) return <span className="account-section-feedback account-section-feedback--success">{success}</span>;
    return null;
}

export default function AccountPage() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    // Sync user state from server on every mount — handles the case where
    // email was verified in another tab or the localStorage/context got out of sync.
    useEffect(() => {
        const token = Cookies.get('authToken');
        if (!token) return;
        fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (data && data.id) {
                    updateUser({
                        fullName:      data.fullName,
                        email:         data.email,
                        emailVerified: data.emailVerified,
                    });
                }
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Profile (name) ──────────────────────────────────────
    const [nameValue,    setNameValue]    = useState(user?.fullName ?? '');
    const [nameError,    setNameError]    = useState('');
    const [nameLoading,  setNameLoading]  = useState(false);
    const [nameFeedback, setNameFeedback] = useState({ error: '', success: '' });

    // ── Email ───────────────────────────────────────────────
    const [emailValue,    setEmailValue]    = useState('');
    const [emailError,    setEmailError]    = useState('');
    const [emailLoading,  setEmailLoading]  = useState(false);
    const [emailFeedback, setEmailFeedback] = useState({ error: '', success: '' });
    const [resendLoading, setResendLoading] = useState(false);

    // ── Password ────────────────────────────────────────────
    const [currentPassword,  setCurrentPassword]  = useState('');
    const [newPassword,      setNewPassword]      = useState('');
    const [confirmPassword,  setConfirmPassword]  = useState('');
    const [showCurrentPwd,   setShowCurrentPwd]   = useState(false);
    const [showNewPwd,       setShowNewPwd]       = useState(false);
    const [showConfirmPwd,   setShowConfirmPwd]   = useState(false);
    const [passwordErrors,   setPasswordErrors]   = useState({});
    const [passwordLoading,  setPasswordLoading]  = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState({ error: '', success: '' });

    const authHeader = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('authToken') ?? ''}`,
    });

    // ── Change Name ─────────────────────────────────────────
    const handleChangeName = async () => {
        if (!nameValue.trim() || nameValue.trim().length < 2) {
            setNameError('Ім\'я має містити щонайменше 2 символи');
            return;
        }
        setNameError('');
        setNameLoading(true);
        setNameFeedback({ error: '', success: '' });

        try {
            const res  = await fetch('/api/users/name', { method: 'PUT', headers: authHeader(), body: JSON.stringify({ fullName: nameValue }) });
            const data = await res.json();
            if (!res.ok) {
                setNameFeedback({ error: data.error, success: '' });
            } else {
                updateUser({ fullName: data.fullName });
                setNameFeedback({ error: '', success: 'Ім\'я успішно оновлено' });
            }
        } catch {
            setNameFeedback({ error: 'Помилка мережі. Спробуйте ще раз.', success: '' });
        } finally {
            setNameLoading(false);
        }
    };

    // ── Change Email (sends verification to new address) ────
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleChangeEmail = async () => {
        if (!emailValue.trim() || !EMAIL_REGEX.test(emailValue)) {
            setEmailError('Введіть дійсну адресу email');
            return;
        }
        setEmailError('');
        setEmailLoading(true);
        setEmailFeedback({ error: '', success: '' });

        try {
            const res  = await fetch('/api/users/email', { method: 'PUT', headers: authHeader(), body: JSON.stringify({ email: emailValue }) });
            const data = await res.json();
            if (!res.ok) {
                setEmailFeedback({ error: data.error, success: '' });
            } else {
                setEmailValue('');
                setEmailFeedback({ error: '', success: data.message });
            }
        } catch {
            setEmailFeedback({ error: 'Помилка мережі. Спробуйте ще раз.', success: '' });
        } finally {
            setEmailLoading(false);
        }
    };

    // ── Resend verification email ────────────────────────────
    const handleResendVerification = async () => {
        setResendLoading(true);
        setEmailFeedback({ error: '', success: '' });

        try {
            const res  = await fetch('/api/auth/resend-verification', { method: 'POST', headers: authHeader() });
            const data = await res.json();
            if (!res.ok) {
                // If the server says already verified, the DB is ahead of our local state —
                // sync it so the UI reflects reality
                if (data.error === 'Email is already verified') {
                    updateUser({ emailVerified: true });
                    setEmailFeedback({ error: '', success: 'Ваш email вже підтверджений.' });
                } else {
                    setEmailFeedback({ error: data.error, success: '' });
                }
            } else {
                setEmailFeedback({ error: '', success: data.message });
            }
        } catch {
            setEmailFeedback({ error: 'Помилка мережі. Спробуйте ще раз.', success: '' });
        } finally {
            setResendLoading(false);
        }
    };

    // ── Change Password ─────────────────────────────────────
    const validatePassword = () => {
        const errs = {};
        if (!currentPassword) errs.current = 'Поточний пароль обов\'язковий';
        if (!newPassword) errs.new = 'Новий пароль обов\'язковий';
        else if (newPassword.length < 8) errs.new = 'Пароль має містити щонайменше 8 символів';
        if (!confirmPassword) errs.confirm = 'Підтвердіть новий пароль';
        else if (newPassword !== confirmPassword) errs.confirm = 'Паролі не збігаються';
        return errs;
    };

    const handleChangePassword = async () => {
        const errs = validatePassword();
        if (Object.keys(errs).length > 0) { setPasswordErrors(errs); return; }
        setPasswordErrors({});
        setPasswordLoading(true);
        setPasswordFeedback({ error: '', success: '' });

        try {
            const res  = await fetch('/api/users/password', { method: 'PUT', headers: authHeader(), body: JSON.stringify({ currentPassword, newPassword }) });
            const data = await res.json();
            if (!res.ok) {
                setPasswordFeedback({ error: data.error, success: '' });
            } else {
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                setPasswordFeedback({ error: '', success: 'Пароль успішно оновлено' });
            }
        } catch {
            setPasswordFeedback({ error: 'Помилка мережі. Спробуйте ще раз.', success: '' });
        } finally {
            setPasswordLoading(false);
        }
    };

    // ── Logout ──────────────────────────────────────────────
    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <div className="account-page-container">
            <button className="back-btn" onClick={() => navigate('/home')}>← Головна</button>
            <h1 className="account-page-title">Налаштування акаунту</h1>

            {/* Profile header */}
            <div className="account-profile-header">
                <div className="account-display-name">{user?.fullName ?? '—'}</div>
                <div className="account-user-email">
                    <span>{user?.email ?? '—'}</span>
                    {user?.emailVerified && (
                        <CircleCheck className="account-email-verified-icon" size={16} />
                    )}
                </div>
            </div>

            {/* ── Profile ── */}
            <section className="account-section">
                <h2 className="account-section-title">Профіль</h2>
                <div className="account-input-field">
                    <label className="account-input-label">Ім'я</label>
                    <input
                        className={`account-input${nameError ? ' account-input--invalid' : ''}`}
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        disabled={nameLoading}
                    />
                    {nameError && <span className="account-field-error">{nameError}</span>}
                </div>
                <div className="account-action-row">
                    <button className="account-change-button" onClick={handleChangeName} disabled={nameLoading}>
                        {nameLoading ? 'Збереження…' : 'Змінити ім\'я'}
                    </button>
                    <SectionFeedback {...nameFeedback} />
                </div>
            </section>

            {/* ── Email ── */}
            <section className="account-section">
                <h2 className="account-section-title">Email</h2>

                {/* Current email + verified badge */}
                <div className="account-current-email-row">
                    <span className="account-current-email-label">Поточний:</span>
                    <span className="account-current-email-value">{user?.email ?? '—'}</span>
                    {user?.emailVerified
                        ? <span className="account-email-badge account-email-badge--verified">Підтверджений</span>
                        : <span className="account-email-badge account-email-badge--unverified">Не підтверджений</span>
                    }
                </div>

                {/* Resend verification if not verified */}
                {!user?.emailVerified && (
                    <div className="account-unverified-notice">
                        Перевірте вашу поштову скриньку або{' '}
                        <button
                            className="account-resend-link"
                            onClick={handleResendVerification}
                            disabled={resendLoading}
                        >
                            {resendLoading ? 'Надсилання…' : 'надішліть повторно'}
                        </button>.
                    </div>
                )}

                {/* Change email form */}
                <div className="account-input-field" style={{ marginTop: '12px' }}>
                    <label className="account-input-label">Нова адреса email</label>
                    <input
                        className={`account-input${emailError ? ' account-input--invalid' : ''}`}
                        type="email"
                        placeholder="Введіть новий email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        disabled={emailLoading}
                    />
                    {emailError && <span className="account-field-error">{emailError}</span>}
                </div>
                <div className="account-action-row">
                    <button className="account-change-button" onClick={handleChangeEmail} disabled={emailLoading}>
                        {emailLoading ? 'Надсилання…' : 'Змінити email'}
                    </button>
                    <SectionFeedback {...emailFeedback} />
                </div>
            </section>

            {/* ── Security (password) ── */}
            <section className="account-section">
                <h2 className="account-section-title">Безпека</h2>

                <div className="account-input-field">
                    <label className="account-input-label">Поточний пароль</label>
                    <div className="account-password-wrapper">
                        <input
                            className={`account-input${passwordErrors.current ? ' account-input--invalid' : ''}`}
                            type={showCurrentPwd ? 'text' : 'password'}
                            placeholder="Введіть поточний пароль"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={passwordLoading}
                        />
                        <button className="account-password-toggle" type="button" onClick={() => setShowCurrentPwd((v) => !v)} tabIndex={-1}>
                            {showCurrentPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {passwordErrors.current && <span className="account-field-error">{passwordErrors.current}</span>}
                </div>

                <div className="account-input-field">
                    <label className="account-input-label">Новий пароль</label>
                    <div className="account-password-wrapper">
                        <input
                            className={`account-input${passwordErrors.new ? ' account-input--invalid' : ''}`}
                            type={showNewPwd ? 'text' : 'password'}
                            placeholder="Мін. 8 символів"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={passwordLoading}
                        />
                        <button className="account-password-toggle" type="button" onClick={() => setShowNewPwd((v) => !v)} tabIndex={-1}>
                            {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {passwordErrors.new && <span className="account-field-error">{passwordErrors.new}</span>}
                </div>

                <div className="account-input-field">
                    <label className="account-input-label">Підтвердіть новий пароль</label>
                    <div className="account-password-wrapper">
                        <input
                            className={`account-input${passwordErrors.confirm ? ' account-input--invalid' : ''}`}
                            type={showConfirmPwd ? 'text' : 'password'}
                            placeholder="Повторіть новий пароль"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={passwordLoading}
                        />
                        <button className="account-password-toggle" type="button" onClick={() => setShowConfirmPwd((v) => !v)} tabIndex={-1}>
                            {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {passwordErrors.confirm && <span className="account-field-error">{passwordErrors.confirm}</span>}
                </div>

                <div className="account-action-row">
                    <button className="account-change-button" onClick={handleChangePassword} disabled={passwordLoading}>
                        {passwordLoading ? 'Збереження…' : 'Змінити пароль'}
                    </button>
                    <SectionFeedback {...passwordFeedback} />
                </div>
            </section>

            {/* ── Session ── */}
            <section className="account-section">
                <h2 className="account-section-title">Сесія</h2>
                <div className="account-action-row">
                    <button className="account-logout-button" onClick={handleLogout}>Вийти</button>
                </div>
            </section>
        </div>
    );
}
