import type { MetadataRoute } from 'next';
import { getAbsoluteUrl } from '@/lib/siteUrl';

const routes = [
  '/',
  '/blog',
  '/mars',
  '/komet',
  '/ensiklopedia',
  '/astronot',
  '/apod',
  '/langit-malam',
  '/monitoring',
  '/monitoring-epic',
  '/forum',
  '/marketplace',
  '/tentang',
  '/visi-misi',
  '/kontak',
  '/kebijakan-privasi',
  '/syarat-ketentuan',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: getAbsoluteUrl(route),
    lastModified,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.8,
  }));
}
