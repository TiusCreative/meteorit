import type { MetadataRoute } from 'next';
import { getAbsoluteUrl, getSiteUrl } from '@/lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: getAbsoluteUrl('/sitemap.xml'),
    host: getSiteUrl(),
  };
}
