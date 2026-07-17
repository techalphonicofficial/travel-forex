'use client';

import Link from 'next/link';

export function SectionIntro({ eyebrow, title, accent, subtitle, meta, actions }) {
  return (
    <div className="th-section-intro">
      <div className="th-section-copy">
        {eyebrow ? <span className="th-eyebrow">{eyebrow}</span> : null}
        <h2>
          {title}
          {accent ? <span>{accent}</span> : null}
        </h2>
        {subtitle ? <p>{subtitle}</p> : null}
        {meta ? <div className="th-section-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="th-section-actions">{actions}</div> : null}
    </div>
  );
}

export function FilterPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={`th-filter-pill ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function CircleButton({ label, children, onClick }) {
  return (
    <button type="button" className="th-circle-button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function SoftBadge({ tone = 'neutral', children }) {
  return <span className={`th-soft-badge is-${tone}`}>{children}</span>;
}

export function CardLink({ href, children }) {
  return (
    <Link href={href} className="th-card-link">
      {children}
    </Link>
  );
}
