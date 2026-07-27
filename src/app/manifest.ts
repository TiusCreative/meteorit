import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Meteorit Indonesia',
    short_name: 'Meteorit',
    description: 'Pusat pemantauan benda langit live NASA, pelacakan astronot ISS, satelit EPIC, hingga ensiklopedia meteorit Indonesia dalam satu platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#0891b2',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}

