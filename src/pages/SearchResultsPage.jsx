import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Pill } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import '../styles/SearchResultsPage.css';

const buildMeta = (m) => {
    const parts = [];
    if (m.dosage)           parts.push(m.dosage);
    if (m.quantity != null) parts.push(`${m.quantity} ${m.unit || 'одиниць'}`);
    if (m.purpose)          parts.push(m.purpose);
    return parts.join(' · ') || 'Без деталей';
};

/** Highlights all occurrences of `term` inside `text` */
function Highlight({ text, term }) {
    if (!term || !text) return <>{text}</>;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts  = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part)
                    ? <mark key={i} className="search-highlight">{part}</mark>
                    : part
            )}
        </>
    );
}

function resultsCountLabel(n) {
    if (n === 1) return `Знайдено ${n} результат`;
    if (n >= 2 && n <= 4) return `Знайдено ${n} результати`;
    return `Знайдено ${n} результатів`;
}

export default function SearchResultsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [medicines,  setMedicines]  = useState([]);
    const [isLoading,  setIsLoading]  = useState(true);

    useEffect(() => {
        authFetch('/api/medicines')
            .then((res) => res.json())
            .then((data) => setMedicines(Array.isArray(data) ? data : []))
            .catch(() => setMedicines([]))
            .finally(() => setIsLoading(false));
    }, []);

    const q = query.trim().toLowerCase();

    const results = q
        ? medicines.filter(
              (m) =>
                  m.name?.toLowerCase().includes(q) ||
                  m.purpose?.toLowerCase().includes(q)
          )
        : [];

    return (
        <div className="search-page-container">
            <button className="back-btn" onClick={() => navigate('/home')}>← Головна</button>
            <h1 className="search-page-title">
                Результати пошуку{query ? <> для <span className="search-page-query">"{query}"</span></> : ''}
            </h1>

            {isLoading ? (
                <p className="search-page-empty">Завантаження…</p>
            ) : !q ? (
                <p className="search-page-empty">Введіть запит для пошуку ліків.</p>
            ) : results.length === 0 ? (
                <p className="search-page-empty">
                    Ліків за запитом <strong>"{query}"</strong> не знайдено.
                </p>
            ) : (
                <>
                    <p className="search-page-count">
                        {resultsCountLabel(results.length)}
                    </p>
                    <div className="search-results-list">
                        {results.map((medicine) => (
                            <div
                                key={medicine.id}
                                className="search-result-item"
                                onClick={() => navigate(`/pill/${medicine.id}`)}
                            >
                                <div className="search-result-icon">
                                    <Pill size={20} color="hotpink" />
                                </div>
                                <div className="search-result-details">
                                    <div className="search-result-name">
                                        <Highlight text={medicine.name} term={query} />
                                    </div>
                                    <div className="search-result-meta">
                                        <Highlight text={buildMeta(medicine)} term={query} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
