'use client';

import './landing.css';

/*
 * Sections shown under the hotel and flight search boxes on a first visit,
 * so the page is not empty: destinations, quick picks, recent searches,
 * how it works, trust points and FAQs.
 */

export function SectionHead({ kicker, title, text }) {
    return (
        <div className="tl-head">
            {kicker && <span className="tl-kicker">{kicker}</span>}
            <h2>{title}</h2>
            {text && <p>{text}</p>}
        </div>
    );
}

/* Short benefit points in a row (only things the product really does) */
export function TrustStrip({ items }) {
    return (
        <div className="tl-trust">
            {items.map((item) => (
                <div className="tl-trust-item" key={item.title}>
                    <span className="tl-trust-icon" aria-hidden="true">{item.icon}</span>
                    <div>
                        <strong>{item.title}</strong>
                        <small>{item.text}</small>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* Photo tiles; the first one is large on wide screens */
export function DestinationGrid({ items, onPick, actionLabel = 'Search' }) {
    return (
        <div className="tl-dest-grid">
            {items.map((item, index) => (
                <button
                    type="button"
                    key={item.key || item.name}
                    className={`tl-dest ${index === 0 ? 'tl-dest-lg' : ''}`}
                    onClick={() => onPick(item)}
                    aria-label={`${actionLabel} ${item.name}`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" loading="lazy" />
                    <span className="tl-dest-shade" />
                    <span className="tl-dest-text">
                        {item.tag && <em>{item.tag}</em>}
                        <strong>{item.name}</strong>
                        <small>{item.subtitle}</small>
                    </span>
                    <span className="tl-dest-cta">{actionLabel} →</span>
                </button>
            ))}
        </div>
    );
}

/* Pill buttons (hotel brands, quick picks) */
export function ChipRow({ items, onPick }) {
    return (
        <div className="tl-chips">
            {items.map((item) => (
                <button type="button" className="tl-chip" key={item.label} onClick={() => onPick(item)}>
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    {item.label}
                </button>
            ))}
        </div>
    );
}

/* Last searches of this browser: one card each */
export function RecentSearches({ items, onPick, onClear }) {
    if (!items?.length) return null;
    return (
        <div className="tl-recent">
            <div className="tl-recent-head">
                <strong>Your recent searches</strong>
                {onClear && <button type="button" className="tl-link" onClick={onClear}>Clear</button>}
            </div>
            <div className="tl-recent-list">
                {items.map((item) => (
                    <button type="button" className="tl-recent-card" key={item.key} onClick={() => onPick(item)}>
                        <span aria-hidden="true">{item.icon || '🕘'}</span>
                        <span>
                            <strong>{item.title}</strong>
                            <small>{item.subtitle}</small>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function Steps({ items }) {
    return (
        <ol className="tl-steps">
            {items.map((item, index) => (
                <li key={item.title}>
                    <span className="tl-step-no">{index + 1}</span>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                </li>
            ))}
        </ol>
    );
}

export function Faq({ items }) {
    return (
        <div className="tl-faq">
            {items.map((item) => (
                <details key={item.q}>
                    <summary>
                        <span>{item.q}</span>
                        <i aria-hidden="true" />
                    </summary>
                    <p>{item.a}</p>
                </details>
            ))}
        </div>
    );
}

/* localStorage list of recent searches (this browser only) */
export const readRecent = (key) => {
    try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
};

export const saveRecent = (key, entry, max = 4) => {
    try {
        const list = readRecent(key).filter((item) => item?.key !== entry.key);
        localStorage.setItem(key, JSON.stringify([entry, ...list].slice(0, max)));
    } catch {
        // storage blocked: recent searches are optional
    }
};

export const clearRecent = (key) => {
    try {
        localStorage.removeItem(key);
    } catch {
        // ignore
    }
};
