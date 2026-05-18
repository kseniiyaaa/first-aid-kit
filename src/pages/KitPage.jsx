import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import { displayUnit } from '../utils/units.js';
import '../styles/KitPage.css';

const buildMeta = (m) => {
    const parts = [];
    if (m.dosage)            parts.push(m.dosage);
    if (m.quantity != null)  parts.push(`${m.quantity} ${displayUnit(m.unit)}`);
    if (m.purpose)           parts.push(m.purpose);
    return parts.join(' · ') || 'Без деталей';
};

function itemCountLabel(n) {
    if (n === 1) return `${n} позиція`;
    if (n >= 2 && n <= 4) return `${n} позиції`;
    return `${n} позицій`;
}

export default function KitPage() {
    const navigate = useNavigate();
    const [medicines,       setMedicines]       = useState([]);
    const [isLoading,       setIsLoading]       = useState(true);
    const [confirmDelete,   setConfirmDelete]   = useState(null); // { id, name }
    const [isDeleting,      setIsDeleting]      = useState(false);
    const [deleteError,     setDeleteError]     = useState('');

    useEffect(() => {
        authFetch('/api/medicines')
            .then((res) => res.json())
            .then((data) => setMedicines(Array.isArray(data) ? data : []))
            .catch(() => setMedicines([]))
            .finally(() => setIsLoading(false));
    }, []);

    const handleDeleteClick = (e, medicine) => {
        e.stopPropagation();
        setDeleteError('');
        setConfirmDelete({ id: medicine.id, name: medicine.name });
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        setIsDeleting(true);
        setDeleteError('');
        try {
            const res = await authFetch(`/api/medicines/${confirmDelete.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                setDeleteError(data.error || 'Помилка видалення ліків');
                return;
            }
            setMedicines((prev) => prev.filter((m) => m.id !== confirmDelete.id));
            setConfirmDelete(null);
        } catch {
            setDeleteError('Помилка мережі. Спробуйте ще раз.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="kit-page-container">
            <button className="back-btn" onClick={() => navigate('/home')}>← Головна</button>
            <h1 className="kit-page-title">Аптечка</h1>

            <div className="kit-header-row">
                <span className="kit-item-count">
                    {isLoading ? '…' : itemCountLabel(medicines.length)}
                </span>
                <button className="kit-add-button" onClick={() => navigate('/add')}>
                    <Plus size={16} />
                    Додати
                </button>
            </div>

            {isLoading ? (
                <div className="kit-loading">Завантаження…</div>
            ) : medicines.length === 0 ? (
                <div className="kit-empty-state">
                    <div className="kit-empty-icon">💊</div>
                    <p className="kit-empty-message">Аптечка порожня. Додайте перший препарат, щоб почати.</p>
                    <button className="kit-add-first-button" onClick={() => navigate('/add')}>
                        <Plus size={16} />
                        Додати ліки
                    </button>
                </div>
            ) : (
                <div className="kit-medicine-list">
                    {medicines.map((medicine) => (
                        <div
                            className="kit-medicine-item"
                            key={medicine.id}
                            onClick={() => navigate(`/pill/${medicine.id}`)}
                        >
                            {medicine.photo ? (
                                <div className="kit-medicine-img-wrap">
                                    <img
                                        src={medicine.photo}
                                        alt={medicine.name}
                                        className="kit-medicine-img"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement.classList.add('kit-medicine-img-wrap--fallback');
                                        }}
                                    />
                                    <Pill size={20} color="hotpink" className="kit-medicine-img-fallback" style={{ display: 'none' }} />
                                </div>
                            ) : (
                                <div className="kit-medicine-icon">
                                    <Pill size={20} color="hotpink" />
                                </div>
                            )}
                            <div className="kit-medicine-details">
                                <div className="kit-medicine-name">{medicine.name}</div>
                                <div className="kit-medicine-meta">{buildMeta(medicine)}</div>
                            </div>
                            <button
                                className="kit-delete-button"
                                onClick={(e) => handleDeleteClick(e, medicine)}
                                aria-label={`Видалити ${medicine.name}`}
                                title="Видалити"
                            >
                                <Trash2 size={17} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm-delete modal */}
            {confirmDelete && (
                <div className="kit-modal-overlay" onClick={() => !isDeleting && setConfirmDelete(null)}>
                    <div className="kit-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="kit-modal-title">Видалити ліки?</h3>
                        <p className="kit-modal-body">
                            <strong>{confirmDelete.name}</strong> буде назавжди видалено з вашої аптечки.
                            Цю дію не можна скасувати.
                        </p>
                        {deleteError && <p className="kit-modal-error">{deleteError}</p>}
                        <div className="kit-modal-actions">
                            <button
                                className="kit-modal-btn kit-modal-btn--cancel"
                                onClick={() => setConfirmDelete(null)}
                                disabled={isDeleting}
                            >
                                Скасувати
                            </button>
                            <button
                                className="kit-modal-btn kit-modal-btn--delete"
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Видалення…' : 'Видалити'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
