'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ── Mega-menu data ───────────────────────────────────── */
const destinationCols = [
  [
    { name: 'Bali', tag: 'TRENDING', tagClr: '#ef4444', tagBg: '#fef2f2', href: '/packages?dest=Bali' },
    { name: 'Maldives', tag: 'HONEYMOON', tagClr: '#ec4899', tagBg: '#fdf2f8', href: '/packages?dest=Maldives' },
    { name: 'Thailand', tag: 'BUDGET', tagClr: '#f59e0b', tagBg: '#fffbeb', href: '/packages?dest=Thailand' },
    { name: 'Dubai', tag: null, href: '/packages?dest=Dubai' },
    { name: 'Switzerland', tag: null, href: '/packages?dest=Switzerland' },
    { name: 'Vietnam', tag: null, href: '/packages?dest=Vietnam' },
    { name: 'Abu Dhabi', tag: 'POPULAR', tagClr: '#8b5cf6', tagBg: '#f5f3ff', href: '/packages?dest=AbuDhabi' },
  ],
  [
    { name: 'France', tag: null, href: '/packages?dest=France' },
    { name: 'Singapore', tag: null, href: '/packages?dest=Singapore' },
    { name: 'Australia', tag: null, href: '/packages?dest=Australia' },
    { name: 'Spain', tag: null, href: '/packages?dest=Spain' },
    { name: 'South Africa', tag: null, href: '/packages?dest=SouthAfrica' },
    { name: 'Sri Lanka', tag: null, href: '/packages?dest=SriLanka' },
    { name: 'New Zealand', tag: null, href: '/packages?dest=NewZealand' },
  ],
  [
    { name: 'Mauritius', tag: null, href: '/packages?dest=Mauritius' },
    { name: 'Greece', tag: null, href: '/packages?dest=Greece' },
    { name: 'Japan', tag: null, href: '/packages?dest=Japan' },
    { name: 'Malaysia', tag: null, href: '/packages?dest=Malaysia' },
    {
      name: 'Explore 40+ Destinations',
      tag: null,
      href: '/packages',
      isExplore: true,
    },
  ],
];

const packageCols = [
  [
    { name: 'Honeymoon Packages', href: '/packages?type=COUPLE' },
    { name: 'Family Packages', href: '/packages?type=FAMILY' },
    { name: 'Group Packages', href: '/packages?type=GROUP' },
    { name: 'Solo Packages', href: '/packages?type=SOLO' },
  ],
  [
    { name: 'Adventure Tours', href: '/packages?type=ADVENTURE' },
    { name: 'Luxury Tours', href: '/packages?type=LUXURY' },
    { name: 'Budget Tours', href: '/packages?dest=All&price=under50' },
    { name: 'Weekend Getaways', href: '/packages' },
  ],
  [
    { name: 'Beach Holidays', href: '/packages?type=BEACH' },
    { name: 'Wildlife Safaris', href: '/packages?dest=Safari' },
    { name: 'Cultural Tours', href: '/packages?type=CULTURAL' },
    { name: 'View All Packages →', href: '/packages', isExplore: true },
  ],
];

/* ── Tag badge component ──────────────────────────────── */
function Tag({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-block',
      background: bg,
      color: color,
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: 0.8,
      padding: '2px 4px',
      borderRadius: 4,
      marginLeft: 6,
      lineHeight: 1.6,
      verticalAlign: 'middle',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
}

/* ── Mega Dropdown ────────────────────────────────────── */
function MegaDropdown({ label, cols, isTransparent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const linkColor = isTransparent ? 'rgba(255,255,255,0.92)' : '#374151';

  return (
    <li ref={ref} style={{ position: 'relative', listStyle: 'none' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer',
          color: linkColor, fontSize: 14, fontWeight: 600,
          padding: '6px 2px',
          transition: 'color 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!isTransparent) e.currentTarget.style.color = '#026eb5'; }}
        onMouseLeave={e => { if (!isTransparent) e.currentTarget.style.color = '#374151'; }}
      >
        {label}
        <svg
          viewBox="0 0 24 24" fill="currentColor" width="14" height="14"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s',
            opacity: 0.7,
          }}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 14px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: 14,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            padding: '20px 24px',
            display: 'flex',
            gap: 0,
            zIndex: 999,
            animation: 'dropIn 0.2s ease',
            minWidth: 540,
          }}
        >
          {cols.map((col, ci) => (
            <div
              key={ci}
              style={{
                flex: 1,
                paddingRight: ci < cols.length - 1 ? 20 : 0,
                marginRight: ci < cols.length - 1 ? 20 : 0,
                borderRight: ci < cols.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}
            >
              {col.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f9fafb',
                    textDecoration: 'none',
                    color: item.isExplore ? '#026eb5' : '#1f2937',
                    fontWeight: item.isExplore ? 700 : 500,
                    fontSize: 13.5,
                    transition: 'color 0.15s',
                    lineHeight: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#026eb5'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = item.isExplore ? '#026eb5' : '#1f2937'; }}
                >
                  {item.name}
                  {item.tag && (
                    <Tag label={item.tag} color={item.tagClr} bg={item.tagBg} />
                  )}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

/* ── Side Drawer ───────────────────────────────────────── */
function SideDrawer({ isOpen, onClose, allCategories, isLoggedIn, currentUser, onLogout }) {
  const [expanded, setExpanded] = useState(null);

  const toggleExpand = (label) => {
    setExpanded(expanded === label ? null : label);
  };

  const navGroup = [
    { label: 'Testimonial', href: '/testimonials' },
    { label: 'FAQ', href: '/contact#faq' },
    { label: 'Contact us', href: '/contact' },
    { label: 'Blog', href: '/blog' },
    { label: 'About us', href: '/about' },
    ...(isLoggedIn
      ? [{ label: 'My Profile', href: '/profile' }]
      : [{ label: 'Login', href: '/auth/login' }]),
    // Previous static login link kept for reference:
    // { label: 'Login', href: '/auth/login' },
    // { label: 'Careers', href: '/careers' },
    // { label: 'Choose Country', hasSub: true, subItems: ['USA', 'UK', 'Australia', 'UAE'] },
  ];

  const dynamicGroups = (allCategories || []).map(cat => ({
    label: cat.name,
    hasSub: (cat.destinations && cat.destinations.length > 0),
    subItems: (cat.destinations || []).map(dest => ({
      label: dest.name,
      href: `/package/${dest.slug}`
    }))
  }));

  const navGroups = [...dynamicGroups, ...navGroup];

  return (
    <>
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
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>
            Hello, {isLoggedIn ? currentUser?.name?.split(' ')[0] || 'Traveler' : 'Guest'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: '#6b7280' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {navGroups?.map((group, idx) => {
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

                {/* Expanded Sub-items */}
                {group.hasSub && isExpanded && (
                  <div style={{ background: '#fff9f2', paddingBottom: 12 }}>
                    {group.subItems.map((sub, sidx) => {
                      const isObj = typeof sub === 'object';
                      const label = isObj ? sub.label : sub;
                      const href = isObj ? sub.href : '#';

                      const ItemContent = (
                        <div
                          style={{
                            padding: '10px 48px',
                            fontSize: '13px',
                            color: '#4b5563',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                          }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  <div style={{ width: 14, height: 14, background: 'currentColor', borderRadius: 2 }} />
                </div>
              ))}
            </div>
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#dc2626',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                }}
              >
                Sign out
              </button>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>+91 8031274154</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main Navbar ──────────────────────────────────────── */
import {
  AUTH_CHANGED_EVENT,
  clearAuthSession,
  getCategories,
  getDestinationsByCategory,
  getStoredAuth,
  getStoredToken,
} from '@/utils/api';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [atHero, setAtHero] = useState(true);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  const isHeroPage = pathname === '/' || pathname === '/packages' || pathname.startsWith('/package') || pathname.startsWith('/tours') || pathname.startsWith('/about') || pathname.startsWith('/blog') || pathname.startsWith('/contact');

  useEffect(() => {
    const fetchNavbarCategoriesAndDests = async () => {
      const allCats = await getCategories();

      // Helper to fetch destinations for a list of categories
      const enrichCategories = async (cats) => {
        return await Promise.all(
          cats.map(async (cat) => {
            const apiDests = await getDestinationsByCategory(cat.id);
            let mappedItems = apiDests.map(item => {
              const tagStr = item.type ? item.type.split(',')[0].trim().toUpperCase() : null;
              return {
                name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
                href: `/package/${item.slug}`,
                tag: tagStr,
                tagClr: tagStr === 'BEACH' ? '#ef4444' : '#026eb5',
                tagBg: tagStr === 'BEACH' ? '#fef2f2' : '#e0f2fe'
              };
            });

            if (mappedItems.length > 0) {
              mappedItems.push({
                name: `Explore All →`,
                href: `/packages`,
                isExplore: true
              });
            }

            // Distribute into 3 columns automatically
            const columnCount = 3;
            const itemsPerCol = Math.ceil(mappedItems.length / columnCount) || 1;
            const cols = [];
            for (let i = 0; i < mappedItems.length; i += itemsPerCol) {
              cols.push(mappedItems.slice(i, i + itemsPerCol));
            }
            return { ...cat, destinations: apiDests, cols };
          })
        );
      };

      // Filter for Menu (Desktop)
      const menuCatsRaw = allCats.filter(cat => cat.show_in_menu === true);
      const menuCats = await enrichCategories(menuCatsRaw);
      setCategories(menuCats);

      // Filter for Sidebar (Mobile) - Include both menu and sidebar flagged categories
      const sidebarCatsRaw = allCats.filter(cat => cat.show_in_sidebar == true || cat.show_in_menu == true);
      const sidebarCats = await enrichCategories(sidebarCatsRaw);
      setAllCategories(sidebarCats);
    };
    fetchNavbarCategoriesAndDests();
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      const token = getStoredToken();
      setIsLoggedIn(Boolean(token));
      setCurrentUser(getStoredAuth());
    };

    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
    };
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setAtHero(y < 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawerOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  if (pathname?.startsWith('/auth')) {
    return null;
  }

  const isTransparent = isHeroPage && atHero && !scrolled && !drawerOpen;
  const linkColor = isTransparent ? 'rgba(255,255,255,0.92)' : '#374151';

  return (
    <>
      {/* Inject keyframe for dropdown animation */}
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .nav-plain-link {
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          padding: 6px 2px;
          transition: color 0.2s;
          position: relative;
        }
        .nav-plain-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 2px;
          background: #026eb5;
          border-radius: 999px;
          transition: width 0.25s;
        }
        .nav-plain-link:hover::after,
        .nav-plain-link.active::after { width: 100%; }
      `}</style>

      <header
        className={`navbar-custom ${scrolled ? 'scrolled' : ''}`}
        style={{
          background: isTransparent
            ? 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 80%, transparent 100%)'
            : undefined,
        }}
      >
        <div className="container">
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* <img
                src={isTransparent
                  ? "https://i.ibb.co/wNt195HZ/Whats-App-Image-2026-03-27-at-1-12-46-AM-1-copy-2.webp"
                  : "https://i.ibb.co/6cV4xWbm/Whats-App-Image-2026-03-27-at-1-12-46-AM-1-copy.webp"
                }
                alt="ITS TRAVELS AND TOURS Logo"
                style={{ width: 80, height: 80, objectFit: 'contain' }}
              /> */}
              <img
                src={isTransparent
                  ? "/logooo.png"
                  : "/logooo.png"
                }
                alt="ITS TRAVELS AND TOURS Logo"
                style={{ width: 142, height: 54, objectFit: 'contain' }}
              />
            </Link>

            {/* Desktop Center Links (Hidden on Mobile) */}
            <ul style={{
              display: 'flex', alignItems: 'center', gap: 28,
              listStyle: 'none', margin: 0, padding: 0,
              flex: 1, justifyContent: 'center'
            }}
              className="d-none d-lg-flex"
            >
              {categories.length > 0 ? (
                categories.map(cat => (
                  <MegaDropdown
                    key={cat.id}
                    label={cat.name}
                    cols={cat.cols && cat.cols.length > 0 ? cat.cols : []}
                    isTransparent={isTransparent}
                  />
                ))
              ) : (
                <>
                  <MegaDropdown label="Explore Destinations" cols={destinationCols} isTransparent={isTransparent} />
                  <MegaDropdown label="Holiday Tour Packages" cols={packageCols} isTransparent={isTransparent} />
                </>
              )}
            </ul>

            {/* Right side controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>

              {/* Previous static login button kept for reference:
              <Link href="/auth/login" className="d-none d-lg-inline-flex">Login</Link>
              */}
              {isLoggedIn ? (
                <Link
                  href="/profile"
                  className="d-none d-lg-inline-flex"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: isTransparent ? '1.5px solid rgba(255,255,255,0.6)' : '1.5px solid #d1d5db',
                    color: isTransparent ? 'white' : '#374151',
                    fontWeight: 600, fontSize: 13,
                    textDecoration: 'none',
                    background: isTransparent ? 'rgba(255,255,255,0.1)' : 'white',
                    backdropFilter: 'blur(6px)',
                    transition: 'all 0.2s',
                  }}
                >
                  My Profile
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="d-none d-lg-inline-flex"
                  style={{
                    padding: '8px 22px',
                    borderRadius: 8,
                    border: isTransparent ? '1.5px solid rgba(255,255,255,0.6)' : '1.5px solid #d1d5db',
                    color: isTransparent ? 'white' : '#374151',
                    fontWeight: 600, fontSize: 13,
                    textDecoration: 'none',
                    background: isTransparent ? 'rgba(255,255,255,0.1)' : 'white',
                    backdropFilter: 'blur(6px)',
                    transition: 'all 0.2s',
                  }}
                >
                  Login
                </Link>
              )}

              {/* Hamburger Button / Drawer Toggle */}
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  background: isTransparent ? 'rgba(255,255,255,0.15)' : '#f9fafb',
                  border: isTransparent ? '1.5px solid rgba(255,255,255,0.3)' : '1.5px solid #e5e7eb',
                  borderRadius: 8, padding: '7px 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isTransparent ? 'white' : '#374151',
                  cursor: 'pointer',
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Sidebar Drawer Component */}
      <SideDrawer
        allCategories={allCategories}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={clearAuthSession}
      />
    </>
  );
}
