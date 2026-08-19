import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },

  // Prevent Next from resolving Prisma to the WASM/edge bundle (requires prisma:// / Accelerate).
  // Keeps Node engine + mysql:// DATABASE_URL working in App Router route handlers.
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

    // Aggressive splitChunks breaks Next dev HMR (undefined `.call` in module factories).
    // Keep custom chunking for production client only.
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            mui: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: 'mui',
              chunks: 'all',
              priority: 10,
            },
            framer: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      }
    }

    return config
  },
  images: {
    remotePatterns: [
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
      }
    ],
  },
};

export default nextConfig;
