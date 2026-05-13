import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImagePlus, X } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import '../styles/AddPillPage.css';

const UNITS = ['tablets', 'capsules', 'ml', 'mg', 'g', 'drops', 'patches', 'tubes', 'ampoules'];

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
    const [photo,       setPhoto]       = useState(null); // base64 data URL
    const [photoError,  setPhotoError]  = useState('');
    const [errors,      setErrors]      = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading,   setIsLoading]   = useState(false);

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setPhotoError('Please select an image file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setPhotoError('Image must be smaller than 10 MB');
            return;
        }
        setPhotoError('');
        try {
            const resized = await resizeImage(file);
            setPhoto(resized);
        } catch {
            setPhotoError('Failed to process image. Please try another file.');
        }
        // Reset input so the same file can be re-selected after removal
        e.target.value = '';
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Medicine name is required';
        if (form.quantity !== '' && (isNaN(Number(form.quantity)) || Number(form.quantity) < 0)) {
            errs.quantity = 'Quantity must be a positive number';
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
            if (!res.ok) { setServerError(data.error || 'Failed to add medicine'); return; }
            navigate('/kit');
        } catch {
            setServerError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="add-pill-container">
            <h1 className="add-pill-title">Add New Medicine</h1>

            <div className="pill-form">

                {/* Photo */}
                <div className="pill-form-field">
                    <label className="pill-form-label">
                        Photo <span className="pill-form-optional">(optional)</span>
                    </label>

                    {photo ? (
                        <div className="pill-photo-preview-wrapper">
                            <img src={photo} alt="Medicine preview" className="pill-photo-preview" />
                            <button
                                type="button"
                                className="pill-photo-remove"
                                onClick={() => setPhoto(null)}
                                aria-label="Remove photo"
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
                            Add photo
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
                        Name <span className="pill-form-required">*</span>
                    </label>
                    <input
                        className={`pill-form-input${errors.name ? ' pill-form-input--invalid' : ''}`}
                        type="text"
                        placeholder="e.g., Ibuprofen"
                        value={form.name}
                        onChange={set('name')}
                        disabled={isLoading}
                    />
                    {errors.name && <span className="pill-form-field-error">{errors.name}</span>}
                </div>

                <div className="pill-form-field">
                    <label className="pill-form-label">Purpose</label>
                    <input
                        className="pill-form-input"
                        type="text"
                        placeholder="e.g., Pain relief, Allergy"
                        value={form.purpose}
                        onChange={set('purpose')}
                        disabled={isLoading}
                    />
                </div>

                <div className="pill-form-field">
                    <label className="pill-form-label">Dosage</label>
                    <input
                        className="pill-form-input"
                        type="text"
                        placeholder="e.g., 500mg, 1 tablet"
                        value={form.dosage}
                        onChange={set('dosage')}
                        disabled={isLoading}
                    />
                </div>

                <div className="pill-form-row">
                    <div className="pill-form-field">
                        <label className="pill-form-label">Quantity</label>
                        <input
                            className={`pill-form-input${errors.quantity ? ' pill-form-input--invalid' : ''}`}
                            type="number"
                            min="0"
                            placeholder="e.g., 30"
                            value={form.quantity}
                            onChange={set('quantity')}
                            disabled={isLoading}
                        />
                        {errors.quantity && <span className="pill-form-field-error">{errors.quantity}</span>}
                    </div>
                    <div className="pill-form-field">
                        <label className="pill-form-label">Unit</label>
                        <select
                            className="pill-form-select"
                            value={form.unit}
                            onChange={set('unit')}
                            disabled={isLoading}
                        >
                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pill-form-field">
                    <label className="pill-form-label">Expiration Date</label>
                    <input
                        className="pill-form-input"
                        type="date"
                        value={form.expiration_date}
                        onChange={set('expiration_date')}
                        disabled={isLoading}
                    />
                </div>

                <div className="pill-form-field">
                    <label className="pill-form-label">Instructions</label>
                    <textarea
                        className="pill-form-textarea"
                        placeholder="e.g., Take 1 tablet every 4–6 hours as needed."
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
                        {isLoading ? 'Adding…' : 'Add Medicine'}
                    </button>
                    <button
                        className="pill-form-cancel-button"
                        onClick={() => navigate('/kit')}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
