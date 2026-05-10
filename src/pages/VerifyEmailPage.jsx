import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthProvider.jsx';
import '../styles/VerifyEmailPage.css';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const token = searchParams.get('token');

    // 'loading' | 'success' | 'error'
    const [status, setStatus]   = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link — no token found.');
            return;
        }

        // AbortController cancels the first fetch when React StrictMode
        // unmounts + remounts the component in development (double-effect).
        // In production only one effect runs so this has no overhead.
        const controller = new AbortController();

        fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
            signal: controller.signal,
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    setStatus('error');
                    setMessage(data.error);
                } else {
                    setStatus('success');
                    setMessage(data.message);

                    // Write to localStorage directly — AuthProvider may not have
                    // finished initialising yet in this tab (new-tab timing issue),
                    // so `user` from context could still be null here.
                    try {
                        const raw = localStorage.getItem('medikit_user');
                        if (raw) {
                            const patch = { emailVerified: true };
                            if (data.email) patch.email = data.email;
                            const updated = { ...JSON.parse(raw), ...patch };
                            localStorage.setItem('medikit_user', JSON.stringify(updated));
                            // Also update React context if user is already loaded
                            if (user) updateUser(patch);
                        }
                    } catch {}
                }
            })
            .catch((err) => {
                // Ignore cancellation from StrictMode cleanup
                if (err.name === 'AbortError') return;
                setStatus('error');
                setMessage('Network error. Please check your connection and try again.');
            });

        return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="verify-email-page">
            <div className="verify-email-card">
                {status === 'loading' && (
                    <>
                        <LoaderCircle className="verify-email-icon verify-email-icon--spin" size={48} />
                        <h2 className="verify-email-title">Verifying…</h2>
                        <p className="verify-email-subtitle">Please wait a moment.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CircleCheck className="verify-email-icon verify-email-icon--success" size={52} />
                        <h2 className="verify-email-title">All done!</h2>
                        <p className="verify-email-subtitle">{message}</p>
                        <button
                            className="verify-email-button"
                            onClick={() => {
                                // If this tab was opened from another window, go back there
                                if (window.opener && !window.opener.closed) {
                                    window.opener.location.href = user ? '/account' : '/login';
                                    window.close();
                                } else {
                                    navigate(user ? '/account' : '/login');
                                }
                            }}
                        >
                            {user ? 'Go to Account' : 'Log In'}
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <CircleX className="verify-email-icon verify-email-icon--error" size={52} />
                        <h2 className="verify-email-title">Verification failed</h2>
                        <p className="verify-email-subtitle">{message}</p>
                        <button
                            className="verify-email-button verify-email-button--secondary"
                            onClick={() => navigate(user ? '/account' : '/login')}
                        >
                            {user ? 'Back to Account' : 'Go to Login'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
