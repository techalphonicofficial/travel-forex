'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success('🎉 Subscribed! Welcome to the ITS TRAVELS AND TOURS community.');
    setEmail('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: 10,
        background: 'white',
        borderRadius: 'var(--radius-2xl)',
        padding: 8,
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
      }}
    >
      <input
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          padding: '10px 16px',
          fontSize: 15,
          background: 'transparent',
          color: 'var(--color-text-primary)',
        }}
      />
      <button type="submit" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.75 : 1 }}>
        {loading ? 'Subscribing...' : 'Subscribe'}
      </button>
    </form>
  );
}
