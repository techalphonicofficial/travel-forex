// Trust logos strip + stats bar — Server Component (no interactivity needed)
export default function TrustSection() {
  const partners = [
    'Emirates', 'Singapore Airlines', 'Air India', 'Marriott', 'Hilton', 'Hyatt', 'Airbnb', 'Booking.com'
  ];

  const awards = [
    { icon: '🏅', label: "Best Tour Operator 2024" },
    { icon: '⭐', label: "TripAdvisor Travelers' Choice" },
    { icon: '🌍', label: "National Geographic Partner" },
    { icon: '🔒', label: "ISO 27001 Certified" },
  ];

  return (
    <section style={{ background: 'white', borderTop: '1px solid #c5e5fb', padding: '32px 0' }}>
      <div className="container">
        {/* Partners strip */}
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letteSpacing: 2, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 20 }}>
          Our trusted partners
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 28 }}>
          {partners.map(p => (
            <span key={p} style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: '#9ca3af', letterSpacing: -0.3 }}>{p}</span>
          ))}
        </div>
        {/* Divider */}
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            {awards.map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
