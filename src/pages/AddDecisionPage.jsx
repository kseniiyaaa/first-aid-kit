import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill, Plus, Loader, X, ChevronDown } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import '../styles/AddDecisionPage.css';

// ── Popular medicine suggestions ─────────────────────────────────────────────
const POPULAR = [
    'Нурофєн',       'Парацетамол',    'Аспірин',       'Но-шпа',
    'Ібупрофен',     'Лоратадін',      'Супрастин',     'Омепразол',
    'Амброксол',     'Лазолван',       'Цитрамон',      'Корвалол',
    'Валеріана',     'Активоване вугілля', 'Ентерос-гель', 'Смекта',
    'Хлоргексидин',  'Мукалтин',       'Бісептол',      'Магній B6',
];

const PAGE_SIZE = 5; // results per page

// ── API helper ────────────────────────────────────────────────────────────────
async function searchDrugs(query) {
    const res = await authFetch(`/api/drug-search/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search unavailable');
    return res.json();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AddDecisionPage() {
    const navigate = useNavigate();

    const [search,      setSearch]      = useState('');
    const [results,     setResults]     = useState([]);
    const [visibleCount,setVisibleCount]= useState(PAGE_SIZE);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [loadingId,   setLoadingId]   = useState(null);

    const debounceRef = useRef(null);
    const anyLoading  = loadingId !== null;

    const doSearch = useCallback(async (query) => {
        setIsSearching(true);
        setSearchError('');
        setVisibleCount(PAGE_SIZE); // reset pagination on new search
        try {
            const found = await searchDrugs(query);
            setResults(found);
            if (found.length === 0) setSearchError(`Нічого не знайдено для "${query}"`);
        } catch {
            setSearchError('Пошук недоступний. Ви можете додати ліки вручну.');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (search.trim().length < 3) { setResults([]); setSearchError(''); return; }
        debounceRef.current = setTimeout(() => doSearch(search.trim()), 400);
        return () => clearTimeout(debounceRef.current);
    }, [search, doSearch]);

    const handleCatalogAdd = (product) => {
        const itemKey = product.id ?? product.name;
        setLoadingId(itemKey);
        sessionStorage.setItem('medikit_add_prefill', JSON.stringify({
            name:              product.name,
            dosage:            product.dosage  || '',
            purpose:           product.purpose || '',
            unit:              product.unit    || null,
            picture:           product.picture || null,
            apiDescriptionUrl: product.apiDescriptionUrl || null,
        }));
        navigate('/add/manual?prefill=1');
    };

    const clearSearch = () => {
        setSearch('');
        setResults([]);
        setSearchError('');
        setVisibleCount(PAGE_SIZE);
    };

    const showHint    = !isSearching && !searchError && results.length === 0 && search.trim().length < 3;
    const showResults = !isSearching && results.length > 0;
    const showError   = !isSearching && !!searchError;

    const visibleResults  = results.slice(0, visibleCount);
    const hiddenCount     = results.length - visibleCount;

    return (
        <div className="add-decision-container">
            <button className="back-btn" onClick={() => navigate('/home')}>← Головна</button>
            <h1 className="add-decision-title">Додати до аптечки</h1>

            {/* Hint — above search bar */}
            {showHint && (
                <p className="catalog-hint-above">
                    Введіть щонайменше 3 символи для пошуку ліків
                </p>
            )}

            {/* Search bar */}
            <div className="add-decision-search-row">
                <div className="add-decision-search-wrapper">
                    <Search className="add-decision-search-icon" size={18} />
                    <input
                        className="add-decision-search-input"
                        type="text"
                        placeholder="Пошук ліків…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                        disabled={anyLoading}
                    />
                    {search && (
                        <button
                            className="add-decision-search-clear"
                            type="button"
                            onClick={clearSearch}
                            aria-label="Очистити пошук"
                            disabled={anyLoading}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Popular suggestions */}
            {showHint && (
                <div className="catalog-popular">
                    <p className="catalog-popular-label">Популярні препарати:</p>
                    <div className="catalog-popular-chips">
                        {POPULAR.map((term) => (
                            <button
                                key={term}
                                className="catalog-popular-chip"
                                onClick={() => setSearch(term)}
                                disabled={anyLoading}
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Searching indicator */}
            {isSearching && (
                <div className="catalog-searching">
                    <Loader size={16} className="catalog-spinner" />
                    Пошук…
                </div>
            )}

            {/* Error / no results */}
            {showError && (
                <div className="catalog-empty-state">{searchError}</div>
            )}

            {/* Results list */}
            {showResults && (
                <>
                    <div className="catalog-list">
                        {visibleResults.map((product) => {
                            const itemKey   = product.id ?? product.name;
                            const isLoading = loadingId === itemKey;
                            return (
                                <div className="catalog-item" key={itemKey}>
                                    {product.picture ? (
                                        <div className="catalog-item-img-wrap">
                                            <img
                                                src={product.picture}
                                                alt={product.name}
                                                className="catalog-item-img"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement.classList.add('catalog-item-img-wrap--fallback');
                                                }}
                                            />
                                            <Pill size={20} color="#4F8796"
                                                className="catalog-item-img-fallback-icon"
                                                style={{ display: 'none' }} />
                                        </div>
                                    ) : (
                                        <div className="catalog-item-icon">
                                            <Pill size={20} color="#4F8796" />
                                        </div>
                                    )}

                                    <div className="catalog-item-details">
                                        <div className="catalog-item-name">{product.name}</div>
                                        {(product.dosage || product.producer || product.form) && (
                                            <div className="catalog-item-meta">
                                                {[product.dosage, product.form, product.producer]
                                                    .filter(Boolean).join(' · ')}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="catalog-item-add-button"
                                        onClick={() => handleCatalogAdd(product)}
                                        disabled={anyLoading}
                                    >
                                        {isLoading
                                            ? <Loader size={14} className="catalog-spinner" />
                                            : <Plus size={14} />}
                                        {isLoading ? 'Завантаження…' : 'Додати'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Show more button */}
                    {hiddenCount > 0 && (
                        <button
                            className="catalog-show-more"
                            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                            disabled={anyLoading}
                        >
                            <ChevronDown size={16} />
                            Показати ще {hiddenCount}
                        </button>
                    )}
                </>
            )}

            <div className="add-manual-row">
                <span className="add-manual-text">Не знайшли потрібних ліків?</span>
                <button
                    className="add-manual-button"
                    onClick={() => navigate('/add/manual')}
                    disabled={anyLoading}
                >
                    Додати вручну
                </button>
            </div>
        </div>
    );
}
