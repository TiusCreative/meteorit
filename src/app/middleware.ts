import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Ubah menjadi 'true' jika ingin mengaktifkan mode maintenance
const IS_MAINTENANCE = true 

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

  return NextResponse.next()
}

// Menargetkan seluruh halaman di website Anda
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|pwa-icons).*)',
}