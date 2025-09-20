/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add these lines to ignore errors during the build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;