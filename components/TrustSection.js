// Trust logos strip + stats bar - Server Component (no interactivity needed)
const fallbackItems = [
  { img: 'Best Tour Operator 2024', lbl: 'Emirates' },
  { img: "TripAdvisor Travelers' Choice", lbl: 'Singapore Airlines' },
  { img: 'National Geographic Partner', lbl: 'Air India' },
  { img: 'ISO 27001 Certified', lbl: 'Marriott' },
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
    icon: hasIcon ? firstCodePoint : 'OK',
    label: hasIcon && label ? label : trimmed,
  };
};

export default function TrustSection({ section }) {
  const items = Array.isArray(section?.json_data?.images) && section.json_data.images.length
    ? section.json_data.images
    : fallbackItems;

  const partners = items.map((item) => item?.lbl).filter(Boolean);
  const awards = items.map((item) => splitAward(item?.img)).filter(Boolean);
  const heading = section?.title || 'Our Trusted Partners';

  return (
    <section style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-primary-light)', borderBottom: '1px solid var(--color-border)', padding: '34px 0' }}>
      <div className="container">
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginBottom: 20 }}>
          {heading}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, flexWrap: 'wrap', marginBottom: awards.length ? 24 : 0 }}>
          {partners.map((partner) => (
            <span key={partner} style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: '#64748b', letterSpacing: 0 }}>
              {partner}
            </span>
          ))}
        </div>

        {awards.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {awards.map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 999, padding: '7px 12px', background: '#f8fafc' }}>
                  <span style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 900 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
