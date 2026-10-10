/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aktifkan Next.js image optimization (resize, WebP conversion, caching)
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 jam cache di edge
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev' },
      { protocol: 'https', hostname: 'assets.science.nasa.gov' },
      { protocol: 'https', hostname: 'science.nasa.gov' },
      { protocol: 'https', hostname: 'apod.nasa.gov' },
      { protocol: 'https', hostname: '**.nasa.gov' },
      { protocol: 'https', hostname: 'epic.gsfc.nasa.gov' },
      { protocol: 'https', hostname: 'server.arcgisonline.com' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: '**.wp.com' },
      { protocol: 'https', hostname: 'www.nasa.gov' },
      { protocol: 'https', hostname: '**.imgur.com' },
    ],
    // Fallback untuk URL yang tidak terdaftar (agar tidak error)
    dangerouslyAllowSVG: false,
  },
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Compress output HTML
  compress: true,
  // Powered-by header (keamanan minor)
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache halaman statis di edge selama 5 menit
        source: '/((?!api|admin).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.devtool = false;
    }
    return config;
  },
};

module.exports = nextConfig;
