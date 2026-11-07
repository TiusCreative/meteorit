import { getSiteUrl } from './siteUrl';

const SITE_URL = getSiteUrl();

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  category?: string;
}

export interface ProductSchemaProps {
  name: string;
  description: string;
  image?: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  url: string;
  category?: string;
}

export interface GlossarySchemaProps {
  id: string;
  term: string;
  definition: string;
  example?: string;
  category?: string;
  image?: string;
  updatedAt?: string;
}

export interface EventSchemaProps {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  url: string;
  image?: string;
}

export interface DatasetSchemaProps {
  name: string;
  description: string;
  url: string;
  keywords?: string[];
  dateModified?: string;
}

/**
 * Generates Google Sitelinks Search Box WebSite schema
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Meteorit Indonesia',
    alternateName: 'MeteorHub Indonesia',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/ensiklopedia?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates Organization schema for Meteorit Indonesia
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Meteorit Indonesia',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      'https://facebook.com/meteoritindonesia',
      'https://instagram.com/meteoritindonesia',
      'https://youtube.com/@meteoritindonesia',
    ],
    description:
      'Pusat data astronomi, edukasi sains antariksa, katalog meteorit, dan komunitas pemantau langit Indonesia.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE_URL}/kontak`,
      availableLanguage: ['Indonesian', 'English'],
    },
  };
}

/**
 * Generates BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };
}

/**
 * Generates Article / BlogPosting schema for Google Rich Snippets
 */
export function generateArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName = 'Tim Meteorit Indonesia',
  category,
}: ArticleSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  const fullImage = image ? (image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`) : `${SITE_URL}/logo.png`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    image: [fullImage],
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || datePublished || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: authorName,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Meteorit Indonesia',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    articleSection: category || 'Astronomi',
    inLanguage: 'id-ID',
  };
}

/**
 * Generates Product & Offer schema for Marketplace items
 */
export function generateProductSchema({
  name,
  description,
  image,
  price,
  currency = 'IDR',
  availability = 'InStock',
  url,
  category = 'Meteorit',
}: ProductSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  const fullImage = image ? (image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`) : `${SITE_URL}/logo.png`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: [fullImage],
    category,
    brand: {
      '@type': 'Brand',
      name: 'Meteorit Indonesia Marketplace',
    },
    offers: {
      '@type': 'Offer',
      url: fullUrl,
      priceCurrency: currency,
      price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: availability === 'InStock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Meteorit Indonesia',
      },
    },
  };
}

/**
 * Generates DefinedTerm & FAQPage schema for Glossarium items
 */
export function generateGlossarySchema({
  term,
  definition,
  example,
  category,
  image,
  updatedAt,
}: GlossarySchemaProps) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${term} - Kamus Sains Antariksa`,
    description: definition,
    image: image ? (image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`) : `${SITE_URL}/logo.png`,
    dateModified: updatedAt || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Meteorit Indonesia',
      url: SITE_URL,
    },
    articleSection: category || 'Glossarium Sains',
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Apa definisi dari istilah ${term}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: definition,
        },
      },
      ...(example
        ? [
            {
              '@type': 'Question',
              name: `Bagaimana contoh penggunaan istilah ${term}?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: example,
              },
            },
          ]
        : []),
    ],
  };

  return [articleSchema, faqSchema];
}

/**
 * Generates Event schema for Fireball & Natural events
 */
export function generateEventSchema({
  name,
  description,
  startDate,
  endDate,
  locationName,
  url,
  image,
}: EventSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  const fullImage = image ? (image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`) : `${SITE_URL}/logo.png`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || startDate || new Date().toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: fullUrl,
      name: locationName || 'Langit Indonesia / Global Space Observation',
    },
    image: [fullImage],
    organizer: {
      '@type': 'Organization',
      name: 'Meteorit Indonesia Monitoring Network',
      url: SITE_URL,
    },
  };
}

/**
 * Generates Dataset schema for Celestial catalogs and observation databases
 */
export function generateDatasetSchema({
  name,
  description,
  url,
  keywords,
  dateModified,
}: DatasetSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: fullUrl,
    keywords: keywords || ['meteorit', 'astronomi', 'nasa', 'bmkg', 'fireball'],
    creator: {
      '@type': 'Organization',
      name: 'Meteorit Indonesia',
      url: SITE_URL,
    },
    dateModified: dateModified || new Date().toISOString(),
  };
}
