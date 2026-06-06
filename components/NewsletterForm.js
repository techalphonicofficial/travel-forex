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
      <form
        className="newsletter-form"
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: 10,
          background: 'white',
          borderRadius: 'var(--radius-2xl)',
          padding: 8,
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        }}
      >
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '10px 16px',
            fontSize: 15,
            background: 'transparent',
            color: 'var(--color-text-primary)',
          }}
        />
        <button type="submit" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.75 : 1 }}>
          {loading ? 'Subscribing...' : 'Subscribe'}
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
        .newsletter-popup-backdrop {
          position: fixed;
          inset: 0;
          z-index: 3000;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(15, 23, 42, 0.46);
          backdrop-filter: blur(8px);
        }
        .newsletter-popup {
          position: relative;
          width: min(440px, 100%);
          border: 1px solid rgba(255, 255, 255, 0.65);
          border-radius: 8px;
          background: #fff;
          padding: 26px;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
          text-align: left;
        }
        .newsletter-popup.is-success {
          border-top: 5px solid #16a34a;
        }
        .newsletter-popup.is-error {
          border-top: 5px solid #dc2626;
        }
        .newsletter-popup-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          color: #334155;
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
          cursor: pointer;
        }
        .newsletter-popup-kicker {
          display: block;
          margin-bottom: 8px;
          color: #0f766e;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .newsletter-popup.is-error .newsletter-popup-kicker {
          color: #b91c1c;
        }
        .newsletter-popup h3 {
          margin: 0;
          color: #0f172a;
          font-size: 23px;
          font-weight: 900;
          line-height: 1.25;
        }
        .newsletter-popup-details {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }
        .newsletter-popup-details p {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          margin: 0;
          padding: 11px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          color: #334155;
          font-size: 13px;
          line-height: 1.35;
        }
        .newsletter-popup-details strong {
          color: #64748b;
          font-weight: 900;
          text-transform: uppercase;
        }
        .newsletter-popup-details span {
          color: #0f172a;
          font-weight: 800;
          text-align: right;
          overflow-wrap: anywhere;
        }
        @media (max-width: 560px) {
          .newsletter-form {
            display: grid !important;
            border-radius: 18px !important;
            gap: 8px !important;
            padding: 10px !important;
          }
          .newsletter-form input {
            min-height: 48px;
            padding: 10px 12px !important;
            text-align: center;
          }
          .newsletter-form button {
            width: 100%;
            min-height: 48px;
          }
          .newsletter-popup {
            padding: 24px 18px;
          }
          .newsletter-popup-details p {
            flex-direction: column;
            gap: 3px;
          }
          .newsletter-popup-details span {
            text-align: left;
          }
        }
      `}</style>
    </>
  );
}
