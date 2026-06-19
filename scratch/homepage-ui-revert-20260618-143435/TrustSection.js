// Trust logos strip + stats bar - Server Component (no interactivity needed)
const fallbackItems = [
  { img: '🏅Best Tour Operator 2024', lbl: 'Emirates' },
  { img: "⭐TripAdvisor Travelers' Choice", lbl: 'Singapore Airlines' },
  { img: '🌍National Geographic Partner', lbl: 'Air India' },
  { img: '🔒ISO 27001 Certified', lbl: 'Marriott' },
  { img: '', lbl: 'Hilton' },
  { img: '', lbl: 'Hyatt' },
  { img: '', lbl: 'Airbnb' },
  { img: '', lbl: 'Booking.com' },
];

const splitAward = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const firstCodePoint = Array.from(trimmed)[0];
  const label = trimmed.slice(firstCodePoint.length).trim();
  const hasIcon = /[^\w\s.,'-]/u.test(firstCodePoint);

  return {
    icon: hasIcon ? firstCodePoint : '✓',
    label: hasIcon && label ? label : trimmed,
  };
};

export default function TrustSection({ section }) {
  const items = Array.isArray(section?.json_data?.images) && section.json_data.images.length
    ? section.json_data.images
    : fallbackItems;

  const partners = items.map((item) => item?.lbl).filter(Boolean);
  const awards = items.map((item) => splitAward(item?.img)).filter(Boolean);
  const heading = section?.title || 'Our Trusted Partner';

  return (
    <section style={{ background: 'white', borderTop: '1px solid var(--color-primary-light)', padding: '32px 0' }}>
      <div className="container">
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 20 }}>
          {heading}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, flexWrap: 'wrap', marginBottom: awards.length ? 28 : 0 }}>
          {partners.map((partner) => (
            <span key={partner} style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: '#9ca3af', letterSpacing: -0.3 }}>
              {partner}
            </span>
          ))}
        </div>

        {awards.length > 0 && (
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
        )}
      </div>
    </section>
  );
}
