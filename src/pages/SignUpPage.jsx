import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthProvider.jsx';
import '../styles/AuthPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!fullName.trim()) {
            newErrors.fullName = 'Ім\'я обов\'язкове';
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = 'Ім\'я має містити щонайменше 2 символи';
        }
        if (!email.trim()) {
            newErrors.email = 'Email обов\'язковий';
        } else if (!EMAIL_REGEX.test(email)) {
            newErrors.email = 'Введіть дійсну адресу email';
        }
        if (!password) {
            newErrors.password = 'Пароль обов\'язковий';
        } else if (password.length < 8) {
            newErrors.password = 'Пароль має містити щонайменше 8 символів';
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Підтвердіть пароль';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Паролі не збігаються';
        }
        return newErrors;
    };

    const handleSignUp = async () => {
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        setServerError('');
        setErrors({});

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || 'Помилка реєстрації. Спробуйте ще раз.');
                return;
            }

            login(data.token, data.user);
            navigate('/home');
        } catch {
            setServerError('Помилка мережі. Перевірте з\'єднання.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Створити акаунт</h2>

                <div className="auth-input-field">
                    <input
                        className={`auth-input${errors.fullName ? ' auth-input--invalid' : ''}`}
                        type="text"
                        placeholder="Повне ім'я"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading}
                    />
                    {errors.fullName && <span className="auth-field-error">{errors.fullName}</span>}
                </div>

                <div className="auth-input-field">
                    <input
                        className={`auth-input${errors.email ? ' auth-input--invalid' : ''}`}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    {errors.email && <span className="auth-field-error">{errors.email}</span>}
                </div>

                <div className="auth-input-field">
                    <div className="auth-password-wrapper">
                        <input
                            className={`auth-input${errors.password ? ' auth-input--invalid' : ''}`}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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

                <div className="auth-input-field">
                    <div className="auth-password-wrapper">
                        <input
                            className={`auth-input${errors.confirmPassword ? ' auth-input--invalid' : ''}`}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Підтвердіть пароль"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="auth-password-toggle"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
                </div>

                {serverError && (
                    <div className="auth-server-error">{serverError}</div>
                )}

                <div className="auth-input-field">
                    <button
                        className="auth-submit-button"
                        onClick={handleSignUp}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Створення акаунту…' : 'Зареєструватись'}
                    </button>
                </div>

                <div className="auth-link-row">
                    Вже є акаунт?{' '}
                    <button
                        className="auth-link-button"
                        onClick={() => navigate('/login')}
                        disabled={isLoading}
                    >
                        Увійти
                    </button>
                </div>
            </div>
        </div>
    );
}
