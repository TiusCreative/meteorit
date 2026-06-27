import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Meteorit Indonesia',
    short_name: 'MeteorHub',
    description: 'Pusat data astronomi, edukasi sains, forum komunitas, dan jembatan transaksi meteorit terpercaya di Indonesia',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#0891b2',
    icons: [
      {
        src: '/pwa-icons/icon-72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/pwa-icons/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/pwa-icons/icon-128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/pwa-icons/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/pwa-icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/pwa-icons/icon-256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/pwa-icons/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/pwa-icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
