'use client';

import { useEffect, useState } from 'react';

const formatSubscribedDate = (value) => {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!result) return undefined;

    const timer = window.setTimeout(() => {
      setResult(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [result]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'website',
        }),
      });
      const data = await response.json().catch(() => null);

      setResult(data || {
        success: response.ok,
        message: response.ok ? 'Newsletter subscription created' : 'Unable to subscribe right now.',
      });

      if (response.ok && data?.success !== false) {
        setEmail('');
      }
    } catch {
      setResult({
        success: false,
        message: 'Unable to subscribe right now. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <div className="newsletter-input-group">
          <div className="newsletter-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" width="18" height="18">
              <rect x="2" y="4" width="20" height="16" rx="3" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <input
            type="email"
            className="newsletter-email-input"
            placeholder="Enter your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        
        <button
          type="submit"
          className="newsletter-submit-btn"
          disabled={loading}
        >
          {loading ? '...' : 'Subscribe'}
        </button>
      </form>

      {result ? (
        <div className="newsletter-popup-backdrop" role="presentation" onMouseDown={() => setResult(null)}>
          <section
            className={`newsletter-popup ${result.success ? 'is-success' : 'is-error'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-popup-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="newsletter-popup-close" aria-label="Close newsletter response" onClick={() => setResult(null)}>
              <span aria-hidden="true">x</span>
            </button>
            <span className="newsletter-popup-kicker">
              {result.success ? 'Subscription confirmed' : 'Subscription failed'}
            </span>
            <h3 id="newsletter-popup-title">{result.message || 'Newsletter response'}</h3>
            {result.data ? (
              <div className="newsletter-popup-details">
                {result.data.email ? <p><strong>Email</strong><span>{result.data.email}</span></p> : null}
                {result.data.status ? <p><strong>Status</strong><span>{result.data.status}</span></p> : null}
                {result.data.source ? <p><strong>Source</strong><span>{result.data.source}</span></p> : null}
                {result.data.subscribed_at ? <p><strong>Subscribed</strong><span>{formatSubscribedDate(result.data.subscribed_at)}</span></p> : null}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      <style jsx>{`
        /* Form Container - strictly centered pill shape */
        .newsletter-form {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 440px;
          margin: 0 auto !important; /* CRITICAL: Forces centering regardless of parent */
          align-self: center; /* Secondary protection against flex-column parents */
          padding: 6px 6px 6px 18px; /* Snug on the right for the button, spacious on the left */
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.28);
          border-radius: 50px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          box-sizing: border-box;
        }

        /* Input Group wrapper */
        .newsletter-input-group {
          display: flex;
          align-items: center;
          flex: 1; /* Takes up empty space */
          min-width: 0; /* Prevents overflow */
          padding-right: 10px;
        }

        .newsletter-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          margin-right: 10px;
        }

        /* Email Input */
        .newsletter-email-input {
          flex: 1;
          width: 100%;
          min-width: 0; 
          border: none;
          outline: none;
          padding: 10px 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.95);
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          text-overflow: ellipsis;
        }

        .newsletter-email-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
          opacity: 1;
        }

        /* Submit Button */
        .newsletter-submit-btn {
          flex-shrink: 0; /* Prevents squishing */
          background: var(--color-secondary, #facc15);
          color: #111827;
          border: none;
          border-radius: 44px;
          padding: 10px 24px;
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.3px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, transform 0.2s;
        }

        .newsletter-submit-btn:hover:not(:disabled) {
          background: var(--color-secondary-hover, #eab308);
        }

        .newsletter-submit-btn:disabled {
          cursor: not-allowed;
          opacity: 0.75;
        }

        /* Popup Styles (Unchanged) */
        .newsletter-popup-backdrop { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 18px; background: rgba(15, 23, 42, 0.46); backdrop-filter: blur(8px); }
        .newsletter-popup { position: relative; width: min(440px, 100%); border: 1px solid rgba(255, 255, 255, 0.65); border-radius: 8px; background: #fff; padding: 26px; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28); text-align: left; }
        .newsletter-popup.is-success { border-top: 5px solid #16a34a; }
        .newsletter-popup.is-error { border-top: 5px solid #dc2626; }
        .newsletter-popup-close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #334155; font-size: 18px; font-weight: 900; line-height: 1; cursor: pointer; }
        .newsletter-popup-kicker { display: block; margin-bottom: 8px; color: #0f766e; font-size: 12px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
        .newsletter-popup.is-error .newsletter-popup-kicker { color: #b91c1c; }
        .newsletter-popup h3 { margin: 0; color: #0f172a; font-size: 23px; font-weight: 900; line-height: 1.25; }
        .newsletter-popup-details { display: grid; gap: 10px; margin-top: 18px; }
        .newsletter-popup-details p { display: flex; justify-content: space-between; gap: 14px; margin: 0; padding: 11px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; color: #334155; font-size: 13px; line-height: 1.35; }
        .newsletter-popup-details strong { color: #64748b; font-weight: 900; text-transform: uppercase; }
        .newsletter-popup-details span { color: #0f172a; font-weight: 800; text-align: right; overflow-wrap: anywhere; }

        /* Mobile specific adjustments */
        @media (max-width: 480px) {

          .
          .newsletter-form {
            width: calc(100% - 32px); /* Ensures a 16px safe gap on the left and right screen edges */
            padding: 15px 50px;
             min-width:200px;
          }

          .newsletter-email-input {
            font-size: 7px;
            padding: 8px 0;
           
          }

          .newsletter-submit-btn {
            padding: 2px 5px;
            font-size: 7px;
          }

          .newsletter-popup {
            padding: 24px 16px;
          }

          .newsletter-popup-details p {
            flex-direction: column;
            align-items: center;
            gap: 3px;
          }

          .newsletter-popup-details span {
            text-align: center; 
          }
        }
      `}</style>
    </>
  );
}
