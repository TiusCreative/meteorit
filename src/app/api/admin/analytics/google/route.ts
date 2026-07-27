import { NextResponse } from 'next/server';
import { createSign } from 'crypto';
import { getGlobalSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function normalizePrivateKey(key: string) {
  return key.replace(/\\n/g, '\n');
}

function normalizePropertyId(value?: string) {
  const settingsValue = (value || '').trim();
  const envValue = (process.env.GOOGLE_ANALYTICS_PROPERTY_ID || process.env.GA_PROPERTY_ID || '').trim();
  const raw = settingsValue && !settingsValue.startsWith('G-') ? settingsValue : envValue;
  if (!raw) return '';
  return raw.replace(/^properties\//, '');
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: GA_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }));
  const unsignedJwt = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256')
    .update(unsignedJwt)
    .sign(normalizePrivateKey(privateKey));
  const jwt = `${unsignedJwt}.${base64Url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Gagal mengambil token Google.');
  }

  return data.access_token as string;
}

async function gaRequest(propertyId: string, accessToken: string, endpoint: 'runReport' | 'runRealtimeReport', body: object) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Google Analytics API error: ${res.status}`);
  }

  return data;
}

function metricValue(report: any, metricName: string) {
  const index = report.metricHeaders?.findIndex((metric: any) => metric.name === metricName) ?? -1;
  if (index < 0) return 0;
  const value = report.rows?.[0]?.metricValues?.[index]?.value;
  return Number(value || 0);
}

export async function GET() {
  try {
    const settings = await getGlobalSettings();
    const propertyId = normalizePropertyId(settings.googleAnalyticsPropertyId);
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GA_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '';
    const privateKey = process.env.GOOGLE_PRIVATE_KEY || process.env.GA_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';

    if (!propertyId || propertyId.startsWith('G-')) {
      return NextResponse.json({
        success: false,
        configured: false,
        reason: 'PROPERTY_ID_REQUIRED',
        message: 'Isi Google Analytics Property ID numerik, bukan Measurement ID yang diawali G-.',
      });
    }

    if (!clientEmail || !privateKey) {
      return NextResponse.json({
        success: false,
        configured: false,
        reason: 'SERVICE_ACCOUNT_REQUIRED',
        message: 'Tambahkan GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY atau kredensial FIREBASE_ADMIN agar dashboard admin bisa membaca GA4.',
      });
    }

    const accessToken = await getAccessToken(clientEmail, privateKey);
    const [realtime, last30Days] = await Promise.all([
      gaRequest(propertyId, accessToken, 'runRealtimeReport', {
        metrics: [{ name: 'activeUsers' }],
      }),
      gaRequest(propertyId, accessToken, 'runReport', {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
      }),
    ]);

    return NextResponse.json({
      success: true,
      configured: true,
      propertyId,
      stats: {
        activeNow: metricValue(realtime, 'activeUsers'),
        activeUsers30d: metricValue(last30Days, 'activeUsers'),
        newUsers30d: metricValue(last30Days, 'newUsers'),
        sessions30d: metricValue(last30Days, 'sessions'),
        pageViews30d: metricValue(last30Days, 'screenPageViews'),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Google Analytics] report error:', error);
    return NextResponse.json({
      success: false,
      configured: true,
      message: error instanceof Error ? error.message : 'Gagal membaca Google Analytics.',
    }, { status: 500 });
  }
}
