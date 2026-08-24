'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function SitemapPage() {
  const allPages = [
    // Core Pages
    "About Us", "Contact Us", "Privacy Policy", "Cancellation Policy", "Terms of Service", "Travel Blog", "Customer Reviews",
    // Destinations / Packages
    "Abu Dhabi Honeymoon Packages", "Almaty Tour Package", "Alula Honeymoon Packages", "Amalfi Packages", "Amaya Kuda Rah Maldives Package",
    "Amsterdam Tour Packages", "Andaman Tour Packages", "Andaman Family Packages", "Andaman Honeymoon Tour Packages", 
    "Andaman Tour Packages From Ahmedabad", "Andaman Packages From Bangalore", "Andaman Tour Packages From Chennai",
    "Andaman Tour Packages From Delhi", "Andaman Tour Packages From Hyderabad", "Andaman Packages From Kochi",
    "Andaman Tour Packages From Mumbai", "Andaman Tour Packages From Nagpur", "Andaman Tour Packages From Pune",
    "Angkor Wat Cambodia", "Angsana Velavaru Maldives Package", "Antalya Packages", "Antalya Tour Packages From Chennai",
    "Antalya Tour Packages from Delhi", "Antalya Tour Packages from Kolkata", "Antalya Tour Packages From Mumbai", 
    "Antwerp Packages", "Athens Tour Packages", "Athens Tour Packages From Ahmedabad", "Athens Tour Packages From Bangalore", 
    "Athens Tour Packages From Chennai", "Athens Tour Packages From Delhi", "Athens Tour Packages From Hyderabad",
    "Athens Tour Packages From Kolkata", "Athens Tour Packages From Mumbai", "Athens Tour Packages From Pune", 
    "Atlanta Tour Packages", "Auckland Packages", "Australia adventure Packages",
    "Bali Tour Packages", "Bali Honeymoon Packages", "Bali Family Packages", "Bangkok Packages", "Bhutan Packages",
    "Cairns Vacation Packages", "Cambodia Tour Packages", "Cape Town Trips", "Chicago City Tours", "Croatia Packages",
    "Denmark Vacation Packages", "Dubai Family Packages", "Dubai Honeymoon Packages", "Delhi Tour Packages",
    "Egypt Tour Packages", "England Vacation Packages", "Europe Honeymoon Packages", "Europe Backpacking Packages",
    "Fiji Honeymoon Packages", "Finland Packages", "France Tour Packages", "Frankfurt City Breaks",
    "Georgia Tour Packages", "Germany Tours", "Goa Tour Packages", "Greece Honeymoon Packages", "Gulmarg Skiing Packages",
    "Hong Kong Packages", "Hungary Packages", "Hyderabad City Tours", "Helsinki Vacation Packages",
    "Iceland Northern Lights Packages", "India Golden Triangle Tour", "Indonesia Packages", "Italy Honeymoon Packages",
    "Japan Bullet Train Tours", "Japan Sakura Tour Packages", "Jordan Tour Packages", "Jakarta City Breaks",
    "Kazakhstan Packages", "Kashmir Honeymoon Packages", "Kerala Backwaters Tour", "Kyoto Packages",
    "Laos Backpacking", "London Tour Packages", "Los Angeles Packages", "Lucerne Tour Packages",
    "Maldives Honeymoon Packages", "Malaysia Family Packages", "Mauritius Tour Packages", "Melbourne Packages",
    "Nepal Trekking Packages", "Netherlands Tour Packages", "New York Packages", "New Zealand Road Trips",
    "Oman Packages", "Orlando Theme Park Packages", "Osaka Tour Packages", "Oslo City Breaks",
    "Paris Honeymoon Packages", "Philippines Island Hopping", "Prague Tour Packages", "Pune City Tours",
    "Qatar Packages", "Queenstown Adventure Packages", "Quebec City Tours",
    "Rome Tour Packages", "Romania Packages", "Rajasthan Heritage Tours", "Reykjavik Packages",
    "Singapore Tour Packages", "Spain Vacation Packages", "Sri Lanka Surf Packages", "Switzerland Train Tours",
    "Taiwan Packages", "Tanzania Safari Packages", "Thailand Honeymoon Packages", "Turkey Hot Air Balloon Tours",
    "United Kingdom Tours", "USA Road Trips", "Udaipur Honeymoon Packages", "Uzbekistan Packages",
    "Vietnam Packages", "Venice Honeymoon Packages", "Vienna City Breaks", "Vatican City Tours",
    "Washington DC Packages", "Warsaw Tour Packages", "Wales Vacation Packages",
    "Xian Tour Packages", "Xiamen Packages",
    "Yosemite National Park Tours", "Yangon Packages", "Yokohama City Breaks",
    "Zurich Packages", "Zanzibar Honeymoon Packages", "Zagreb Vacation Packages",
  ].sort((a, b) => a.localeCompare(b));

  // Group by first letter
  const groupedPages = allPages.reduce((acc, page) => {
    const firstLetter = page.charAt(0).toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(page);
    return acc;
  }, {});

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1f2937, #111827, #0f172a)', position: 'relative', overflow: 'hidden' }}>
        <Navbar />
        <div style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
            Platform Sitemap
          </h1>
          <p style={{ color: '#93c5fd', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Navigate through our extensive collection of hand-crafted global destinations and tour packages.
          </p>
        </div>
      </div>

      <div style={{ 
        maxWidth: 1200, margin: '-40px auto 0', padding: '60px 40px', position: 'relative', zIndex: 20, 
        background: 'white', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' 
      }}>
        
        {/* Top Award Badge Mock */}
        <div style={{ 
          position: 'absolute', top: 0, right: 40, width: 80, height: 90, 
          background: '#047857', borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 20px rgba(4,120,87,0.2)'
        }}>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 700, marginTop: 10 }}>#1 in India</span>
          <span style={{ fontSize: 24, marginTop: 4 }}>🏆</span>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4b5563', margin: 0 }}>
            Showing all {allPages.length} pages
          </h2>
        </div>

        {/* A-Z Navigation Bar */}
        <div style={{ 
          padding: '24px 0', 
          borderTop: '1px dashed #d1d5db', 
          borderBottom: '1px dashed #d1d5db', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px', 
          flexWrap: 'wrap',
          marginBottom: 40
        }}>
          {alphabet.map((letter) => (
            <a 
              key={letter} 
              href={`#letter-${letter}`} 
              style={{ 
                color: groupedPages[letter] ? '#374151' : '#d1d5db', 
                fontWeight: 800, 
                fontSize: 16, 
                textDecoration: 'none',
                pointerEvents: groupedPages[letter] ? 'auto' : 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => groupedPages[letter] && (e.target.style.color = '#047857')}
              onMouseLeave={e => groupedPages[letter] && (e.target.style.color = '#374151')}
            >
              {letter}
            </a>
          ))}
        </div>

        {/* Grouped Lists */}
        <div>
          {Object.keys(groupedPages).sort().map(letter => (
            <div 
              key={letter} 
              id={`letter-${letter}`} 
              style={{ 
                display: 'flex', 
                gap: '24px', 
                padding: '40px 0', 
                borderBottom: '1px dashed #e5e7eb',
                alignItems: 'flex-start'
              }}
            >
              <h3 style={{ 
                fontSize: 24, 
                fontWeight: 900, 
                color: '#111827', 
                width: '60px',
                margin: 0,
                paddingTop: 4
              }}>
                {letter}
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '12px 24px', 
                flex: 1 
              }}>
                {groupedPages[letter].map(pageName => (
                  <Link 
                    key={pageName} 
                    href={`/packages?dest=${encodeURIComponent(pageName.split(' ')[0])}`}
                    style={{
                      color: '#6b7280', fontSize: 13, textDecoration: 'none',
                      display: 'block', padding: '4px 0', transition: 'color 0.2s'
                    }}
                  >
                    <span 
                      onMouseEnter={e => Object.assign(e.target.style, { color: '#047857', textDecoration: 'underline' })}
                      onMouseLeave={e => Object.assign(e.target.style, { color: '#6b7280', textDecoration: 'none' })}
                    >
                      {pageName}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
