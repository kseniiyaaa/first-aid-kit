import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill, Plus, Loader, X, ChevronDown } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import '../styles/AddDecisionPage.css';

// ── Funnel icon (user-provided SVG) ──────────────────────────────────────────
const FunnelIcon = ({ size = 18, className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>
    </svg>
);

// ── Popular medicine suggestions ─────────────────────────────────────────────
const POPULAR = [
    'Нурофєн',       'Парацетамол',    'Аспірин',       'Но-шпа',
    'Ібупрофен',     'Лоратадін',      'Супрастин',     'Омепразол',
    'Амброксол',     'Лазолван',       'Цитрамон',      'Корвалол',
    'Валеріана',     'Активоване вугілля', 'Ентерос-гель', 'Смекта',
    'Хлоргексидин',  'Мукалтин',       'Бісептол',      'Магній B6',
];

// ── Curated filter categories (matches backend CATEGORY_SEARCHES keys) ────────
const FILTER_CATEGORIES = [
    { id: 'cold',        name: 'Від застуди та грипу' },
    { id: 'cough',       name: 'Від кашлю' },
    { id: 'fever',       name: 'Жарознижуючі' },
    { id: 'pain',        name: 'Знеболюючі та протизапальні' },
    { id: 'allergy',     name: 'Від алергії' },
    { id: 'nose',        name: 'Від нежитю' },
    { id: 'throat',      name: 'Від болю в горлі' },
    { id: 'stomach',     name: 'Шлунок та кишечник' },
    { id: 'diarrhea',    name: 'Від діареї та отруєнь' },
    { id: 'sedative',    name: 'Заспокійливі' },
    { id: 'vitamins',    name: 'Вітаміни та мінерали' },
    { id: 'heart',       name: 'Серцево-судинні' },
    { id: 'pressure',    name: 'Від підвищеного тиску' },
    { id: 'antibiotics', name: 'Антибіотики' },
    { id: 'antiseptic',  name: 'Антисептики' },
    { id: 'eye',         name: 'Очні засоби' },
    { id: 'diabetes',    name: 'При діабеті' },
];

const PAGE_SIZE = 5; // results shown per page

// ── API helpers ───────────────────────────────────────────────────────────────
async function searchByText(query) {
    const res = await authFetch(`/api/drug-search/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search unavailable');
    return res.json();
}

async function searchByCategory(categoryId) {
    const res = await authFetch(`/api/drug-search/search?category=${encodeURIComponent(categoryId)}`);
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

    // Filter state
    const [activeFilter, setActiveFilter] = useState(null); // {id, name} | null
    const [filterOpen,   setFilterOpen]   = useState(false);
    const [filterSearch, setFilterSearch] = useState('');

    const debounceRef   = useRef(null);
    const filterWrapRef = useRef(null);
    const anyLoading    = loadingId !== null;

    // Close filter panel on outside click
    useEffect(() => {
        if (!filterOpen) return;
        const handler = (e) => {
            if (filterWrapRef.current && !filterWrapRef.current.contains(e.target)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [filterOpen]);

    const doSearch = useCallback(async (mode, value) => {
        // mode: 'text' | 'category'
        setIsSearching(true);
        setSearchError('');
        setVisibleCount(PAGE_SIZE);
        try {
            const found = mode === 'category'
                ? await searchByCategory(value.id)
                : await searchByText(value);
            setResults(found);
            if (found.length === 0) {
                const label = mode === 'category' ? value.name : `"${value}"`;
                setSearchError(`Нічого не знайдено для ${label}`);
            }
        } catch {
            setSearchError('Пошук недоступний. Ви можете додати ліки вручну.');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Trigger search whenever text or active filter changes
    useEffect(() => {
        clearTimeout(debounceRef.current);
        const textQuery = search.trim();

        if (textQuery.length >= 3) {
            // Text takes precedence — debounced
            debounceRef.current = setTimeout(() => doSearch('text', textQuery), 400);
        } else if (activeFilter) {
            // Category browse — instant
            doSearch('category', activeFilter);
        } else {
            setResults([]);
            setSearchError('');
        }

        return () => clearTimeout(debounceRef.current);
    }, [search, activeFilter, doSearch]);

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
        setVisibleCount(PAGE_SIZE);
        if (!activeFilter) {
            setResults([]);
            setSearchError('');
        }
        // If filter is active, useEffect will fire category search automatically
    };

    const clearFilter = () => {
        setActiveFilter(null);
        setFilterSearch('');
        if (search.trim().length < 3) {
            setResults([]);
            setSearchError('');
        }
    };

    const selectFilter = (cat) => {
        setActiveFilter(prev => prev?.id === cat.id ? null : cat); // toggle
        setFilterOpen(false);
        setFilterSearch('');
    };

    const visibleFilterCats = filterSearch.trim()
        ? FILTER_CATEGORIES.filter(c =>
            c.name.toLowerCase().includes(filterSearch.trim().toLowerCase()))
        : FILTER_CATEGORIES;

    const showHint    = !isSearching && !searchError && results.length === 0
                        && search.trim().length < 3 && !activeFilter;
    const showResults = !isSearching && results.length > 0;
    const showError   = !isSearching && !!searchError;

    const visibleResults = results.slice(0, visibleCount);
    const hiddenCount    = results.length - visibleCount;
    const hasFilter      = !!activeFilter;

    return (
        <div className="add-decision-container">
            <button className="back-btn" onClick={() => navigate('/home')}>← Головна</button>
            <h1 className="add-decision-title">Додати до аптечки</h1>

            {/* Hint above search bar */}
            {showHint && (
                <p className="catalog-hint-above">
                    Введіть щонайменше 3 символи або оберіть категорію для пошуку
                </p>
            )}

            {/* Search + filter button */}
            <div className="add-decision-search-row" ref={filterWrapRef}>
                <div className="add-decision-search-with-filter">
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

                    <button
                        className={`catalog-filter-btn${hasFilter ? ' catalog-filter-btn--active' : ''}`}
                        type="button"
                        onClick={() => setFilterOpen(o => !o)}
                        disabled={anyLoading}
                        aria-label="Фільтри за категорією"
                        title="Фільтр за категорією"
                    >
                        <FunnelIcon size={17} />
                        <span className="catalog-filter-btn-label">Фільтри</span>
                        {hasFilter && <span className="catalog-filter-dot" />}
                    </button>
                </div>

                {/* Filter panel dropdown */}
                {filterOpen && (
                    <div className="catalog-filter-panel">
                        <div className="catalog-filter-panel-header">
                            <span className="catalog-filter-panel-title">Категорія</span>
                            <button
                                className="catalog-filter-panel-close"
                                type="button"
                                onClick={() => setFilterOpen(false)}
                                aria-label="Закрити"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="catalog-filter-search-wrap">
                            <Search size={14} className="catalog-filter-search-icon" />
                            <input
                                className="catalog-filter-search-input"
                                type="text"
                                placeholder="Знайти категорію…"
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                autoFocus
                            />
                            {filterSearch && (
                                <button
                                    className="catalog-filter-search-clear"
                                    type="button"
                                    onClick={() => setFilterSearch('')}
                                    aria-label="Очистити"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        <div className="catalog-filter-chips-scroll">
                            {visibleFilterCats.length === 0 ? (
                                <p className="catalog-filter-empty">Категорій не знайдено</p>
                            ) : visibleFilterCats.map((cat) => (
                                <button
                                    key={cat.id}
                                    className={`catalog-filter-chip${activeFilter?.id === cat.id ? ' catalog-filter-chip--active' : ''}`}
                                    type="button"
                                    onClick={() => selectFilter(cat)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {hasFilter && (
                            <div className="catalog-filter-panel-footer">
                                <button
                                    className="catalog-filter-reset"
                                    type="button"
                                    onClick={clearFilter}
                                >
                                    Скинути фільтр
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Active filter chip */}
            {hasFilter && !filterOpen && (
                <div className="catalog-active-filter-row">
                    <span className="catalog-active-filter-label">Категорія:</span>
                    <button
                        className="catalog-active-filter-chip"
                        type="button"
                        onClick={clearFilter}
                        title="Скинути фільтр"
                    >
                        {activeFilter.name}
                        <X size={13} />
                    </button>
                </div>
            )}

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
