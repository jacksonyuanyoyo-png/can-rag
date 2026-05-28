/** @type {import('next').NextConfig} */
const apiProxyTarget = (process.env.API_PROXY_TARGET || 'http://localhost:8000').replace(
  /\/+$/,
  '',
)

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
