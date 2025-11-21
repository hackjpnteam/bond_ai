import type { NextConfig } from "next";

const defaultImageHosts = ['bond-ai.vercel.app'];

const imageHostnames = (process.env.NEXT_IMAGE_ALLOWED_HOSTS || process.env.NEXT_PUBLIC_APP_DOMAIN || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

const resolvedHosts = imageHostnames.length > 0 ? imageHostnames : defaultImageHosts;

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  devIndicators: false,
  images: {
    domains: resolvedHosts,
    remotePatterns: resolvedHosts.map((hostname) => ({
      protocol: 'https',
      hostname,
      pathname: '/**',
    })),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
