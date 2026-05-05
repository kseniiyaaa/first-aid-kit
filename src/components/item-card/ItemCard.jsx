import { Pill, TrendingDown, Siren, Check } from 'lucide-react';
import './ItemCard.css';

export default function ItemCard({ data, isDone, onToggle }) {
    const renderIcon = () => {
        switch (data.type) {
            case 'reminder':
                return <Pill className="pill-icon" />;
            case 'stock':
                return <TrendingDown className="low-stock-icon" />;
            case 'expiring':
                return <Siren className="siren-icon" />;
            default:
                return null;
        }
    };

    return (
        <div className={`${data.type}-item${isDone ? ' reminder-taken' : ''}`}>
            {data.type === 'reminder' && (
                <button
                    className={`reminder-checkbox${isDone ? ' reminder-checkbox-checked' : ''}`}
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={`Mark ${data.name} as taken`}
                    onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                >
                    {isDone && <Check size={12} strokeWidth={3} />}
                </button>
            )}

            <div className={`${data.type}-icon`}>{renderIcon()}</div>

            <div className={`${data.type}-details`}>
                <div className={`${data.type}-name`}>{data.name}</div>
                {data.subtitle && (
                    <div
                        className={
                            data.type === 'reminder'
                                ? 'reminder-instruction'
                                : data.type === 'stock'
                                    ? 'stock-quantity'
                                    : ''
                        }
                    >
                        {data.subtitle}
                    </div>
                )}
            </div>

            {data.type === 'reminder' && data.dateOrTime && (
                <div className="reminder-time">{data.dateOrTime}</div>
            )}

            {data.type === 'stock' && data.buttonText && (
                <button className="reorder-btn">{data.buttonText}</button>
            )}

            {data.type === 'expiring' && data.dateOrTime && (
                <div className="expiration-date">{data.dateOrTime}</div>
            )}
        </div>
    );
}
