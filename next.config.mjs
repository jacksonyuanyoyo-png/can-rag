import { getApiProxyTarget } from './env.mjs'

/** @type {import('next').NextConfig} */
const apiProxyTarget = getApiProxyTarget()

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    // pdfjs-dist breaks under webpack eval-* devtool (Object.defineProperty on non-object)
    if (dev && !isServer) {
      config.devtool = "cheap-module-source-map"
    }
    return config
  },
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${apiProxyTarget}/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
