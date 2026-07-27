import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Ubah menjadi 'true' jika ingin mengaktifkan mode maintenance
const IS_MAINTENANCE = false
const LOCALE_COOKIE = 'meteorit-locale'

function detectLocaleFromCountry(country: string | undefined) {
  if (country === 'MY' || country === 'SG' || country === 'BN') return 'ms'
  if (country === 'JP') return 'ja'
  if (country === 'CN' || country === 'TW' || country === 'HK') return 'zh'
  if (country && country !== 'ID') return 'en'
  return 'id'
}

export function middleware(request: NextRequest) {
  if (IS_MAINTENANCE) {
    // Trik: Tampilkan respons HTML maintenance langsung tanpa redirect
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <title>Maintenance - Meteorit Indonesia</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 100px 20px; background: #0f172a; color: #fff; }
          h1 { color: #f59e0b; }
        </style>
      </head>
      <body>
        <h1>Sistem Sedang Maintenance 🛠️</h1>
        <p>Website Meteorit Indonesia sedang dalam peningkatan sistem. Kami akan segera kembali!</p>
      </body>
      </html>
      `,
      {
        status: 503, // Status HTTP Service Unavailable (Bagus untuk SEO agar Google tahu ini sementara)
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }
    )
  }

  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value

  if (!existingLocale) {
    const country =
      request.geo?.country ||
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      'ID'
    const detectedLocale = detectLocaleFromCountry(country)

    // Set cookie on request so that server components can read it on first render
    request.cookies.set(LOCALE_COOKIE, detectedLocale)
    
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    })

    response.cookies.set(LOCALE_COOKIE, detectedLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
    })
    return response
  }

  return NextResponse.next()
}

// Menargetkan seluruh halaman di website Anda
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|pwa-icons).*)',
}
