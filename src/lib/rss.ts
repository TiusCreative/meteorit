import { uploadToR2, fetchJsonFromR2 } from './r2Client';
import { getSiteUrl, getAbsoluteUrl } from './siteUrl';
import { queryD1 } from './d1Client';

/** Escape XML special characters */
function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function rebuildRSSFeedHelper(): Promise<boolean> {
  try {
    let latestArticles: any[] = [];

    // Try fetching from Cloudflare D1 first
    try {
      const res = await queryD1(`SELECT * FROM articles WHERE status = 'Published' ORDER BY createdAt DESC LIMIT 50`);
      latestArticles = res.results || [];
    } catch (d1Err) {
      console.warn('[RSS Helper] D1 query failed, falling back to R2 posts.json:', d1Err);
      // Fallback to R2 cache index
      const articles = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
      articles.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      latestArticles = articles.slice(0, 50);
    }


    const siteUrl = getSiteUrl();

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>Meteorit Indonesia</title>
  <link>${siteUrl}</link>
  <description>Pusat pemantauan benda langit live NASA, pelacakan astronot ISS, satelit EPIC, hingga ensiklopedia meteorit Indonesia dalam satu platform.</description>
  <language>id</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${getAbsoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml" />
  <image>
    <url>${siteUrl}/logo.png</url>
    <title>Meteorit Indonesia</title>
    <link>${siteUrl}</link>
  </image>
`;

    for (const article of latestArticles) {
      let path = '';
      if (article.category === 'Bola Api & Fireball') {
        path = `/fireball/${article.id}`;
      } else if (article.category === 'Peristiwa Alam') {
        path = `/eonet/${article.id}`;
      } else if (article.category === 'Planet Mars') {
        path = `/mars/${article.id}`;
      } else {
        path = `/blog/${article.id}`;
      }

      const itemUrl = getAbsoluteUrl(path);
      const pubDate = article.createdAt ? new Date(article.createdAt).toUTCString() : new Date().toUTCString();

      const escapedTitle   = escapeXml(article.title || '');
      const escapedExcerpt = escapeXml(article.excerpt || '');
      const escapedCategory = escapeXml(article.category || 'Edukasi');

      // Image URL – prefer absolute URL, ensure no trailing spaces
      const rawImageUrl = (article.image || article.imageUrl || '').trim();
      const escapedImageUrl = escapeXml(rawImageUrl);

      // Build image tags only if image URL exists
      const enclosureTag = escapedImageUrl
        ? `\n    <enclosure url="${escapedImageUrl}" type="image/jpeg" length="0" />`
        : '';

      const mediaContentTag = escapedImageUrl
        ? `\n    <media:content url="${escapedImageUrl}" medium="image" type="image/jpeg" />`
        : '';

      const mediaThumbnailTag = escapedImageUrl
        ? `\n    <media:thumbnail url="${escapedImageUrl}" />`
        : '';

      // Build description with embedded image HTML for readers that render HTML
      const descriptionHtml = escapedImageUrl
        ? `<![CDATA[${rawImageUrl ? `<img src="${rawImageUrl}" alt="${article.title || ''}" style="max-width:100%;border-radius:8px;margin-bottom:12px;" /><br/>` : ''}${article.excerpt || ''}]]>`
        : `${escapedExcerpt}`;

      xml += `  <item>
    <title>${escapedTitle}</title>
    <link>${itemUrl}</link>
    <guid isPermaLink="true">${itemUrl}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${descriptionHtml}</description>
    <category>${escapedCategory}</category>
    <dc:creator>Meteorit Indonesia</dc:creator>${enclosureTag}${mediaContentTag}${mediaThumbnailTag}
  </item>
`;
    }

    xml += `</channel>
</rss>`;

    await uploadToR2('rss.xml', xml, 'application/xml; charset=utf-8');
    console.log(`[RSS Helper] RSS Feed rebuilt: ${latestArticles.length} artikel → R2.`);
    return true;
  } catch (err) {
    console.error('[RSS Helper] Gagal rebuild RSS feed:', err);
    return false;
  }
}
