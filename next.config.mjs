import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Content-Type", value: "application/xml; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },

  // Expose environment variables to SSR runtime in hosting environments like AWS Amplify
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_KEY: process.env.JWT_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY,
  },
  serverExternalPackages: ['@prisma/client', 'prisma', '.prisma/client'],
  eslint: {
    // Speed up CI builds by skipping lint errors during production build
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable modern bundling features
    optimizePackageImports: ['@mui/material', 'framer-motion', 'lucide-react'],
  },
  webpack: (config, { isServer, nextRuntime, dev, webpack }) => {
    // Prisma MySQL/direct URL: RSC/route webpack often resolves `#main-entry-point` → wasm.js (edge-lite).
    // Force the Node `.prisma/client/index.js` build for Node server only (not Middleware `edge`).
    if (isServer && nextRuntime !== 'edge') {
      const prismaNodeEntry = path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'index.js')
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/\.prisma[\\/]client[\\/]wasm\.js$/i, prismaNodeEntry),
      )
      const prev = config.resolve.conditionNames || []
      config.resolve.conditionNames = ['node', 'require', 'import', 'default', ...prev]
    }

    // Client-only Node polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    // NOTE: A custom splitChunks config used to force *all* node_modules into one
    // ~1 MB 'vendors' chunk that every page downloaded and executed (67% unused,
    // ~6 s of main-thread scripting on mobile). Next.js' built-in granular
    // chunking only ships the libraries each route actually uses, so we rely on it.

    return config
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 80, 96, 128, 200, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1nvnelpyr43e7.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rizwancars.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/quick-delivery-fe107.firebasestorage.app/o/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
