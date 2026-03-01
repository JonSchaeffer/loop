import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for the production Docker image (copies only what's needed into the runner stage)
  output: 'standalone',
}

export default nextConfig
