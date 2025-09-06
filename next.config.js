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
  // Updated from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['@prisma/client', 'bcrypt', 'bcryptjs'],
  // We need to allow tracing for dependencies
  outputFileTracing: true,
}

module.exports = nextConfig

module.exports = nextConfig
