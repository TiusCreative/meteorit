import { NextRequest, NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1Client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { filename, fileFormat, recordCount, downloadedBy } = await req.json();

    if (!filename || !fileFormat) {
      return NextResponse.json({ error: 'Missing filename or fileFormat' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const downloader = downloadedBy || 'Visitor';

    const insertSql = `
      INSERT INTO disaster_downloads (id, filename, file_format, record_count, downloaded_by, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await queryD1(insertSql, [id, filename, fileFormat, recordCount || 0, downloader, timestamp]);

    return NextResponse.json({
      success: true,
      message: 'Download activity logged successfully',
      id
    });
  } catch (err: any) {
    console.error('[Log Download API Error]:', err);
    return NextResponse.json({
      success: false,
      error: 'Failed to log download activity',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
