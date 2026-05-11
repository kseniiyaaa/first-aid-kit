import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/api.js';
import '../styles/AddPillPage.css';

const RECURRENCE_OPTIONS = [
    { value: 'none',            label: 'Does not repeat' },
    { value: 'daily',           label: 'Every day' },
    { value: 'every_other_day', label: 'Every other day (Mon/Wed/Fri pattern)' },
    { value: 'weekly',          label: 'Every week' },
    { value: 'monthly',         label: 'Every month' },
];

export default function AddReminderPage() {
    const navigate = useNavigate();

    const [medicines,          setMedicines]          = useState([]);
    const [selectedMedicineId, setSelectedMedicineId] = useState('');
    const [customName,         setCustomName]         = useState('');
    const [date,               setDate]               = useState('');
    const [time,               setTime]               = useState('');
    const [endDate,            setEndDate]            = useState('');
    const [note,               setNote]               = useState('');
    const [recurrence,         setRecurrence]         = useState('none');
    const [errors,             setErrors]             = useState({});
    const [serverError,        setServerError]        = useState('');
    const [isLoading,          setIsLoading]          = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        authFetch('/api/medicines')
            .then((res) => res.json())
            .then((data) => setMedicines(Array.isArray(data) ? data : []))
            .catch(() => setMedicines([]));
    }, []);

    const isCustom = selectedMedicineId === '__custom__';
    const selectedMedicine = medicines.find((m) => String(m.id) === selectedMedicineId);
    const isRecurring = recurrence !== 'none';

    const validate = () => {
        const errs = {};
        if (!selectedMedicineId) {
            errs.medicine = 'Please select a medicine';
        } else if (isCustom && !customName.trim()) {
            errs.medicine = 'Please enter a medicine name';
        }
        if (!date) errs.date = 'Please select a date';
        if (!time) errs.time = 'Please select a time';
        if (isRecurring && endDate && endDate < date) {
            errs.endDate = 'End date must be on or after the start date';
        }
        return errs;
    };

    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        setIsLoading(true);
        setServerError('');

        const medicine_name = isCustom ? customName.trim() : selectedMedicine.name;
        const medicine_id   = isCustom ? null : Number(selectedMedicineId);
        const remind_at     = `${date}T${time}:00`;

        try {
            const res = await authFetch('/api/reminders', {
                method: 'POST',
                body: JSON.stringify({
                    medicine_id,
                    medicine_name,
                    note:     note.trim() || null,
                    remind_at,
                    recurrence,
                    end_date: isRecurring && endDate ? endDate : null,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setServerError(data.error || 'Failed to save reminder'); return; }
            navigate('/home');
        } catch {
            setServerError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="add-pill-container">
            <h1 className="add-pill-title">Set Reminder</h1>

            <div className="pill-form">
                {/* Medicine */}
                <div className="pill-form-field">
                    <label className="pill-form-label">
                        Medicine <span className="pill-form-required">*</span>
                    </label>
                    <select
                        className={`pill-form-select${errors.medicine ? ' pill-form-input--invalid' : ''}`}
                        value={selectedMedicineId}
                        onChange={(e) => { setSelectedMedicineId(e.target.value); setCustomName(''); }}
                        disabled={isLoading}
                    >
                        <option value="">— Select a medicine —</option>
                        {medicines.map((m) => (
                            <option key={m.id} value={String(m.id)}>{m.name}</option>
                        ))}
                        <option value="__custom__">Other (enter name manually)</option>
                    </select>
                    {isCustom && (
                        <input
                            className={`pill-form-input${errors.medicine ? ' pill-form-input--invalid' : ''}`}
                            type="text"
                            placeholder="Medicine name"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            disabled={isLoading}
                            autoFocus
                        />
                    )}
                    {errors.medicine && <span className="pill-form-field-error">{errors.medicine}</span>}
                </div>

                {/* Date & Time */}
                <div className="pill-form-row">
                    <div className="pill-form-field">
                        <label className="pill-form-label">
                            Date <span className="pill-form-required">*</span>
                        </label>
                        <input
                            className={`pill-form-input${errors.date ? ' pill-form-input--invalid' : ''}`}
                            type="date"
                            min={today}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={isLoading}
                        />
                        {errors.date && <span className="pill-form-field-error">{errors.date}</span>}
                    </div>
                    <div className="pill-form-field">
                        <label className="pill-form-label">
                            Time <span className="pill-form-required">*</span>
                        </label>
                        <input
                            className={`pill-form-input${errors.time ? ' pill-form-input--invalid' : ''}`}
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            disabled={isLoading}
                        />
                        {errors.time && <span className="pill-form-field-error">{errors.time}</span>}
                    </div>
                </div>

                {/* Recurrence */}
                <div className="pill-form-field">
                    <label className="pill-form-label">Repeat</label>
                    <select
                        className="pill-form-select"
                        value={recurrence}
                        onChange={(e) => {
                            setRecurrence(e.target.value);
                            if (e.target.value === 'none') setEndDate('');
                        }}
                        disabled={isLoading}
                    >
                        {RECURRENCE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* End date — лише для recurring */}
                {isRecurring && (
                    <div className="pill-form-field">
                        <label className="pill-form-label">
                            End date <span className="pill-form-optional">(optional)</span>
                        </label>
                        <input
                            className={`pill-form-input${errors.endDate ? ' pill-form-input--invalid' : ''}`}
                            type="date"
                            min={date || today}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={isLoading}
                        />
                        {errors.endDate && <span className="pill-form-field-error">{errors.endDate}</span>}
                    </div>
                )}

                {/* Note */}
                <div className="pill-form-field">
                    <label className="pill-form-label">Note</label>
                    <textarea
                        className="pill-form-textarea"
                        placeholder="e.g., Take with food, Apply to affected area"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={isLoading}
                        rows={3}
                    />
                </div>

                {serverError && <div className="pill-form-server-error">{serverError}</div>}

                <div className="pill-form-actions">
                    <button
                        className="pill-form-submit-button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving…' : 'Set Reminder'}
                    </button>
                    <button
                        className="pill-form-cancel-button"
                        onClick={() => navigate('/home')}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
