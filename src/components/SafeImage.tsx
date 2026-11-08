"use client";

import { useState, useEffect } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

const CDN_BASE = 'https://cdn.meteorit.my.id';
const DEFAULT_FALLBACK_IMAGE = `${CDN_BASE}/data/glossary/images/nasa-apod.webp`;

/**
 * Normalizes any R2 / dev domain or old URLs to the official custom CDN domain
 */
export function sanitizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  // Convert any Cloudflare r2.dev URL (which has SSL certificate issues) to the verified CDN domain
  if (url.includes('.r2.dev')) {
    return url.replace(/https?:\/\/[a-zA-Z0-9-]+\.r2\.dev/g, CDN_BASE);
  }
  return url;
}

export function getProxiedUrl(originalSrc: string | undefined): string | undefined {
  if (!originalSrc) return originalSrc;
  const cleanSrc = sanitizeImageUrl(originalSrc);
  if (!cleanSrc) return cleanSrc;

  if (
    cleanSrc.startsWith('/') ||
    cleanSrc.startsWith('data:') ||
    cleanSrc.includes('localhost') ||
    cleanSrc.includes('meteorit.my.id') ||
    cleanSrc.includes('images.unsplash.com')
  ) {
    return cleanSrc;
  }
  return `/api/image-proxy?url=${encodeURIComponent(cleanSrc)}`;
}

/**
 * Membuat fallback chain untuk gambar R2 glossary / umum:
 * .webp → .jpg → default AI space banner
 */
function buildGlossaryFallbackChain(src: string): string[] {
  const clean = sanitizeImageUrl(src) || '';
  if (!clean.includes(CDN_BASE + '/data/glossary/images/')) return [];
  const noExt = clean.replace(/\.(webp|jpg|jpeg|png)$/, '');
  const key = noExt.split('/data/glossary/images/')[1];
  if (!key) return [];
  return [
    `${CDN_BASE}/data/glossary/images/${key}.webp`,
    `${CDN_BASE}/data/glossary/images/${key}.jpg`,
    DEFAULT_FALLBACK_IMAGE
  ];
}

export default function SafeImage({
  src,
  fallback = DEFAULT_FALLBACK_IMAGE,
  alt,
  className,
  ...props
}: SafeImageProps) {
  const cleanSrc = sanitizeImageUrl(src);
  const cleanFallback = sanitizeImageUrl(fallback) || DEFAULT_FALLBACK_IMAGE;
  const proxiedUrl = getProxiedUrl(cleanSrc);
  const [imgSrc, setImgSrc] = useState<string | undefined>(proxiedUrl);
  const [fallbackChain] = useState<string[]>(() => buildGlossaryFallbackChain(cleanSrc || ''));
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    const updated = getProxiedUrl(sanitizeImageUrl(src));
    setImgSrc(updated);
    setFallbackIndex(0);
  }, [src]);

  const handleError = () => {
    // Coba fallback chain (webp → jpg) sebelum pakai fallback akhir
    const nextIndex = fallbackIndex + 1;
    if (fallbackChain.length > 0 && nextIndex < fallbackChain.length) {
      const nextUrl = sanitizeImageUrl(fallbackChain[nextIndex]);
      if (nextUrl && nextUrl !== imgSrc) {
        setFallbackIndex(nextIndex);
        setImgSrc(nextUrl);
        return;
      }
    }
    setImgSrc(cleanFallback);
  };

  return (
    <img
      src={imgSrc || proxiedUrl}
      alt={alt}
      className={className}
      onError={handleError}
      suppressHydrationWarning
      {...props}
    />
  );
}
