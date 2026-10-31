'use client';

import { useEffect, useState } from 'react';

import './booking-topbar.css';

export const BOOKING_STEPS = ['Review', 'Travellers', 'Seats & Meals', 'Payment'];

const money = (value) =>
    `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/*
 * TripJack review session: conditions.st seconds counted from the
 * time the fare was reviewed. Returns null until the clock starts.
 */
export function useSessionTimer(expiresAt) {
    const [now, setNow] = useState(null);

    useEffect(() => {
        if (!expiresAt) return undefined;
        const tick = () => setNow(Date.now());
        const first = setTimeout(tick, 0);
        const timer = setInterval(tick, 1000);
        return () => {
            clearTimeout(first);
            clearInterval(timer);
        };
    }, [expiresAt]);

    return expiresAt && now ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;
}

/*
 * The site header is sticky too. Keep our sticky bars just below it by
 * publishing its bottom edge as --bk-offset on <html>.
 */
export function useStickyHeaderOffset() {
    useEffect(() => {
        let frame = null;
        const update = () => {
            frame = null;
            const header = document.querySelector('header');
            const position = header ? getComputedStyle(header).position : '';
            const bottom = header && (position === 'sticky' || position === 'fixed')
                ? Math.max(0, Math.round(header.getBoundingClientRect().bottom))
                : 0;
            document.documentElement.style.setProperty('--bk-offset', `${bottom}px`);
        };
        const schedule = () => {
            if (frame === null) frame = requestAnimationFrame(update);
        };

        schedule();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            document.documentElement.style.removeProperty('--bk-offset');
        };
    }, []);
}

export const getSessionExpiry = (flow) => {
    const seconds = Number(flow?.review?.conditions?.st || 0);
    const reviewedAt = Date.parse(flow?.reviewedAt || '');
    return seconds && Number.isFinite(reviewedAt) ? reviewedAt + seconds * 1000 : null;
};

/*
 * Sticky booking header used on every booking step:
 * Back | steps | session timer | total + Continue
 */
export default function BookingTopBar({
    step = 0,
    steps = BOOKING_STEPS,
    onBack,
    backLabel = 'Back',
    secondsLeft = null,
    total = null,
    totalLabel = 'Total',
    continueLabel = 'Continue',
    onContinue,
    continueDisabled = false,
}) {
    useStickyHeaderOffset();

    return (
        <div className="bk-topbar">
            <div className="bk-topbar-inner">
                {onBack && (
                    <button type="button" className="bk-back" onClick={onBack} aria-label={backLabel}>
                        <span aria-hidden="true">←</span>
                        <b>{backLabel}</b>
                    </button>
                )}

                <ol className="bk-steps">
                    {steps.map((label, index) => (
                        <li
                            key={label}
                            className={`${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`}
                        >
                            <span>{index < step ? '✓' : index + 1}</span>
                            <em>{label}</em>
                        </li>
                    ))}
                </ol>

                <div className="bk-step-mobile">
                    <small>Step {step + 1} of {steps.length}</small>
                    <strong>{steps[step]}</strong>
                </div>

                <div className="bk-actions">
                    {secondsLeft !== null && (
                        <div className={`bk-timer ${secondsLeft < 120 ? 'urgent' : ''}`} title="Session expires in">
                            <small>Expires in</small>
                            <strong>
                                {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
                            </strong>
                        </div>
                    )}

                    {total !== null && (
                        <div className="bk-total">
                            <small>{totalLabel}</small>
                            <strong>{money(total)}</strong>
                        </div>
                    )}

                    {onContinue && (
                        <button
                            type="button"
                            className="bk-continue"
                            disabled={continueDisabled}
                            onClick={onContinue}
                        >
                            {continueLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
