import Navbar from '@/components/Navbar';

export default function CancellationPolicy() {
  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1f2937, #111827, #991b1b)', position: 'relative', overflow: 'hidden' }}>
        <Navbar />
        <div style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
            Cancellation & Refund Policy
          </h1>
          <p style={{ color: '#fecaca', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Stuff happens. We completely understand. Here’s everything you need to know about modifying or canceling your trips.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '-40px auto 0', position: 'relative', zIndex: 20, background: 'white', padding: '60px', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40, fontWeight: 600 }}>Last Updated: January 2026</p>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>General Philosophy</h2>
          <p>We believe in flexibility for all our travelers. While some bookings are strictly non-refundable due to airline and hotel policies, our flexible management fee ensures you only pay for what cannot be salvaged from third-party vendor partners.</p>
        </section>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>Standard Schedule</h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: 24 }}>
            <li><strong style={{ color: '#ef4444' }}>60+ days before departure:</strong> 100% refund of base tour price (minus non-refundable airline fees).</li>
            <li><strong style={{ color: '#ef4444' }}>30 to 59 days before departure:</strong> 50% refund on hotels and tour, minus non-refundable airfare.</li>
            <li><strong style={{ color: '#ef4444' }}>Less than 30 days before departure:</strong> 0% refund on package unless standard travel insurance logic kicks in.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>Force Majeure</h2>
          <p>In cases of natural disasters, global pandemics, or extreme political unrest, standard cancellation policies are overridden, and ITS TRAVELS AND TOURS will attempt to issue 100% credits immediately usable towards any future booking.</p>
        </section>

        <div style={{ background: '#ecfdf5', borderLeft: '4px solid #10b981', padding: 24, borderRadius: 8, marginTop: 40 }}>
          <h4 style={{ color: '#047857', margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Have Questions?</h4>
          <p style={{ margin: 0, fontSize: 14, color: '#065f46' }}>Contact our support team 24/7 if you need immediate assistance regarding a cancellation.</p>
        </div>
      </div>
    </main>
  );
}
