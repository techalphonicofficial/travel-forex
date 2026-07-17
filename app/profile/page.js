'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  changeCustomerPassword,
  getCustomerProfile,
  getStoredToken,
} from '@/utils/api';

const formatDate = (value) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const token = getStoredToken();

      if (!token) {
        toast.error('Please login to view your profile.');
        router.replace('/auth/login');
        return;
      }

      try {
        const response = await getCustomerProfile();
        setProfile(response.data);
      } catch (error) {
        const message = error.response?.data?.message || 'Unable to load your profile.';
        toast.error(message);

        if (error.response?.status === 401) {
          router.replace('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const initials = useMemo(() => {
    if (!profile?.name) return 'TH';
    return profile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [profile?.name]);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSaving(true);

    try {
      const response = await changeCustomerPassword({ password });
      toast.success(response.message || 'Password updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to update password.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const infoItems = [
    { label: 'Full name', value: profile?.name },
    { label: 'Email address', value: profile?.email },
    { label: 'Phone number', value: profile?.phone_number },
    { label: 'Account type', value: profile?.type },
    { label: 'Status', value: profile?.status ? 'Active' : 'Inactive' },
    { label: 'Joined on', value: formatDate(profile?.created_at) },
  ];

  return (
    <div style={{ background: 'var(--color-bg-soft)', minHeight: '100vh', paddingBottom: 80 }}>
      <section
        className="profile-hero"
        style={{
          background: 'linear-gradient(135deg, #0a0f1e 0%, #0d2060 100%)',
          color: 'white',
          padding: '150px 24px 70px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 720 }}>
            <span style={{ color: '#9cc7ff', fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
              Customer Account
            </span>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 900, margin: '12px 0 14px' }}>
              My Profile
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 17, maxWidth: 560, lineHeight: 1.7, margin: 0 }}>
              View your account details and keep your password fresh for future bookings.
            </p>
          </div>
        </div>
      </section>

      <div className="container profile-content" style={{ marginTop: -34 }}>
        {loading ? (
          <div className="card-base" style={{ padding: 28 }}>
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: '86%' }} />
          </div>
        ) : (
          <div className="dashboard-layout" style={{ alignItems: 'start' }}>
            <aside className="dashboard-sidebar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                    {profile?.name || 'Traveler'}
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0, wordBreak: 'break-word' }}>
                    {profile?.email || 'No email'}
                  </p>
                </div>
              </div>

              <Link href="/dashboard" className="dashboard-nav-item" style={{ textDecoration: 'none' }}>
                <span>DB</span>
                <span>Dashboard</span>
              </Link>
              {/* Previous package link kept for reference:
              <Link href="/packages" className="dashboard-nav-item" style={{ textDecoration: 'none' }}>
                <span>PK</span>
                <span>Browse Packages</span>
              </Link>
              */}
              <button
                className="dashboard-nav-item"
                onClick={() => router.push('/packages')}
                type="button"
              >
                <span>PK</span>
                <span>Browse Packages</span>
              </button>
            </aside>

            <div style={{ display: 'grid', gap: 24, zIndex:99 }}>
              <section className="card-base" style={{ padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
                      Account Details
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                      Details fetched securely from your customer profile.
                    </p>
                  </div>
                  <span className={profile?.status ? 'badge badge-success' : 'badge badge-danger'}>
                    {profile?.status ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="row g-3">
                  {infoItems.map((item) => (
                    <div key={item.label} className="col-md-6">
                      <div
                        style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 18px',
                          background: 'var(--color-bg)',
                          minHeight: 86,
                        }}
                      >
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 }}>
                          {item.label}
                        </div>
                        <div style={{ color: 'var(--color-text-primary)', fontSize: 16, fontWeight: 700, wordBreak: 'break-word' }}>
                          {item.value || 'Not available'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card-base" style={{ padding: 28 }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
                  Change Password
                </h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
                  Enter a new password with at least 8 characters.
                </p>

                <form onSubmit={handlePasswordSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="new-password">New password</label>
                      <input
                        className="form-input"
                        id="new-password"
                        minLength={8}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter new password"
                        required
                        type="password"
                        value={password}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="confirm-password">Confirm password</label>
                      <input
                        className="form-input"
                        id="confirm-password"
                        minLength={8}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm new password"
                        required
                        type="password"
                        value={confirmPassword}
                      />
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    disabled={saving}
                    style={{ marginTop: 22, opacity: saving ? 0.7 : 1 }}
                    type="submit"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          .profile-hero {
            padding: 118px 20px 58px !important;
          }

          .profile-content {
            margin-top: 18px !important;
          }

          .profile-content :global(.dashboard-layout) {
            gap: 22px;
          }

          .profile-content :global(.dashboard-sidebar),
          .profile-content :global(.card-base) {
            border-radius: 16px;
          }
        }

        @media (max-width: 420px) {
          .profile-hero {
            padding: 112px 18px 54px !important;
          }

          .profile-content {
            margin-top: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
