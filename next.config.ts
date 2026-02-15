import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'api.ozdemirmakina.com',
      },
      {
        protocol: 'https',
        hostname: 'www.ozdemirmakina.com',
      }
    ],
    unoptimized: true,
  },
};

export default nextConfig;
