'use client';

import { useState } from 'react';

import { money } from './hotelUtils';

export const DEFAULT_HOTEL_FILTERS = {
    name: '',
    minPrice: '',
    maxPrice: '',
    priceBuckets: [],
    stars: [],
    refund: [],
    meals: [],
    propertyTypes: [],
    localities: [],
    amenities: [],
};

function Section({ title, onClear, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="hb-filter">
            <div className="hb-filter-title">
                <button type="button" className="hb-link" style={{ color: 'inherit' }} onClick={() => setOpen((v) => !v)}>
                    {title} {open ? '−' : '+'}
                </button>
                {onClear && <button type="button" className="hb-link" onClick={onClear}>Clear</button>}
            </div>
            {open && children}
        </div>
    );
}

function CheckList({ items, selected, onToggle, limit = 8 }) {
    const [all, setAll] = useState(false);
    const shown = all ? items : items.slice(0, limit);
    return (
        <>
            {shown.map((item) => (
                <label className="hb-check" key={item.value}>
                    <input type="checkbox" checked={selected.includes(item.value)} onChange={() => onToggle(item.value)} />
                    <span>{item.label}</span>
                    <b>{item.count}</b>
                </label>
            ))}
            {items.length > limit && (
                <button type="button" className="hb-link" onClick={() => setAll((v) => !v)}>
                    {all ? 'Show less' : `Show all ${items.length}`}
                </button>
            )}
        </>
    );
}

/* Filter sidebar (drawer on mobile) */
export default function HotelFilters({ filters, setFilters, facets, open, onClose, resultCount }) {
    const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
    const toggle = (key, value) =>
        setFilters((prev) => ({
            ...prev,
            [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
        }));

    return (
        <>
            {open && <button type="button" className="hb-backdrop" aria-label="Close filters" onClick={onClose} />}
            <aside className={`hb-sidebar ${open ? 'open' : ''}`}>
                <div className="hb-sidebar-head">
                    <strong>Filters</strong>
                    <span style={{ display: 'flex', gap: 12 }}>
                        <button type="button" className="hb-link" onClick={() => setFilters(DEFAULT_HOTEL_FILTERS)}>Reset all</button>
                        {open && <button type="button" className="hb-link" onClick={onClose}>✕</button>}
                    </span>
                </div>

                <Section title="Search by hotel name" onClear={filters.name ? () => update('name', '') : null}>
                    <input
                        type="search"
                        placeholder="e.g. Taj, Marriott"
                        value={filters.name}
                        onChange={(event) => update('name', event.target.value)}
                    />
                </Section>

                <Section
                    title="Price per night"
                    onClear={filters.minPrice !== '' || filters.maxPrice !== '' || filters.priceBuckets.length
                        ? () => setFilters((prev) => ({ ...prev, minPrice: '', maxPrice: '', priceBuckets: [] }))
                        : null}
                >
                    <CheckList
                        items={facets.priceBuckets.filter((bucket) => bucket.count)}
                        selected={filters.priceBuckets}
                        onToggle={(value) => toggle('priceBuckets', value)}
                    />
                    <input
                        type="range"
                        className="hb-range"
                        min={facets.minPrice}
                        max={Math.max(facets.maxPrice, facets.minPrice + 1)}
                        value={filters.maxPrice === '' ? facets.maxPrice : filters.maxPrice}
                        onChange={(event) => update('maxPrice', event.target.value)}
                    />
                    <div className="hb-price-inputs">
                        <label>Min<input type="number" min="0" placeholder={money(facets.minPrice)} value={filters.minPrice} onChange={(event) => update('minPrice', event.target.value)} /></label>
                        <label>Max<input type="number" min="0" placeholder={money(facets.maxPrice)} value={filters.maxPrice} onChange={(event) => update('maxPrice', event.target.value)} /></label>
                    </div>
                </Section>

                <Section title="Star rating" onClear={filters.stars.length ? () => update('stars', []) : null}>
                    <div className="hb-star-row">
                        {[5, 4, 3, 2, 1].map((star) => (
                            <button
                                type="button"
                                key={star}
                                className={filters.stars.includes(star) ? 'active' : ''}
                                disabled={!facets.stars[star]}
                                onClick={() => toggle('stars', star)}
                            >
                                {star}★
                                <small>{facets.stars[star] || 0}</small>
                            </button>
                        ))}
                    </div>
                </Section>

                <Section title="Refund policy" onClear={filters.refund.length ? () => update('refund', []) : null}>
                    <CheckList items={facets.refund.filter((item) => item.count)} selected={filters.refund} onToggle={(value) => toggle('refund', value)} />
                </Section>

                {facets.meals.length > 0 && (
                    <Section title="Meals" onClear={filters.meals.length ? () => update('meals', []) : null}>
                        <CheckList items={facets.meals} selected={filters.meals} onToggle={(value) => toggle('meals', value)} />
                    </Section>
                )}

                {facets.propertyTypes.length > 1 && (
                    <Section title="Property type" onClear={filters.propertyTypes.length ? () => update('propertyTypes', []) : null}>
                        <CheckList items={facets.propertyTypes} selected={filters.propertyTypes} onToggle={(value) => toggle('propertyTypes', value)} />
                    </Section>
                )}

                {facets.localities.length > 1 && (
                    <Section title="Locality" defaultOpen={false} onClear={filters.localities.length ? () => update('localities', []) : null}>
                        <CheckList items={facets.localities} selected={filters.localities} onToggle={(value) => toggle('localities', value)} />
                    </Section>
                )}

                {facets.amenities.length > 0 && (
                    <Section title="Amenities" defaultOpen={false} onClear={filters.amenities.length ? () => update('amenities', []) : null}>
                        <CheckList items={facets.amenities} selected={filters.amenities} onToggle={(value) => toggle('amenities', value)} />
                    </Section>
                )}

                {open && (
                    <div style={{ position: 'sticky', bottom: -14, padding: '12px 0', background: '#fff' }}>
                        <button type="button" className="hb-btn" style={{ width: '100%' }} onClick={onClose}>
                            Show {resultCount} hotels
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
