import Navbar from '@/components/Navbar';

export default function TermsOfService() {
  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1f2937, #111827, #4c1d95)', position: 'relative', overflow: 'hidden' }}>
        <Navbar />
        <div style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
            Terms of Service
          </h1>
          <p style={{ color: '#c4b5fd', fontSize: 18, maxWidth: 800, margin: '0 auto', lineHeight: 1.6 }}>
            The legal agreements and operational framework governing your relationship with WanderLust.
          </p>
        </div>
      </div>

      <div className='container' style={{ margin: '-40px auto 0', position: 'relative', zIndex: 20, background: 'white', padding: '60px', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40, fontWeight: 600 }}>Last Updated: March 2026</p>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>1. Agreement to Terms</h2>
          <p>By accessing or using our platform, you confirm your agreement to be bound by these Terms. If you do not agree, you may not access our travel services or book an itinerary through our systems.</p>
        </section>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>2. Booking Operations and Third Parties</h2>
          <p>Our company acts as an intermediary connecting clients with airlines, ground handlers, and lodging systems. As such, the specific responsibilities of the tour realization rest upon the localized vendors. You fully indemnify WanderLust against direct disruption resulting from third-party operational capacity issues.</p>
        </section>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>3. Visas & Documentation</h2>
          <p>The traveler is exclusively financially and logistically responsible for securing proper Visas, Passports, and health declarations for any international travel booked via our platform.</p>
        </section>
      </div>
    </main>
  );
}
