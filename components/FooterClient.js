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
  { icon: 'tw', label: 'Twitter', href: '#' },
  { icon: 'ig', label: 'Instagram', href: '#' },
  { icon: 'yt', label: 'YouTube', href: '#' },
];

const trustFallback = [
  { icon: 'shield', text: 'Secure Payments' },
  { icon: 'plane', text: '24/7 Support' },
  { icon: 'star', text: '50K+ Happy Guests' },
  { icon: 'award', text: 'Award-winning' },
];

const socialIconPaths = {
  fb: 'M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z',
  tw: 'M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z',
  ig: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  yt: 'M21.582 7.166a2.506 2.506 0 0 0-1.765-1.769C18.265 5 12 5 12 5s-6.264 0-7.817.397A2.506 2.506 0 0 0 2.418 7.17 26.258 26.258 0 0 0 2 12a26.258 26.258 0 0 0 .418 4.834A2.506 2.506 0 0 0 4.183 18.6C5.736 18.997 12 19 12 19s6.264 0 7.817-.397A2.507 2.507 0 0 0 21.582 16.9 26.258 26.258 0 0 0 22 12a26.258 26.258 0 0 0-.418-4.834zM10 15V9l5.196 3L10 15z',
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
    { key: 'twitter', icon: 'tw', label: 'Twitter' },
    { key: 'instagram', icon: 'ig', label: 'Instagram' },
    { key: 'youtube', icon: 'yt', label: 'YouTube' },
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_IMAGE_URL || 'https://row-honolulu-alter-modeling.trycloudflare.com/';
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
    <footer className="footer">
      <div className="section-sm">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <Image src={brandLogo} alt={`${brandName} Logo`} width={100} height={100} style={{ width: 100, height: 100, objectFit: 'contain' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.8, maxWidth: 320, marginBottom: 24 }}>
                {brandDescription}
              </p>

              <div className="d-flex flex-column gap-2 mb-4">
                {phone && (
                  <a href={`tel:${phone}`} className="d-flex align-items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                    <span>{phone}</span>
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="d-flex align-items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                    <span>{email}</span>
                  </a>
                )}
              </div>

              <div className="footer-social">
                {socialLinks.map(({ icon, label, href }) => (
                  <a key={label} href={href} className="footer-social-btn" aria-label={label} target="_blank" rel="noreferrer">
                    <SocialIcon icon={icon} />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section} className="col-6 col-lg-2">
                <h4 className="footer-heading">{section}</h4>
                <ul className="list-unstyled mb-0">
                  {links.map(({ label, href }) => (
                    <li key={`${section}-${label}`}>
                      <Link href={href} className="footer-link">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-lg-2">
              <h4 className="footer-heading">Trust & Safety</h4>
              <div className="d-flex flex-column gap-3">
                {trustItems.map(({ icon, text }) => (
                  <div key={text} className="d-flex align-items-center gap-2" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                    <TrustIcon icon={icon} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          <div className="py-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0, whiteSpace: 'pre-line' }}>
              {footerContent}
            </p>
            <div className="d-flex gap-4">
              <Link href="/privacy" className="footer-bottom-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-bottom-link">Terms of Service</Link>
              <Link href="/cookies" className="footer-bottom-link">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-bottom-link {
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-bottom-link:hover {
          color: white;
        }
      `}</style>
    </footer>
  );
}
