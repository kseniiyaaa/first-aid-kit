import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

    const [medicine, setMedicine] = useState(null);
    const [form, setForm] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
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

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Medicine name is required';
        if (form.quantity !== '' && (isNaN(Number(form.quantity)) || Number(form.quantity) < 0)) {
            errs.quantity = 'Quantity must be a positive number';
        }
        return errs;
    };

    const handleEdit = () => {
        setForm(dataToForm(medicine));
        setErrors({});
        setServerError('');
        setSaveSuccess(false);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setForm(dataToForm(medicine));
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
                }),
            });
            const data = await res.json();
            if (!res.ok) { setServerError(data.error || 'Failed to save changes'); return; }
            setMedicine(data);
            setForm(dataToForm(data));
            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch {
            setServerError('Network error. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="pill-page-loading">Loading…</div>;
    if (!medicine || !form) return null;

    const quantityDisplay = medicine.quantity != null
        ? `${medicine.quantity} ${medicine.unit || ''}`.trim()
        : null;

    return (
        <div className="pill-page-container">
            <div className="pill-back-row">
                <button className="pill-back-button" onClick={() => navigate('/kit')}>← Kit</button>
            </div>

            {/* Title */}
            {isEditing ? (
                <div className="pill-title-field">
                    <input
                        className={`pill-title-input${errors.name ? ' pill-form-input--invalid' : ''}`}
                        value={form.name}
                        onChange={set('name')}
                        disabled={isSaving}
                        placeholder="Medicine name"
                    />
                    {errors.name && <span className="pill-form-field-error">{errors.name}</span>}
                </div>
            ) : (
                <h1 className="pill-page-title">{medicine.name}</h1>
            )}

            {/* Details */}
            <h2 className="pill-section-title">Details</h2>
            <div className="pill-details-card">
                {isEditing ? (
                    <>
                        <div className="pill-detail-row">
                            <span className="pill-detail-label">Purpose</span>
                            <input className="pill-detail-input" value={form.purpose} onChange={set('purpose')} placeholder="e.g., Pain relief" disabled={isSaving} />
                        </div>
                        <div className="pill-detail-row">
                            <span className="pill-detail-label">Dosage</span>
                            <input className="pill-detail-input" value={form.dosage} onChange={set('dosage')} placeholder="e.g., 500mg, 1 tablet" disabled={isSaving} />
                        </div>
                        <div className="pill-detail-row pill-detail-row--quantity">
                            <span className="pill-detail-label">Quantity</span>
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
                            <span className="pill-detail-label">Expiration</span>
                            <input className="pill-detail-input" type="date" value={form.expiration_date} onChange={set('expiration_date')} disabled={isSaving} />
                        </div>
                    </>
                ) : (
                    <>
                        <DetailRow label="Purpose"    value={medicine.purpose} />
                        <DetailRow label="Dosage"     value={medicine.dosage} />
                        <DetailRow label="Quantity"   value={quantityDisplay} />
                        <DetailRow label="Expiration" value={formatDate(medicine.expiration_date)} />
                    </>
                )}
            </div>

            {/* Instructions */}
            <h2 className="pill-section-title">Instructions</h2>
            {isEditing ? (
                <textarea
                    className="pill-instructions-textarea"
                    value={form.instructions}
                    onChange={set('instructions')}
                    placeholder="e.g., Take 1 tablet every 4–6 hours as needed."
                    rows={4}
                    disabled={isSaving}
                />
            ) : (
                <p className="pill-instructions-text">
                    {medicine.instructions || 'No instructions provided.'}
                </p>
            )}

            {serverError && <div className="pill-server-error">{serverError}</div>}
            {saveSuccess && <div className="pill-save-success">Changes saved successfully</div>}

            {/* Actions */}
            <div className="pill-actions">
                {isEditing ? (
                    <>
                        <button className="pill-save-button" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button className="pill-cancel-button" onClick={handleCancel} disabled={isSaving}>
                            Cancel
                        </button>
                    </>
                ) : (
                    <button className="pill-edit-button" onClick={handleEdit}>Edit</button>
                )}
            </div>
        </div>
    );
}
