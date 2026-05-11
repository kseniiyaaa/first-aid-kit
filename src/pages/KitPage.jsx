import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus } from 'lucide-react';
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
    const [medicines, setMedicines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authFetch('/api/medicines')
            .then((res) => res.json())
            .then((data) => setMedicines(Array.isArray(data) ? data : []))
            .catch(() => setMedicines([]))
            .finally(() => setIsLoading(false));
    }, []);

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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
