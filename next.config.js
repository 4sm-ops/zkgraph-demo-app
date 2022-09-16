/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/graph',
	destination: '/html/index.html',
      },
    ]
  }
}

module.exports = nextConfig
