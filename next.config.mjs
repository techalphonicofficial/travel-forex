/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    project: process.env.project || process.env.NEXT_PUBLIC_PROJECT || process.env.PROJECT || 'Travel_Holiday',
  },
  allowedDevOrigins: ['192.168.1.7', '192.168.29.220', '192.168.1.28'],
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
        hostname: 'peninsula-surplus-ray-appraisal.trycloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'diagnosis-qualification-vhs-army.trycloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'vocal-professionals-publicly-balanced.trycloudflare.com',
      },
    ],
    qualities: [25, 50, 75, 100],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
