/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Mark sweph as external - tells Next.js/Turbopack not to bundle it
  // Since it's a native Node.js module with C/C++ bindings, it should be external
  serverComponentsExternalPackages: ['sweph'],
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
