import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import '../styles/KitPage.css';

const buildMeta = (m) => {
    const parts = [];
    if (m.dosage)            parts.push(m.dosage);
    if (m.quantity != null)  parts.push(`${m.quantity} ${m.unit || 'units'}`);
    if (m.purpose)           parts.push(m.purpose);
    return parts.join(' · ') || 'No details';
};

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
        e.stopPropagation(); // не переходити на сторінку ліків
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
                setDeleteError(data.error || 'Failed to delete medicine');
                return;
            }
            setMedicines((prev) => prev.filter((m) => m.id !== confirmDelete.id));
            setConfirmDelete(null);
        } catch {
            setDeleteError('Network error. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="kit-page-container">
            <h1 className="kit-page-title">First Aid Kit</h1>

            <div className="kit-header-row">
                <span className="kit-item-count">
                    {isLoading ? '…' : `${medicines.length} item${medicines.length !== 1 ? 's' : ''}`}
                </span>
                <button className="kit-add-button" onClick={() => navigate('/add')}>
                    <Plus size={16} />
                    Add Item
                </button>
            </div>

            {isLoading ? (
                <div className="kit-loading">Loading your kit…</div>
            ) : medicines.length === 0 ? (
                <div className="kit-empty-state">
                    <div className="kit-empty-icon">💊</div>
                    <p className="kit-empty-message">Your kit is empty. Add your first medicine to get started.</p>
                    <button className="kit-add-first-button" onClick={() => navigate('/add')}>
                        <Plus size={16} />
                        Add Medicine
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
                            <div className="kit-medicine-icon">
                                <Pill size={20} color="hotpink" />
                            </div>
                            <div className="kit-medicine-details">
                                <div className="kit-medicine-name">{medicine.name}</div>
                                <div className="kit-medicine-meta">{buildMeta(medicine)}</div>
                            </div>
                            <button
                                className="kit-delete-button"
                                onClick={(e) => handleDeleteClick(e, medicine)}
                                aria-label={`Delete ${medicine.name}`}
                                title="Delete"
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
                        <h3 className="kit-modal-title">Remove medicine?</h3>
                        <p className="kit-modal-body">
                            <strong>{confirmDelete.name}</strong> will be permanently removed from your kit.
                            This action cannot be undone.
                        </p>
                        {deleteError && <p className="kit-modal-error">{deleteError}</p>}
                        <div className="kit-modal-actions">
                            <button
                                className="kit-modal-btn kit-modal-btn--cancel"
                                onClick={() => setConfirmDelete(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="kit-modal-btn kit-modal-btn--delete"
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Removing…' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
