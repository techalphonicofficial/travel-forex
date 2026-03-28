import Navbar from '@/components/Navbar';

export default function CookiePolicy() {
  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1f2937, #111827, #b45309)', position: 'relative', overflow: 'hidden' }}>
        <Navbar />
        <div style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
            Cookie Policy
          </h1>
          <p style={{ color: '#fde68a', fontSize: 18, maxWidth: 800, margin: '0 auto', lineHeight: 1.6 }}>
            Transparency in how we use digital trackers to optimize your online booking experience.
          </p>
        </div>
      </div>

      <div className='container' style={{ margin: '-40px auto 0', position: 'relative', zIndex: 20, background: 'white', padding: '60px', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40, fontWeight: 600 }}>Last Updated: January 2026</p>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>What Are Cookies?</h2>
          <p>Cookies are small snippets of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third party to recognize you, making your next trip easier and our Service more useful to you.</p>
        </section>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>How We Use Cookies</h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: 24 }}>
            <li><strong style={{ color: '#d97706' }}>Essential Cookies:</strong> We use these to authenticate users and prevent fraudulent use of user booking accounts.</li>
            <li><strong style={{ color: '#d97706' }}>Analytics Cookies:</strong> Utilized to track information how the platform is used so that we can make logistical improvements.</li>
            <li><strong style={{ color: '#d97706' }}>Advertising Cookies:</strong> Targeted cookies are placed by third-party advertising partners to track engagement across the web.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40, color: '#4b5563', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>Your Choices Regarding Cookies</h2>
          <p>If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your respective web browser. Please note that if you delete cookies or refuse to accept them, you might not be able to use certain booking features we offer.</p>
        </section>
      </div>
    </main>
  );
}
