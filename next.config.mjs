/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    project: process.env.project || process.env.NEXT_PUBLIC_PROJECT || process.env.PROJECT || 'Travel_Holiday',
  },
  /*
   * Customers see /hotel-booking/...; the pages still live in
   * app/tripjack-hotels (supplier name stays out of the address bar).
   */
  async redirects() {
    return [
      { source: '/tripjack-hotels', destination: '/hotel-booking', permanent: true },
      { source: '/tripjack-hotels/:path*', destination: '/hotel-booking/:path*', permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: '/hotel-booking', destination: '/tripjack-hotels' },
      { source: '/hotel-booking/:path*', destination: '/tripjack-hotels/:path*' },
    ];
  },
  allowedDevOrigins: ['192.168.1.7', '192.168.29.220', '192.168.1.28','192.168.0.166'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'tourtravel.yber.in',
      },
      {
        protocol: 'https',
        hostname: 'tourtravel.yber.in',
      },
      {
        protocol: 'https',
        hostname: 'lol-jungle-msgid-nicole.trycloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'lol-jungle-msgid-nicole.trycloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'record-places-settle-missing.trycloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'sas-celebrity-seating-vacancies.trycloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'tourtravel.yber.in',
      },
    ],
    qualities: [25, 50, 75, 100],
    formats: ['image/avif', 'image/webp'],
    unoptimized: true,
  },
};

export default nextConfig;
