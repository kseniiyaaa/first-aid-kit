import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, CheckCircle } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import { displayUnit } from '../utils/units.js';
import '../styles/LogIntakePage.css';

let nextUid = 1;
const makeRow = () => ({ uid: nextUid++, medicineId: '', amount: '' });

export default function LogIntakePage() {
    const navigate = useNavigate();

    const [medicines, setMedicines] = useState([]);
    const [rows,      setRows]      = useState([makeRow()]);
    const [errors,    setErrors]    = useState({}); // { uid: message }
    const [serverError, setServerError] = useState('');
    const [isLoading,   setIsLoading]   = useState(false);
    const [results,     setResults]     = useState(null); // success state

    useEffect(() => {
        authFetch('/api/medicines')
            .then((r) => r.json())
            .then((data) => {
                // Only medicines with quantity tracking
                const tracked = Array.isArray(data)
                    ? data.filter((m) => m.quantity != null)
                    : [];
                setMedicines(tracked);
            })
            .catch(() => setMedicines([]));
    }, []);

    const selectedIds = rows.map((r) => r.medicineId).filter(Boolean);

    const updateRow = (uid, field, value) => {
        setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, [field]: value } : r)));
        setErrors((prev) => { const next = { ...prev }; delete next[uid]; return next; });
    };

    const addRow = () => setRows((prev) => [...prev, makeRow()]);

    const removeRow = (uid) => setRows((prev) => prev.filter((r) => r.uid !== uid));

    const validate = () => {
        const errs = {};
        rows.forEach((r) => {
            if (!r.medicineId) {
                errs[r.uid] = 'Оберіть ліки';
            } else if (!r.amount || Number(r.amount) <= 0) {
                errs[r.uid] = 'Введіть коректну кількість';
            }
        });
        return errs;
    };

    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        setServerError('');
        setIsLoading(true);

        const items = rows.map((r) => ({
            medicine_id: Number(r.medicineId),
            amount:      Number(r.amount),
        }));

        try {
            const res  = await authFetch('/api/medicines/intake', {
                method: 'POST',
                body:   JSON.stringify({ items }),
            });
            const data = await res.json();
            if (!res.ok) { setServerError(data.error || 'Щось пішло не так'); return; }

            // Build result rows enriched with the amount deducted
            const deductedById = Object.fromEntries(
                rows.map((r) => [Number(r.medicineId), Number(r.amount)])
            );
            setResults(
                data.map((m) => ({
                    ...m,
                    deducted: deductedById[m.id] ?? 0,
                }))
            );
        } catch {
            setServerError('Помилка мережі. Спробуйте ще раз.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (results) {
        return (
            <div className="log-intake-container">
                <div className="log-intake-success">
                    <CheckCircle size={48} className="log-intake-success-icon" />
                    <h2 className="log-intake-success-title">Запас оновлено!</h2>
                    <ul className="log-intake-success-list">
                        {results.map((m) => (
                            <li key={m.id} className="log-intake-success-item">
                                <span className="log-intake-success-name">{m.name}</span>
                                <span className="log-intake-success-detail">
                                    −{m.deducted} {displayUnit(m.unit)} &nbsp;·&nbsp; {m.quantity} {displayUnit(m.unit)} залишилось
                                </span>
                            </li>
                        ))}
                    </ul>
                    <button
                        className="log-intake-done-btn"
                        onClick={() => navigate('/home')}
                    >
                        Готово
                    </button>
                </div>
            </div>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────
    return (
        <div className="log-intake-container">
            <h1 className="log-intake-title">Зафіксувати прийом</h1>
            <p className="log-intake-subtitle">
                Зафіксуйте ліки, прийняті поза розкладом нагадувань. Запас буде оновлено автоматично.
            </p>

            {medicines.length === 0 ? (
                <p className="log-intake-empty">
                    У вашій аптечці немає ліків з відстеженням кількості.{' '}
                    <button className="log-intake-link" onClick={() => navigate('/add')}>
                        Додати ліки
                    </button>
                </p>
            ) : (
                <div className="log-intake-form">
                    {rows.map((row, idx) => {
                        const med = medicines.find((m) => String(m.id) === row.medicineId);
                        // Filter out already-selected medicines from other rows
                        const available = medicines.filter(
                            (m) => !selectedIds.includes(String(m.id)) || String(m.id) === row.medicineId
                        );

                        return (
                            <div key={row.uid} className="log-intake-row">
                                <div className="log-intake-row-header">
                                    <span className="log-intake-row-label">Ліки {idx + 1}</span>
                                    {rows.length > 1 && (
                                        <button
                                            className="log-intake-remove-btn"
                                            onClick={() => removeRow(row.uid)}
                                            aria-label="Видалити рядок"
                                        >
                                            <X size={15} />
                                        </button>
                                    )}
                                </div>

                                <select
                                    className={`log-intake-select${errors[row.uid] && !row.medicineId ? ' log-intake-input--invalid' : ''}`}
                                    value={row.medicineId}
                                    onChange={(e) => updateRow(row.uid, 'medicineId', e.target.value)}
                                    disabled={isLoading}
                                >
                                    <option value="">— Оберіть ліки —</option>
                                    {available.map((m) => (
                                        <option key={m.id} value={String(m.id)}>
                                            {m.name}{m.quantity != null ? ` (${m.quantity} ${displayUnit(m.unit)} в наявності)` : ''}
                                        </option>
                                    ))}
                                </select>

                                <div className="log-intake-amount-row">
                                    <input
                                        className={`log-intake-amount-input${errors[row.uid] && row.medicineId && (!row.amount || Number(row.amount) <= 0) ? ' log-intake-input--invalid' : ''}`}
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        placeholder="Прийнята кількість"
                                        value={row.amount}
                                        onChange={(e) => updateRow(row.uid, 'amount', e.target.value)}
                                        disabled={isLoading}
                                    />
                                    {med?.unit && (
                                        <span className="log-intake-unit">{displayUnit(med.unit)}</span>
                                    )}
                                </div>

                                {errors[row.uid] && (
                                    <span className="log-intake-field-error">{errors[row.uid]}</span>
                                )}
                            </div>
                        );
                    })}

                    {/* Add another medicine — hidden when all medicines are already selected */}
                    {selectedIds.length < medicines.length && (
                        <button
                            className="log-intake-add-row-btn"
                            onClick={addRow}
                            disabled={isLoading}
                        >
                            <Plus size={15} />
                            Додати ще ліки
                        </button>
                    )}

                    {serverError && (
                        <div className="log-intake-server-error">{serverError}</div>
                    )}

                    <div className="log-intake-actions">
                        <button
                            className="log-intake-submit-btn"
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Збереження…' : 'Підтвердити прийом'}
                        </button>
                        <button
                            className="log-intake-cancel-btn"
                            onClick={() => navigate('/home')}
                            disabled={isLoading}
                        >
                            Скасувати
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
