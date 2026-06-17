'use client';
import { useState } from 'react';
import Link from 'next/link';

const navGroups = [
  {
    label: 'Family Theme Packages',
    hasSub: true,
    subItems: [
      'International Family Packages', 'Thailand Family Packages', 'Europe Family Packages',
      'Maldives Family Packages', 'Bali Family Packages', 'Dubai Family Packages',
      'Vietnam Family Packages', 'Singapore Family Packages', 'Sri Lanka Family Packages',
      'Turkey Family Packages', 'Japan Family Packages', 'Greece Family Packages'
    ]
  },
  {
    label: 'Honeymoon Theme Packages',
    hasSub: true,
    subItems: ['Bali Honeymoon', 'Maldives Honeymoon', 'Thailand Honeymoon', 'Europe Honeymoon']
  },
  {
    label: 'Adventure Theme Packages',
    hasSub: true,
    subItems: ['Trekking in Nepal', 'Skydiving in Dubai', 'Scuba in Maldives']
  },
  { label: 'Exclusive Packages', hasSub: true, subItems: ['Luxury Cruise', 'Private Island Getaway'] },
  { label: 'International Tourism', hasSub: true, subItems: ['Europe', 'Asia', 'Americas', 'Africa'] },
  { label: 'Indian Tourism', hasSub: true, subItems: ['Kerala', 'Rajasthan', 'Leh Ladakh', 'Goa'] },
  {
    label: 'Visa',
    hasSub: true,
    subItems: [
      { label: 'Thailand Visa', href: '/visa/thailand' },
      { label: 'Dubai Visa', href: '/visa/thailand' },
      { label: 'Schengen Visa', href: '/visa/thailand' },
      { label: 'UK Visa', href: '/visa/thailand' }
    ]
  },
  { label: 'Testimonial', href: '/testimonials' },
  { label: 'FAQ', href: '/contact#faq' },
  { label: 'Contact us', href: '/contact' },
  { label: 'Blog', href: '/blog' },
  { label: 'About us', href: '/about' },
  { label: 'Login', href: '/login' },
];

export default function SideDrawer({ isOpen, onClose, companyInfo }) {
  const [expanded, setExpanded] = useState(null);
  const displayPhone = companyInfo?.contact?.phone || '+91 8031274154';

  const toggleExpand = (label) => {
    setExpanded(expanded === label ? null : label);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 2000,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0,
          width: '100%', maxWidth: 340, height: '100vh',
          background: 'white', zIndex: 2001,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>Hello, Guest</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: '#6b7280' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {navGroups.map((group, idx) => {
            const isExpanded = expanded === group.label;
            const hasHref = !!group.href;

            const ItemTrigger = (
              <div
                onClick={() => group.hasSub ? toggleExpand(group.label) : null}
                style={{
                  padding: '16px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isExpanded ? '#fff9f2' : 'white',
                }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#fcfcfc'; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'white'; }}
              >
                <span style={{ fontSize: 13.5, fontWeight: isExpanded ? 600 : 500, color: isExpanded ? '#111827' : '#374151' }}>
                  {group.label}
                </span>
                {group.hasSub && (
                  <svg
                    viewBox="0 0 24 24" fill="currentColor" width="16" height="16"
                    style={{
                      opacity: 0.6,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                )}
              </div>
            );

            return (
              <div key={idx} style={{ borderBottom: '1px solid #f9fafb' }}>
                {hasHref ? (
                  <Link href={group.href} style={{ textDecoration: 'none' }} onClick={onClose}>
                    {ItemTrigger}
                  </Link>
                ) : ItemTrigger}

                {group.hasSub && isExpanded && (
                  <div style={{ background: '#fff9f2', paddingBottom: 12 }}>
                    {group.subItems.map((sub, sidx) => {
                      const isObj = typeof sub === 'object';
                      const label = isObj ? sub.label : sub;
                      const href = isObj ? sub.href : '#';

                      const ItemContent = (
                        <div
                          style={{ padding: '10px 48px', fontSize: '13px', color: '#4b5563', cursor: 'pointer', transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
                          onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
                        >
                          {label}
                        </div>
                      );

                      return isObj && href !== '#' ? (
                        <Link key={sidx} href={href} style={{ textDecoration: 'none' }} onClick={onClose}>
                          {ItemContent}
                        </Link>
                      ) : (
                        <div key={sidx}>{ItemContent}</div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '24px', background: '#f9fafb', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  <div style={{ width: 14, height: 14, background: 'currentColor', borderRadius: 2 }} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{displayPhone}</span>
          </div>
        </div>
      </div>
    </>
  );
}
