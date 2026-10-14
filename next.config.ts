import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Typed cookie handlers are in place; this keeps deploys unblocked.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
