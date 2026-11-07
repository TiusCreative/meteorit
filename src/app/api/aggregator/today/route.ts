import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1Client';
import { fetchJsonFromR2 } from '@/lib/r2Client';

export const dynamic = 'force-dynamic';

const TIME_ZONE = 'Asia/Jakarta';
const APP_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Meteorit Indonesia';

interface PodcastEpisode {
  pubDate?: string;
  deletedFromR2?: boolean;
}

function getJakartaDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Gagal menentukan tanggal hari ini.');
  }

  return `${year}-${month}-${day}`;
}

function getTodayWindow(dateString: string) {
  const start = new Date(`${dateString}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

function verifyPublishingApiKey(request: Request): boolean {
  const expectedApiKey = process.env.PUBLISHING_API_KEY;
  if (!expectedApiKey) return true;

  const apiKeyHeader = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;
  const { searchParams } = new URL(request.url);
  const apiKeyQuery = searchParams.get('apiKey') || searchParams.get('key');

  return [apiKeyHeader, bearerToken, apiKeyQuery].some(key => key === expectedApiKey);
}

async function hasArticlePublishedToday(startIso: string, endIso: string): Promise<boolean> {
  const result = await queryD1(
    `SELECT id FROM articles
     WHERE LOWER(status) = 'published'
       AND datetime(createdAt) >= datetime(?)
       AND datetime(createdAt) < datetime(?)
     LIMIT 1;`,
    [startIso, endIso]
  );

  return result.results.length > 0;
}

async function hasPodcastPublishedToday(startIso: string, endIso: string): Promise<boolean> {
  const episodes = await fetchJsonFromR2<PodcastEpisode[]>('data/podcast/episodes.json') || [];
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();

  return episodes.some(episode => {
    if (!episode.pubDate || episode.deletedFromR2) return false;

    const pubDateMs = new Date(episode.pubDate).getTime();
    return Number.isFinite(pubDateMs) && pubDateMs >= startMs && pubDateMs < endMs;
  });
}

async function ensureYoutubeUploadsTable(): Promise<void> {
  await queryD1(`
    CREATE TABLE IF NOT EXISTS youtube_uploads (
      id TEXT PRIMARY KEY,
      youtube_id TEXT NOT NULL,
      youtube_url TEXT,
      shorts_url TEXT,
      title TEXT,
      category TEXT,
      category_emoji TEXT,
      article_id TEXT,
      article_url TEXT,
      uploaded_at TEXT DEFAULT (datetime('now')),
      duration_sec INTEGER,
      views INTEGER DEFAULT 0
    );
  `);
}

async function hasYoutubePublishedToday(startIso: string, endIso: string): Promise<boolean> {
  await ensureYoutubeUploadsTable();

  const result = await queryD1(
    `SELECT id FROM youtube_uploads
     WHERE datetime(uploaded_at) >= datetime(?)
       AND datetime(uploaded_at) < datetime(?)
     LIMIT 1;`,
    [startIso, endIso]
  );

  return result.results.length > 0;
}

export async function GET(request: Request) {
  try {
    if (!verifyPublishingApiKey(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    const date = getJakartaDateString();
    const { startIso, endIso } = getTodayWindow(date);

    const [artikel, podcast, youtube] = await Promise.all([
      hasArticlePublishedToday(startIso, endIso),
      hasPodcastPublishedToday(startIso, endIso),
      hasYoutubePublishedToday(startIso, endIso)
    ]);

    return NextResponse.json(
      {
        success: true,
        appName: APP_NAME,
        date,
        status: {
          artikel,
          podcast,
          youtube
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Aggregator Today API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        appName: APP_NAME,
        date: getJakartaDateString(),
        error: 'Gagal memeriksa status publikasi harian.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
