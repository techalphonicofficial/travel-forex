'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const footerLinks = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Team', href: '/about#team' },
    { label: 'Sitemap', href: '/sitemap' },
    // { label: 'Careers', href: '#' },
    { label: 'Blog', href: '/blog' },
  ],
  Explore: [
    { label: 'All Tours', href: '/tours' },
    { label: 'Beach & Relax', href: '/tours?type=Beach' },
    { label: 'Adventure', href: '/tours?type=Adventure' },
    { label: 'Cultural', href: '/tours?type=Cultural' },
    { label: 'Luxury', href: '/tours?type=Luxury' },
  ],
  Support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/contact#faq' },
    { label: 'Booking Help', href: '#' },
    { label: 'Cancellation Policy', href: '/cancellation' },
    { label: 'Travel Insurance', href: '#' },
  ],
};

const socialLinks = [
  { icon: 'fb', label: 'Facebook', href: '#' },
  { icon: 'tw', label: 'Twitter', href: '#' },
  { icon: 'ig', label: 'Instagram', href: '#' },
  { icon: 'yt', label: 'YouTube', href: '#' },
];

const SocialIcon = ({ icon }) => {
  const icons = {
    fb: 'M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z',
    tw: 'M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z',
    ig: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    yt: 'M21.582 7.166a2.506 2.506 0 0 0-1.765-1.769C18.265 5 12 5 12 5s-6.264 0-7.817.397A2.506 2.506 0 0 0 2.418 7.17 26.258 26.258 0 0 0 2 12a26.258 26.258 0 0 0 .418 4.834A2.506 2.506 0 0 0 4.183 18.6C5.736 18.997 12 19 12 19s6.264 0 7.817-.397A2.507 2.507 0 0 0 21.582 16.9 26.258 26.258 0 0 0 22 12a26.258 26.258 0 0 0-.418-4.834zM10 15V9l5.196 3L10 15z',
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d={icons[icon]} />
    </svg>
  );
};

export default function Footer() {
  const pathname = usePathname();

  // Hide Footer on auth pages or customize flow
  if (pathname?.startsWith('/auth') || pathname === '/customize') {
    return null;
  }

  return (
    <footer className="footer">
      {/* Main Footer */}
      <div className="section-sm">
        <div className="container">
          <div className="row g-5">
            {/* Brand Column */}
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-4">

                <img src="https://i.ibb.co/wNt195HZ/Whats-App-Image-2026-03-27-at-1-12-46-AM-1-copy-2.webp" alt="Logo" style={{ width: 100, height: 100, objectFit: 'contain' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.8, maxWidth: 320, marginBottom: 24 }}>
                Crafting unforgettable travel experiences since 2015. We believe every journey should be as extraordinary as the destination.
              </p>
              {/* Contact Info */}
              <div className="d-flex flex-column gap-2 mb-4">
                <div className="d-flex align-items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <span>+1 (800) WANDER-1</span>
                </div>
                <div className="d-flex align-items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <span>hello@wanderlusttours.com</span>
                </div>
              </div>
              {/* Social Links */}
              <div className="footer-social">
                {socialLinks.map(({ icon, label, href }) => (
                  <a key={icon} href={href} className="footer-social-btn" aria-label={label}>
                    <SocialIcon icon={icon} />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section} className="col-6 col-lg-2">
                <h4 className="footer-heading">{section}</h4>
                <ul className="list-unstyled mb-0">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="footer-link">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter / Trust badges */}
            <div className="col-lg-2">
              <h4 className="footer-heading">Trust & Safety</h4>
              <div className="d-flex flex-column gap-3">
                {[
                  { icon: '🛡️', text: 'Secure Payments' },
                  { icon: '✈️', text: '24/7 Support' },
                  { icon: '⭐', text: '50K+ Happy Guests' },
                  { icon: '🏆', text: 'Award-winning' },
                ].map(({ icon, text }) => (
                  <div key={text} className="d-flex align-items-center gap-2" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          <div className="py-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0 }}>
              © {new Date().getFullYear()} WanderLust Tours. All rights reserved.
            </p>
            <div className="d-flex gap-4">
              <Link
                href="/privacy"
                style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.target.style.color = 'white')}
                onMouseLeave={(e) => (e.target.style.color = 'rgba(255,255,255,0.45)')}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.target.style.color = 'white')}
                onMouseLeave={(e) => (e.target.style.color = 'rgba(255,255,255,0.45)')}
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.target.style.color = 'white')}
                onMouseLeave={(e) => (e.target.style.color = 'rgba(255,255,255,0.45)')}
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
