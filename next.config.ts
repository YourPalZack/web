import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@aquabuilder/ui', '@aquabuilder/core', '@aquabuilder/db'],
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'images.amazon.com' },
      { protocol: 'https', hostname: 'media-amazon.com' },
    ],
  },
};

export default nextConfig;
