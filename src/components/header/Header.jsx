import { useState, useRef, useEffect } from 'react';
import { Search, Bell, UserRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../../context/AuthProvider.jsx';

export default function Header() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [searchOpen,  setSearchOpen]  = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef    = useRef(null);
    const searchRef   = useRef(null);

    useEffect(() => {
        if (!searchOpen) return;
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                closeSearch();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchOpen]);

    const openSearch = () => {
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 30);
    };

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchQuery('');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        navigate(`/search?q=${encodeURIComponent(q)}`);
        closeSearch();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') closeSearch();
    };

    const iconSize = window.innerWidth < 768 ? 20 : 24;

    return (
        <header className="header">
            <div
                className="logo"
                onClick={isAuthenticated ? () => navigate('/home') : undefined}
                style={{ cursor: isAuthenticated ? 'pointer' : 'default' }}
            >
                <img src="/src/img/logo.svg" alt="MediKit Logo" className="logo-image" />
                MediKit
            </div>

            {isAuthenticated ? (
                <div className="header-right" ref={searchRef}>
                    {/* Sliding search bar */}
                    <form
                        className={`header-search-bar${searchOpen ? ' header-search-bar--open' : ''}`}
                        onSubmit={handleSearchSubmit}
                    >
                        <Search size={17} className="header-search-bar-icon" />
                        <input
                            ref={inputRef}
                            className="header-search-input"
                            type="text"
                            placeholder="Пошук ліків…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            tabIndex={searchOpen ? 0 : -1}
                        />
                        <button
                            type="button"
                            className="header-search-close"
                            onClick={closeSearch}
                            aria-label="Закрити пошук"
                        >
                            <X size={16} />
                        </button>
                    </form>

                    {/* Icons */}
                    <div className={`header-icons${searchOpen ? ' header-icons--hidden' : ''}`}>
                        <div className="search-icon" onClick={openSearch} style={{ cursor: 'pointer' }}>
                            <Search className="icon" size={iconSize} />
                        </div>
                        <div className="notification-icon" onClick={() => navigate('/reminders')} style={{ cursor: 'pointer' }}>
                            <Bell className="icon" size={iconSize} />
                        </div>
                        <div className="profile-icon" onClick={() => navigate('/account')} style={{ cursor: 'pointer' }}>
                            <UserRound className="icon" size={iconSize} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="auth-buttons">
                    <button className="login"  onClick={() => navigate('/login')}>Увійти</button>
                    <button className="signup" onClick={() => navigate('/signup')}>Реєстрація</button>
                </div>
            )}
        </header>
    );
}
