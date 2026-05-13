import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill, Plus, Loader } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import '../styles/AddDecisionPage.css';

// ── API calls (proxied through backend to avoid CORS) ─────────────────────────

async function searchDrugs(query) {
    const res = await authFetch(`/api/drug-search/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search unavailable');
    return res.json(); // string[]
}

async function enrichDrug(name) {
    const res = await authFetch(`/api/drug-search/enrich?name=${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Enrich unavailable');
    return res.json(); // { purpose, instructions, unit, photoUrl }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddDecisionPage() {
    const navigate = useNavigate();

    const [search,      setSearch]      = useState('');
    const [results,     setResults]     = useState([]); // string[]
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [loadingItem, setLoadingItem] = useState(null); // name of item being enriched

    const debounceRef = useRef(null);
    const anyLoading  = loadingItem !== null;

    const doSearch = useCallback(async (query) => {
        setIsSearching(true);
        setSearchError('');
        try {
            const found = await searchDrugs(query);
            setResults(found);
            if (found.length === 0) setSearchError(`No results for "${query}"`);
        } catch {
            setSearchError('Search unavailable. You can still add medicine manually.');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (search.trim().length < 3) { setResults([]); setSearchError(''); return; }
        debounceRef.current = setTimeout(() => doSearch(search), 400);
        return () => clearTimeout(debounceRef.current);
    }, [search, doSearch]);

    const handleCatalogAdd = async (name) => {
        setLoadingItem(name);

        let prefillData;
        try {
            const enriched = await enrichDrug(name);
            prefillData = { name, ...enriched };
        } catch {
            prefillData = { name, purpose: '', instructions: '', unit: null };
        }

        sessionStorage.setItem('medikit_add_prefill', JSON.stringify(prefillData));
        navigate('/add/manual?prefill=1');
    };

    return (
        <div className="add-decision-container">
            <button className="back-btn" onClick={() => navigate('/home')}>← Home</button>
            <h1 className="add-decision-title">Add to Your Kit</h1>

            <div className="add-decision-search-row">
                <div className="add-decision-search-wrapper">
                    <Search className="add-decision-search-icon" size={18} />
                    <input
                        className="add-decision-search-input"
                        type="text"
                        placeholder="Search medicines…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                        disabled={anyLoading}
                    />
                </div>
            </div>

            {/* Searching indicator */}
            {isSearching && (
                <div className="catalog-searching">
                    <Loader size={16} className="catalog-spinner" />
                    Searching…
                </div>
            )}

            {/* Error / no results */}
            {!isSearching && searchError && (
                <div className="catalog-empty-state">{searchError}</div>
            )}

            {/* Initial hint */}
            {!isSearching && !searchError && results.length === 0 && (
                <div className="catalog-empty-state catalog-empty-state--hint">
                    Type at least 3 characters to search any medicine by name
                </div>
            )}

            {/* Results list */}
            {!isSearching && results.length > 0 && (
                <div className="catalog-list">
                    {results.map((name) => (
                        <div className="catalog-item" key={name}>
                            <div className="catalog-item-icon">
                                <Pill size={20} color="#4F8796" />
                            </div>
                            <div className="catalog-item-details">
                                <div className="catalog-item-name">{name}</div>
                            </div>
                            <button
                                className="catalog-item-add-button"
                                onClick={() => handleCatalogAdd(name)}
                                disabled={anyLoading}
                            >
                                {loadingItem === name
                                    ? <Loader size={14} className="catalog-spinner" />
                                    : <Plus size={14} />
                                }
                                {loadingItem === name ? 'Loading…' : 'Add'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="add-manual-row">
                <span className="add-manual-text">Can't find your medicine?</span>
                <button
                    className="add-manual-button"
                    onClick={() => navigate('/add/manual')}
                    disabled={anyLoading}
                >
                    Add manually
                </button>
            </div>
        </div>
    );
}
