/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mppx', 'hono'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    }
    return config
  },
}

export default nextConfig
