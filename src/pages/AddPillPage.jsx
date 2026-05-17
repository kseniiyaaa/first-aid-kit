import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImagePlus, X } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import { UNITS } from '../utils/units.js';
import '../styles/AddPillPage.css';

/** Resizes an image File to at most maxPx on its longest side, returns a base64 JPEG string */
function resizeImage(file, maxPx = 900) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let { width, height } = img;
                if (width > maxPx || height > maxPx) {
                    if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx; }
                    else                 { width = Math.round(width * maxPx / height);  height = maxPx; }
                }
                const canvas = document.createElement('canvas');
                canvas.width  = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.82));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

export default function AddPillPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name:            searchParams.get('name')    || '',
        purpose:         searchParams.get('purpose') || '',
        dosage:          '',
        quantity:        '',
        unit:            'tablets',
        expiration_date: '',
        instructions:    '',
    });
    const [photo,        setPhoto]        = useState(null);
    const [photoError,   setPhotoError]   = useState('');
    const [errors,       setErrors]       = useState({});
    const [serverError,  setServerError]  = useState('');
    const [isLoading,    setIsLoading]    = useState(false);
    const [isPrefilled,  setIsPrefilled]  = useState(false);

    // On mount: if navigated from drug search with ?prefill=1, read sessionStorage
    useEffect(() => {
        if (searchParams.get('prefill') !== '1') return;
        const raw = sessionStorage.getItem('medikit_add_prefill');
        if (!raw) return;
        sessionStorage.removeItem('medikit_add_prefill');
        try {
            const data = JSON.parse(raw);
            setForm(prev => ({
                ...prev,
                name:         data.name         || prev.name,
                purpose:      data.purpose      || prev.purpose,
                instructions: data.instructions || prev.instructions,
                ...(data.unit ? { unit: data.unit } : {}),
            }));
            setIsPrefilled(true);
        } catch { /* ignore parse errors */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setPhotoError('Будь ласка, виберіть файл зображення');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setPhotoError('Зображення має бути менше 10 МБ');
            return;
        }
        setPhotoError('');
        try {
            const resized = await resizeImage(file);
            setPhoto(resized);
        } catch {
            setPhotoError('Не вдалося обробити зображення. Спробуйте інший файл.');
        }
        e.target.value = '';
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Назва ліків обов\'язкова';
        if (form.quantity !== '' && (isNaN(Number(form.quantity)) || Number(form.quantity) < 0)) {
            errs.quantity = 'Кількість має бути позитивним числом';
        }
        return errs;
    };

    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setErrors({});
        setIsLoading(true);
        setServerError('');

        try {
            const res = await authFetch('/api/medicines', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    quantity:        form.quantity !== '' ? Number(form.quantity) : null,
                    expiration_date: form.expiration_date || null,
                    photo:           photo || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setServerError(data.error || 'Помилка додавання ліків'); return; }
            navigate('/kit');
        } catch {
            setServerError('Помилка мережі. Спробуйте ще раз.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="add-pill-container">
            <h1 className="add-pill-title">Додати новий препарат</h1>

            {isPrefilled && (
                <div className="pill-prefill-notice">
                    Форму заповнено з бази даних — перевірте та доповніть всі поля
                </div>
            )}

            <div className="pill-form">

                {/* Photo */}
                <div className="pill-form-field">
                    <label className="pill-form-label">
                        Фото <span className="pill-form-optional">(необов'язково)</span>
                    </label>

                    {photo ? (
                        <div className="pill-photo-preview-wrapper">
                            <img src={photo} alt="Попередній перегляд" className="pill-photo-preview" />
                            <button
                                type="button"
                                className="pill-photo-remove"
                                onClick={() => setPhoto(null)}
                                aria-label="Видалити фото"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="pill-photo-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            <ImagePlus size={18} />
                            Додати фото
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                    />
                    {photoError && <span className="pill-form-field-error">{photoError}</span>}
                </div>

                {/* Name */}
                <div className="pill-form-field">
                    <label className="pill-form-label">
                        Назва <span className="pill-form-required">*</span>
                    </label>
                    <input
                        className={`pill-form-input${errors.name ? ' pill-form-input--invalid' : ''}`}
                        type="text"
                        placeholder="напр., Ібупрофен"
                        value={form.name}
                        onChange={set('name')}
                        disabled={isLoading}
                    />
                    {errors.name && <span className="pill-form-field-error">{errors.name}</span>}
                </div>

                <div className="pill-form-field">
                    <label className="pill-form-label">Призначення</label>
                    <input
                        className="pill-form-input"
                        type="text"
                        placeholder="напр., Знеболення, Алергія"
                        value={form.purpose}
                        onChange={set('purpose')}
                        disabled={isLoading}
                    />
                </div>

                <div className="pill-form-field">
                    <label className="pill-form-label">Дозування</label>
                    <input
                        className="pill-form-input"
                        type="text"
                        placeholder="напр., 500мг, 1 таблетка"
                        value={form.dosage}
                        onChange={set('dosage')}
                        disabled={isLoading}
                    />
                </div>

                <div className="pill-form-row">
                    <div className="pill-form-field">
                        <label className="pill-form-label">Кількість</label>
                        <input
                            className={`pill-form-input${errors.quantity ? ' pill-form-input--invalid' : ''}`}
                            type="number"
                            min="0"
                            placeholder="напр., 30"
                            value={form.quantity}
                            onChange={set('quantity')}
                            disabled={isLoading}
                        />
                        {errors.quantity && <span className="pill-form-field-error">{errors.quantity}</span>}
                    </div>
                    <div className="pill-form-field">
                        <label className="pill-form-label">Одиниця</label>
                        <select
                            className="pill-form-select"
                            value={form.unit}
                            onChange={set('unit')}
                            disabled={isLoading}
                        >
                            {UNITS.map((u) => (
                                <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pill-form-field">
                    <label className="pill-form-label">Термін придатності</label>
                    <input
                        className="pill-form-input"
                        type="date"
                        value={form.expiration_date}
                        onChange={set('expiration_date')}
                        disabled={isLoading}
                    />
                </div>

                <div className="pill-form-field">
                    <label className="pill-form-label">Інструкції</label>
                    <textarea
                        className="pill-form-textarea"
                        placeholder="напр., Приймати 1 таблетку кожні 4–6 годин за потреби."
                        value={form.instructions}
                        onChange={set('instructions')}
                        disabled={isLoading}
                        rows={4}
                    />
                </div>

                {serverError && <div className="pill-form-server-error">{serverError}</div>}

                <div className="pill-form-actions">
                    <button
                        className="pill-form-submit-button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Додавання…' : 'Додати ліки'}
                    </button>
                    <button
                        className="pill-form-cancel-button"
                        onClick={() => navigate('/kit')}
                        disabled={isLoading}
                    >
                        Скасувати
                    </button>
                </div>
            </div>
        </div>
    );
}
