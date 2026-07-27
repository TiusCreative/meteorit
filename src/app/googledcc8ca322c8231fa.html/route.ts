import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return new NextResponse('google-site-verification: googledcc8ca322c8231fa.html', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
