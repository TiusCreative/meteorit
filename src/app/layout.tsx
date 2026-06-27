import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ScrollToTop from '@/components/ScrollToTop'
import { getGlobalSettings } from '@/lib/settings'
import CustomTagInjector from '@/components/CustomTagInjector'
import { getSiteUrl } from '@/lib/siteUrl'

const inter = Inter({ subsets: ['latin'] })
const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Meteorit Indonesia - Jelajahi Misteri Batu Langit',
  description: 'Pusat data astronomi, edukasi sains, forum komunitas, dan jembatan transaksi meteorit terpercaya di Indonesia',
  keywords: ['meteorit', 'meteor', 'meteorindonesia', 'meteorit indonesia', 'batu meteor', 'astronomi', 'sains luar angkasa', 'katalog meteor', 'forum astronomi', 'jual beli meteorit'],
  icons: {
    icon: '/pwa-icons/icon-192.png',
    shortcut: '/pwa-icons/icon-192.png',
    apple: '/pwa-icons/icon-192.png',
  },
  appleWebApp: {
    title: 'MeteorHub',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Meteorit Indonesia - Jelajahi Misteri Batu Langit',
    description: 'Pusat data astronomi, edukasi sains, forum komunitas, dan jembatan transaksi meteorit terpercaya di Indonesia',
    url: siteUrl,
    siteName: 'Meteorit Indonesia',
    images: [
      {
        url: '/pwa-icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Meteorit Indonesia Banner',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  // Google Search Console 
  verification: {
    google: 'WKpoj9AcJMKE0E-bv2XzjzArUcbIPF-bi6Bq38RoV3A',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getGlobalSettings()

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* PWA - modern web app capable meta tag */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <CustomTagInjector
          headCode={settings.customHeadCode}
          bodyStartCode={settings.customBodyStartCode}
          bodyEndCode={settings.customBodyEndCode}
        />

        {children}
        <ScrollToTop />
        
        {/* Midtrans Snap Script - SUDAH DIUBAH KE PRODUCTION URL */}
        <Script
          src="https://app.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
