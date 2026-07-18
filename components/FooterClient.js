'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const fallbackFooterLinks = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Team', href: '/about#team' },
    { label: 'Sitemap', href: '/sitemap' },
    { label: 'Blog', href: '/blog' },
  ],
  Explore: [
    { label: 'All Tours', href: '/tours' },
    { label: 'Beach & Relax', href: '/tour?type=Beach' },
    { label: 'Adventure', href: '/tour?type=Adventure' },
    { label: 'Cultural', href: '/tour?type=Cultural' },
    { label: 'Luxury', href: '/tour?type=Luxury' },
  ],
  Support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/contact#faq' },
    { label: 'Booking Help', href: '#' },
    { label: 'Cancellation Policy', href: '/cancellation' },
    { label: 'Travel Insurance', href: '#' },
  ],
};

const fallbackSocialLinks = [
  { icon: 'fb', label: 'Facebook', href: '#' },
  { icon: 'tw', label: 'X', href: '#' },
  { icon: 'ig', label: 'Instagram', href: '#' },
  { icon: 'li', label: 'LinkedIn', href: '#' },
];

const trustFallback = [
  { icon: 'shield', text: 'Secure Payments' },
  { icon: 'plane', text: '24/7 Support' },
  { icon: 'star', text: '50K+ Happy Guests' },
  { icon: 'award', text: 'Award-winning' },
];

const socialIconPaths = {
  fb: 'M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z',
  tw: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  ig: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  li: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z',
};

const trustIconPaths = {
  shield: 'M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 2.2 6 2.25V11c0 3.9-2.45 7.6-6 8.85C8.45 18.6 6 14.9 6 11V6.45l6-2.25Z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z',
  star: 'm12 2 2.9 6.25 6.85.8-5.05 4.7 1.35 6.75L12 17.1 5.95 20.5l1.35-6.75-5.05-4.7 6.85-.8L12 2Z',
  award: 'M12 2a6 6 0 0 0-3 11.2V22l3-2 3 2v-8.8A6 6 0 0 0 12 2Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
};

const SocialIcon = ({ icon }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d={socialIconPaths[icon]} />
    {icon === 'li' && <circle cx="4" cy="4" r="2" />}
  </svg>
);

const TrustIcon = ({ icon }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d={trustIconPaths[icon] || trustIconPaths.shield} />
  </svg>
);

const normalizeHref = (url) => {
  if (!url) return '#';
  if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

const toTitle = (value) => String(value || '')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeColumns = (columns) => {
  if (!columns || typeof columns !== 'object') return fallbackFooterLinks;

  return Object.entries(columns).reduce((acc, [key, links]) => {
    if (key === 'trust_safety' || !Array.isArray(links) || !links.length) return acc;
    acc[toTitle(key)] = links.map((item) => ({
      label: item.label,
      href: normalizeHref(item.url),
    })).filter((item) => item.label);
    return acc;
  }, {});
};

const normalizeTrustItems = (columns) => {
  const items = columns?.trust_safety;
  if (!Array.isArray(items) || !items.length) return trustFallback;

  return items.map((item, index) => ({
    icon: item.icon || trustFallback[index % trustFallback.length].icon,
    text: item.label,
  })).filter((item) => item.text);
};

const normalizeSocialLinks = (social = {}) => {
  const entries = [
    { key: 'facebook', icon: 'fb', label: 'Facebook' },
    { key: 'twitter', icon: 'tw', label: 'X' },
    { key: 'instagram', icon: 'ig', label: 'Instagram' },
    { key: 'linkedin', icon: 'li', label: 'LinkedIn' },
  ];

  const links = entries
    .map(({ key, icon, label }) => ({ icon, label, href: social[key] }))
    .filter((item) => item.href);

  return links.length ? links : fallbackSocialLinks;
};

const getLogoUrl = (logo) => {
  if (!logo) return '';
  if (/^(https?:|data:|blob:)/i.test(logo)) return logo;
  if (!String(logo).startsWith('/uploads')) return logo;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_IMAGE_URL || 'https://record-places-settle-missing.trycloudflare.com';
  return `${baseUrl.replace(/\/$/, '')}/${String(logo).replace(/^\//, '')}`;
};

export default function FooterClient({ brand, companyInfo }) {
  const pathname = usePathname();
  const footerLinks = normalizeColumns(companyInfo?.footer_columns);
  const trustItems = normalizeTrustItems(companyInfo?.footer_columns);
  const socialLinks = normalizeSocialLinks(companyInfo?.social);
  const brandLogo = getLogoUrl(companyInfo?.company_logo_url) || brand?.logo || '/logooo.png';
  const brandName = brand?.legalName || 'ITS TRAVELS AND TOURS';
  const footerContent = companyInfo?.footer_content || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;
  const brandDescription = brand?.description || 'Crafting unforgettable travel experiences since 2015. We believe every journey should be as extraordinary as the destination.';
  const phone = companyInfo?.contact?.phone || '+91 9999457020';
  const email = companyInfo?.contact?.email || 'itstravels.tours@gmail.com';

  if (pathname?.startsWith('/auth') || pathname === '/customize') {
    return null;
  }

  return (
    <footer className="footer" style={{ background: '#e5fcff', color: '#1f2937' }}>
      <div className="section-sm">
        <div className="container">
          <div className="row g-5 align-items-start">
            <div className="col-lg-4 text-lg-start mobile-text-center">
              <div className="d-flex align-items-center gap-3 mb-4 mobile-center-flex">
                <Image src={brandLogo} alt={`${brandName} Logo`} width={52} height={52} style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: '8px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, textAlign: 'center' }}>
                  <span style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 900,
                    fontSize: '20px',
                    letterSpacing: '1.5px',
                    color: '#0f172a',
                    textTransform: 'uppercase'
                  }}>
                    IT'S
                  </span>
                  <span style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#334155',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.2px'
                  }}>
                    Travels & Tours Private Limited
                  </span>
                </div>
              </div>
              <p className="mobile-mx-auto" style={{ color: '#334155', fontSize: 15, lineHeight: 1.8, maxWidth: 320, marginBottom: 24 }}>
                {brandDescription}
              </p>

              <div className="d-flex flex-column gap-2 mb-4">
                {phone && (
                  <a href={`tel:${phone}`} className="d-flex align-items-center gap-2 mobile-center-flex" style={{ color: '#334155', fontSize: 14, textDecoration: 'none' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                    <span>{phone}</span>
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="d-flex align-items-center gap-2 mobile-center-flex" style={{ color: '#334155', fontSize: 14, textDecoration: 'none' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                    <span>{email}</span>
                  </a>
                )}
              </div>

              <div className="footer-social d-flex gap-2 mobile-center-flex">
                {socialLinks.map(({ icon, label, href }) => (
                  <a key={label} href={href} className={`footer-social-btn footer-social-btn-${icon}`} aria-label={label} target="_blank" rel="noreferrer">
                    <SocialIcon icon={icon} />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section} className="col-12 col-sm-6 col-lg-2 text-lg-start mobile-text-center mb-4 mb-lg-0">
              
                <h4 className="footer-heading mt-0" style={{ color: '#0f172a' }}>{section}</h4>
                <ul className="list-unstyled mb-0">
                  {links.map(({ label, href }) => (
                    <li key={`${section}-${label}`}>
                      <Link href={href} className="footer-link" style={{ color: '#334155' }}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

           
            <div className="col-12 col-sm-6 col-lg-2 text-lg-start mobile-text-center mb-4 mb-lg-0">
              <h4 className="footer-heading mt-0" style={{ color: '#0f172a' }}>Trust & Safety</h4>
              <div className="d-flex flex-column gap-3">
                {trustItems.map(({ icon, text }) => (
                  <div key={text} className="d-flex align-items-center gap-2 mobile-center-flex" style={{ color: '#334155', fontSize: 13 }}>
                    <TrustIcon icon={icon} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="container">
          <div className="py-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
            <p className="mobile-text-center" style={{ color: '#475569', fontSize: 14, margin: 0, whiteSpace: 'pre-line' }}>
              {footerContent}
            </p>
            <div className="d-flex gap-4 flex-wrap mobile-center-flex">
              <Link href="/privacy" className="footer-bottom-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-bottom-link">Terms of Service</Link>
              <Link href="/cookies" className="footer-bottom-link">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-bottom-link {
          color: #475569;
          font-size: 13px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-bottom-link:hover {
          color: #0f172a;
        }

        .footer-social-btn {
          transition: transform 0.2s, filter 0.2s;
        }
        .footer-social-btn:hover {
          transform: scale(1.15);
          filter: brightness(1.1);
        }
        .footer-social-btn-fb { color: #1877F2; }
        .footer-social-btn-tw { color: #000000; }
        .footer-social-btn-ig { color: #E4405F; }
        .footer-social-btn-li { color: #0A66C2; }

        .footer-link:hover {
          color: #0f172a !important;
        }

        /* Responsive Mobile Centering Rules */
        @media (max-width: 991px) {
          .mobile-text-center {
            text-align: center !important;
          }
          .mobile-center-flex {
            justify-content: center !important;
          }
          .mobile-mx-auto {
            margin-left: auto !important;
            margin-right: auto !important;
          }
        }
      `}</style>
    </footer>
  );
}
