'use client';

import { useState } from 'react';

import './selection-share.css';

/* WhatsApp lets the user pick the chat; text is prefilled */
export const whatsappUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/* mail apps cut very long mailto links: keep the body reasonable */
export const mailtoUrl = (subject, body) =>
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`;

/*
 * Fixed bar shown while the user has picked flights / hotels:
 * compare (optional), send on WhatsApp, email, copy, clear.
 * getShare() builds { subject, text } when a button is pressed.
 */
export default function SelectionShareBar({
    count,
    max,
    title,
    hint,
    onCompare,
    compareLabel = 'Compare',
    onClear,
    getShare,
}) {
    const [copied, setCopied] = useState(false);
    if (!count) return null;

    const share = (channel) => {
        const { subject, text } = getShare();
        if (channel === 'whatsapp') window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer');
        if (channel === 'email') window.location.href = mailtoUrl(subject, text);
        if (channel === 'copy') {
            navigator.clipboard?.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
            }).catch(() => { });
        }
    };

    return (
        <div className="ssb" role="region" aria-label="Selected options">
            <div className="ssb-text">
                <strong>{title}</strong>
                <small>{hint || (max ? `Select up to ${max}` : '')}</small>
            </div>
            <div className="ssb-actions">
                {onCompare && (
                    <button type="button" className="ssb-btn ssb-primary" onClick={onCompare} disabled={count < 2} title={count < 2 ? 'Select at least 2 to compare' : undefined}>
                        ⇄ {compareLabel}
                    </button>
                )}
                <button type="button" className="ssb-btn ssb-whatsapp" onClick={() => share('whatsapp')}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" /></svg>
                    WhatsApp
                </button>
                <button type="button" className="ssb-btn" onClick={() => share('email')}>✉ Email</button>
                <button type="button" className="ssb-btn" onClick={() => share('copy')}>{copied ? '✓ Copied' : '⧉ Copy'}</button>
                <button type="button" className="ssb-link" onClick={onClear}>Clear</button>
            </div>
        </div>
    );
}
