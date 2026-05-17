import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, X } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import '../styles/PillPage.css';

const UNITS = ['tablets', 'capsules', 'ml', 'mg', 'g', 'drops', 'patches', 'tubes', 'ampoules'];

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
};

const dataToForm = (m) => ({
    name:            m.name || '',
    purpose:         m.purpose || '',
    dosage:          m.dosage || '',
    quantity:        m.quantity != null ? String(m.quantity) : '',
    unit:            m.unit || 'tablets',
    expiration_date: m.expiration_date || '',
    instructions:    m.instructions || '',
});

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

function DetailRow({ label, value }) {
    return (
        <div className="pill-detail-row">
            <span className="pill-detail-label">{label}</span>
            <span className="pill-detail-value">{value || '—'}</span>
        </div>
    );
}

export default function PillPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [medicine,    setMedicine]    = useState(null);
    const [form,        setForm]        = useState(null);
    const [photo,       setPhoto]       = useState(null); // base64 or null (edit state)
    const [photoError,  setPhotoError]  = useState('');
    const [isEditing,   setIsEditing]   = useState(false);
    const [isLoading,   setIsLoading]   = useState(true);
    const [isSaving,    setIsSaving]    = useState(false);
    const [errors,      setErrors]      = useState({});
    const [serverError, setServerError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        authFetch(`/api/medicines/${id}`)
            .then((res) => {
                if (!res.ok) { navigate('/kit'); return null; }
                return res.json();
            })
            .then((data) => {
                if (!data) return;
                setMedicine(data);
                setForm(dataToForm(data));
            })
            .catch(() => navigate('/kit'))
            .finally(() => setIsLoading(false));
    }, [id]);

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setPhotoError('Будь ласка, виберіть файл зображення'); return; }
        if (file.size > 10 * 1024 * 1024)    { setPhotoError('Зображення має бути менше 10 МБ'); return; }
        setPhotoError('');
        try {
            setPhoto(await resizeImage(file));
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

    const handleEdit = () => {
        setForm(dataToForm(medicine));
        setPhoto(medicine.photo || null);
        setErrors({});
        setServerError('');
        setPhotoError('');
        setSaveSuccess(false);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setForm(dataToForm(medicine));
        setPhoto(null);
        setErrors({});
        setServerError('');
        setIsEditing(false);
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setErrors({});
        setIsSaving(true);
        setServerError('');

        try {
            const res = await authFetch(`/api/medicines/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...form,
                    quantity:        form.quantity !== '' ? Number(form.quantity) : null,
                    expiration_date: form.expiration_date || null,
                    photo:           photo ?? null,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setServerError(data.error || 'Помилка збереження змін'); return; }
            setMedicine(data);
            setForm(dataToForm(data));
            setPhoto(null);
            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch {
            setServerError('Помилка мережі. Спробуйте ще раз.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="pill-page-loading">Завантаження…</div>;
    if (!medicine || !form) return null;

    const quantityDisplay = medicine.quantity != null
        ? `${medicine.quantity} ${medicine.unit || ''}`.trim()
        : null;

    // In edit mode: `photo` state holds the new value (may equal medicine.photo or be changed/null)
    const editPhoto = isEditing ? photo : medicine.photo;

    return (
        <div className="pill-page-container">
            <div className="pill-back-row">
                <button className="pill-back-button" onClick={() => navigate('/kit')}>← Аптечка</button>
            </div>

            {/* Photo */}
            {(editPhoto || isEditing) && (
                <div className="pill-page-photo-section">
                    {editPhoto ? (
                        <div className="pill-photo-preview-wrapper">
                            <img src={editPhoto} alt={medicine.name} className="pill-page-photo" />
                            {isEditing && (
                                <>
                                    <button
                                        type="button"
                                        className="pill-photo-remove"
                                        onClick={() => setPhoto(null)}
                                        aria-label="Видалити фото"
                                    >
                                        <X size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        className="pill-photo-change-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSaving}
                                    >
                                        Змінити фото
                                    </button>
                                </>
                            )}
                        </div>
                    ) : isEditing ? (
                        <button
                            type="button"
                            className="pill-photo-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSaving}
                        >
                            <ImagePlus size={18} />
                            Додати фото
                        </button>
                    ) : null}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                    />
                    {photoError && <span className="pill-form-field-error">{photoError}</span>}
                </div>
            )}

            {/* Title */}
            {isEditing ? (
                <div className="pill-title-field">
                    <input
                        className={`pill-title-input${errors.name ? ' pill-form-input--invalid' : ''}`}
                        value={form.name}
                        onChange={set('name')}
                        disabled={isSaving}
                        placeholder="Назва ліків"
                    />
                    {errors.name && <span className="pill-form-field-error">{errors.name}</span>}
                </div>
            ) : (
                <h1 className="pill-page-title">{medicine.name}</h1>
            )}

            {/* Details */}
            <h2 className="pill-section-title">Деталі</h2>
            <div className="pill-details-card">
                {isEditing ? (
                    <>
                        <div className="pill-detail-row">
                            <span className="pill-detail-label">Призначення</span>
                            <input className="pill-detail-input" value={form.purpose} onChange={set('purpose')} placeholder="напр., Знеболення" disabled={isSaving} />
                        </div>
                        <div className="pill-detail-row">
                            <span className="pill-detail-label">Дозування</span>
                            <input className="pill-detail-input" value={form.dosage} onChange={set('dosage')} placeholder="напр., 500мг, 1 таблетка" disabled={isSaving} />
                        </div>
                        <div className="pill-detail-row pill-detail-row--quantity">
                            <span className="pill-detail-label">Кількість</span>
                            <div className="pill-quantity-inputs">
                                <input
                                    className={`pill-detail-input pill-detail-input--short${errors.quantity ? ' pill-form-input--invalid' : ''}`}
                                    type="number"
                                    min="0"
                                    value={form.quantity}
                                    onChange={set('quantity')}
                                    placeholder="0"
                                    disabled={isSaving}
                                />
                                <select className="pill-detail-select" value={form.unit} onChange={set('unit')} disabled={isSaving}>
                                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            {errors.quantity && <span className="pill-form-field-error">{errors.quantity}</span>}
                        </div>
                        <div className="pill-detail-row">
                            <span className="pill-detail-label">Термін придатності</span>
                            <input className="pill-detail-input" type="date" value={form.expiration_date} onChange={set('expiration_date')} disabled={isSaving} />
                        </div>
                    </>
                ) : (
                    <>
                        <DetailRow label="Призначення"       value={medicine.purpose} />
                        <DetailRow label="Дозування"         value={medicine.dosage} />
                        <DetailRow label="Кількість"         value={quantityDisplay} />
                        <DetailRow label="Термін придатності" value={formatDate(medicine.expiration_date)} />
                    </>
                )}
            </div>

            {/* Instructions */}
            <h2 className="pill-section-title">Інструкції</h2>
            {isEditing ? (
                <textarea
                    className="pill-instructions-textarea"
                    value={form.instructions}
                    onChange={set('instructions')}
                    placeholder="напр., Приймати 1 таблетку кожні 4–6 годин за потреби."
                    rows={4}
                    disabled={isSaving}
                />
            ) : (
                <p className="pill-instructions-text">
                    {medicine.instructions || 'Інструкції не вказані.'}
                </p>
            )}

            {serverError && <div className="pill-server-error">{serverError}</div>}
            {saveSuccess && <div className="pill-save-success">Зміни збережено</div>}

            {/* Actions */}
            <div className="pill-actions">
                {isEditing ? (
                    <>
                        <button className="pill-save-button" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Збереження…' : 'Зберегти'}
                        </button>
                        <button className="pill-cancel-button" onClick={handleCancel} disabled={isSaving}>
                            Скасувати
                        </button>
                    </>
                ) : (
                    <button className="pill-edit-button" onClick={handleEdit}>Редагувати</button>
                )}
            </div>
        </div>
    );
}
