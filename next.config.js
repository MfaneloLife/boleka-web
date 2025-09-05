/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // This helps with Prisma and bcrypt in server components
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt', 'bcryptjs'],
  },
  // We need to allow storing SQLite files
  outputFileTracing: true,
}

module.exports = nextConfig
