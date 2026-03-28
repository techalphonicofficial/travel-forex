import Navbar from '@/components/Navbar';

export default function PrivacyPolicy() {
  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1f2937, #111827, #064e3b)', position: 'relative', overflow: 'hidden' }}>
        <Navbar />
        <div style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#a7f3d0', fontSize: 18, maxWidth: 800, margin: '0 auto', lineHeight: 1.6 }}>
            Transparency and security are at the core of ITS TRAVELS AND TOURS. Learn how we handle and protect your personal data.
          </p>
        </div>
      </div>

      <div className='container' style={{ margin: '-40px auto 0', position: 'relative', zIndex: 20, background: 'white', padding: '60px', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40, fontWeight: 600 }}>Last Updated: March 2026</p>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, initiate a booking, sign up for our newsletter, or communicate with us. This includes your name, email address, postal address, phone number, passport details, and payment information.</p>
        </section>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>2. How We Use Your Information</h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: 24 }}>
            <li>To facilitate your travel bookings and manage your itinerary.</li>
            <li>To send you transactional messages, including confirmations, updates, and security alerts.</li>
            <li>To respond to your comments, questions, and requests for customer service.</li>
            <li>To personalize your experience and provide tailored travel recommendations.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>3. Data Security</h2>
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. We use industry-standard encryption protocols when transferring your financial data.</p>
        </section>
      </div>
    </main>
  );
}
