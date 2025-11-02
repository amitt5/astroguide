/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Turbopack config (required for Next.js 16+)
  turbopack: {},
  // Webpack config for native modules (sweph)
  webpack: (config, { isServer }) => {
    // Handle native modules for sweph
    if (isServer) {
      config.externals = config.externals || []
      // Don't externalize sweph on server side, we need it there
      config.resolve.alias = {
        ...config.resolve.alias,
      }
    }
    
    // Handle .node files (native modules)
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    })

    return config
  },
}

export default nextConfig
