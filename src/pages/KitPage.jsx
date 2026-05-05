import { Pill, Plus } from 'lucide-react';
import '../styles/KitPage.css';

const MEDICINES = [
    { name: 'Ibuprofen',            meta: '500mg · 100 tablets · Pain Relief' },
    { name: 'Acetaminophen',        meta: '500mg · 50 tablets · Pain Relief' },
    { name: 'Vitamin D',            meta: '1000 IU · 60 capsules · Supplement' },
    { name: 'Cetirizine',           meta: '10mg · 30 tablets · Allergy' },
    { name: 'Loperamide',           meta: '2mg · 24 capsules · Digestive' },
    { name: 'Hydrocortisone Cream', meta: '1% · 30g tube · Skin' },
];

export default function KitPage() {
    return (
        <div className="kit-page-container">
            <h1 className="kit-page-title">First Aid Kit</h1>

            <div className="kit-header-row">
                <span className="kit-item-count">{MEDICINES.length} items · Last updated today</span>
                <button className="kit-add-button">
                    <Plus size={16} />
                    Add Item
                </button>
            </div>

            <div className="kit-medicine-list">
                {MEDICINES.map((medicine) => (
                    <div className="kit-medicine-item" key={medicine.name}>
                        <div className="kit-medicine-icon">
                            <Pill size={20} color="hotpink" />
                        </div>
                        <div className="kit-medicine-details">
                            <div className="kit-medicine-name">{medicine.name}</div>
                            <div className="kit-medicine-meta">{medicine.meta}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
