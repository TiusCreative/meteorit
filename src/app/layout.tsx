import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ScrollToTop from '@/components/ScrollToTop'
import MeteoritChatbot from '@/components/MeteoritChatbot'
import PushNotificationManager from '@/components/PushNotificationManager'
import { getGlobalSettings } from '@/lib/settings'
import CustomTagInjector from '@/components/CustomTagInjector'
import { getSiteUrl } from '@/lib/siteUrl'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Meteorit Indonesia - Jelajahi Alam Semesta dan Pemantauan Langit Real-Time',
  description: 'Pusat data astronomi, edukasi sains, forum komunitas, dan jembatan transaksi meteorit terpercaya di Indonesia',
  keywords: ['meteorit', 'meteor', 'meteorindonesia', 'meteorit indonesia', 'batu meteor', 'astronomi', 'sains luar angkasa', 'katalog meteor', 'forum astronomi', 'jual beli meteorit'],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
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
        url: '/logo.png',
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
        {/* Google AdSense */}
        <meta name="google-adsense-account" content="ca-pub-9511274459054303" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9511274459054303"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        {/* Google Analytics: Measurement ID G-X4F6EB07D4 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-X4F6EB07D4" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-X4F6EB07D4', { page_path: window.location.pathname });`}
        </Script>
        <CustomTagInjector
          headCode={settings.customHeadCode}
          bodyStartCode={settings.customBodyStartCode}
          bodyEndCode={settings.customBodyEndCode}
        />

        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <ScrollToTop />
          <MeteoritChatbot />
          <PushNotificationManager />
        </ThemeProvider>
      </body>
    </html>
  )
}
