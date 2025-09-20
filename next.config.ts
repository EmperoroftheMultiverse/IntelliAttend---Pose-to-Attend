import type { NextConfig } from 'next';

const config: NextConfig = {
  // Add these lines to ignore errors during the build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default config;