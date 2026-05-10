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
            setNameError('Name must be at least 2 characters');
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
                setNameFeedback({ error: '', success: 'Name updated successfully' });
            }
        } catch {
            setNameFeedback({ error: 'Network error. Please try again.', success: '' });
        } finally {
            setNameLoading(false);
        }
    };

    // ── Change Email (sends verification to new address) ────
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleChangeEmail = async () => {
        if (!emailValue.trim() || !EMAIL_REGEX.test(emailValue)) {
            setEmailError('Enter a valid email address');
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
            setEmailFeedback({ error: 'Network error. Please try again.', success: '' });
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
                    setEmailFeedback({ error: '', success: 'Your email is already verified.' });
                } else {
                    setEmailFeedback({ error: data.error, success: '' });
                }
            } else {
                setEmailFeedback({ error: '', success: data.message });
            }
        } catch {
            setEmailFeedback({ error: 'Network error. Please try again.', success: '' });
        } finally {
            setResendLoading(false);
        }
    };

    // ── Change Password ─────────────────────────────────────
    const validatePassword = () => {
        const errs = {};
        if (!currentPassword) errs.current = 'Current password is required';
        if (!newPassword) errs.new = 'New password is required';
        else if (newPassword.length < 8) errs.new = 'Password must be at least 8 characters';
        if (!confirmPassword) errs.confirm = 'Please confirm your new password';
        else if (newPassword !== confirmPassword) errs.confirm = 'Passwords do not match';
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
                setPasswordFeedback({ error: '', success: 'Password updated successfully' });
            }
        } catch {
            setPasswordFeedback({ error: 'Network error. Please try again.', success: '' });
        } finally {
            setPasswordLoading(false);
        }
    };

    // ── Logout ──────────────────────────────────────────────
    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <div className="account-page-container">
            <h1 className="account-page-title">Account Settings</h1>

            {/* Profile header */}
            <div className="account-profile-header">
                {/*<div className="account-avatar" />*/}
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
                <h2 className="account-section-title">Profile</h2>
                <div className="account-input-field">
                    <label className="account-input-label">Name</label>
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
                        {nameLoading ? 'Saving…' : 'Change Name'}
                    </button>
                    <SectionFeedback {...nameFeedback} />
                </div>
            </section>

            {/* ── Email ── */}
            <section className="account-section">
                <h2 className="account-section-title">Email</h2>

                {/* Current email + verified badge */}
                <div className="account-current-email-row">
                    <span className="account-current-email-label">Current:</span>
                    <span className="account-current-email-value">{user?.email ?? '—'}</span>
                    {user?.emailVerified
                        ? <span className="account-email-badge account-email-badge--verified">Verified</span>
                        : <span className="account-email-badge account-email-badge--unverified">Not verified</span>
                    }
                </div>

                {/* Resend verification if not verified */}
                {!user?.emailVerified && (
                    <div className="account-unverified-notice">
                        Check your inbox for the verification email, or{' '}
                        <button
                            className="account-resend-link"
                            onClick={handleResendVerification}
                            disabled={resendLoading}
                        >
                            {resendLoading ? 'Sending…' : 'resend it'}
                        </button>.
                    </div>
                )}

                {/* Change email form */}
                <div className="account-input-field" style={{ marginTop: '12px' }}>
                    <label className="account-input-label">New email address</label>
                    <input
                        className={`account-input${emailError ? ' account-input--invalid' : ''}`}
                        type="email"
                        placeholder="Enter new email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        disabled={emailLoading}
                    />
                    {emailError && <span className="account-field-error">{emailError}</span>}
                </div>
                <div className="account-action-row">
                    <button className="account-change-button" onClick={handleChangeEmail} disabled={emailLoading}>
                        {emailLoading ? 'Sending…' : 'Change Email'}
                    </button>
                    <SectionFeedback {...emailFeedback} />
                </div>
            </section>

            {/* ── Security (password) ── */}
            <section className="account-section">
                <h2 className="account-section-title">Security</h2>

                <div className="account-input-field">
                    <label className="account-input-label">Current Password</label>
                    <div className="account-password-wrapper">
                        <input
                            className={`account-input${passwordErrors.current ? ' account-input--invalid' : ''}`}
                            type={showCurrentPwd ? 'text' : 'password'}
                            placeholder="Enter current password"
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
                    <label className="account-input-label">New Password</label>
                    <div className="account-password-wrapper">
                        <input
                            className={`account-input${passwordErrors.new ? ' account-input--invalid' : ''}`}
                            type={showNewPwd ? 'text' : 'password'}
                            placeholder="Min. 8 characters"
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
                    <label className="account-input-label">Confirm New Password</label>
                    <div className="account-password-wrapper">
                        <input
                            className={`account-input${passwordErrors.confirm ? ' account-input--invalid' : ''}`}
                            type={showConfirmPwd ? 'text' : 'password'}
                            placeholder="Repeat new password"
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
                        {passwordLoading ? 'Saving…' : 'Change Password'}
                    </button>
                    <SectionFeedback {...passwordFeedback} />
                </div>
            </section>

            {/* ── Session ── */}
            <section className="account-section">
                <h2 className="account-section-title">Session</h2>
                <div className="account-action-row">
                    <button className="account-logout-button" onClick={handleLogout}>Logout</button>
                </div>
            </section>
        </div>
    );
}
