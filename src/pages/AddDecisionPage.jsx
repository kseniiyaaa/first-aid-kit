import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill, Plus } from 'lucide-react';
import '../styles/AddDecisionPage.css';

const CATALOG = [
    { name: 'Ibuprofen',            purpose: 'Pain Relief',   meta: '500mg' },
    { name: 'Acetaminophen',        purpose: 'Pain Relief',   meta: '500mg' },
    { name: 'Aspirin',              purpose: 'Pain Relief',   meta: '325mg' },
    { name: 'Cetirizine',           purpose: 'Allergy',       meta: '10mg' },
    { name: 'Loratadine',           purpose: 'Allergy',       meta: '10mg' },
    { name: 'Omeprazole',           purpose: 'Digestive',     meta: '20mg' },
    { name: 'Loperamide',           purpose: 'Digestive',     meta: '2mg' },
    { name: 'Vitamin D',            purpose: 'Supplement',    meta: '1000 IU' },
    { name: 'Vitamin C',            purpose: 'Supplement',    meta: '500mg' },
    { name: 'Melatonin',            purpose: 'Sleep',         meta: '3mg' },
    { name: 'Hydrocortisone Cream', purpose: 'Skin',          meta: '1%' },
    { name: 'Antibiotic Ointment',  purpose: 'Skin',          meta: '0.5%' },
    { name: 'Amoxicillin',          purpose: 'Antibiotic',    meta: '500mg' },
];

export default function AddDecisionPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? CATALOG.filter(
            (item) =>
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.purpose.toLowerCase().includes(search.toLowerCase())
        )
        : CATALOG;

    const handleCatalogAdd = (item) => {
        navigate(
            `/add/manual?name=${encodeURIComponent(item.name)}&purpose=${encodeURIComponent(item.purpose)}`
        );
    };

    return (
        <div className="add-decision-container">
            <h1 className="add-decision-title">Add to Your Kit</h1>

            <div className="add-decision-search-row">
                <div className="add-decision-search-wrapper">
                    <Search className="add-decision-search-icon" size={18} />
                    <input
                        className="add-decision-search-input"
                        type="text"
                        placeholder="Search medicines..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="catalog-list">
                    {filtered.map((item) => (
                        <div className="catalog-item" key={item.name}>
                            <div className="catalog-item-icon">
                                <Pill size={20} color="hotpink" />
                            </div>
                            <div className="catalog-item-details">
                                <div className="catalog-item-name">{item.name}</div>
                                <div className="catalog-item-meta">{item.meta} · {item.purpose}</div>
                            </div>
                            <button
                                className="catalog-item-add-button"
                                onClick={() => handleCatalogAdd(item)}
                            >
                                <Plus size={14} />
                                Add
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="catalog-empty-state">No results for "{search}"</div>
            )}

            <div className="add-manual-row">
                <span className="add-manual-text">Can't find your medicine?</span>
                <button
                    className="add-manual-button"
                    onClick={() => navigate('/add/manual')}
                >
                    Add manually
                </button>
            </div>
        </div>
    );
}
