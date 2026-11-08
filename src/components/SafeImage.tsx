"use client";

import { useState, useEffect } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export function getProxiedUrl(originalSrc: string | undefined): string | undefined {
  if (!originalSrc) return originalSrc;
  if (
    originalSrc.startsWith('/') ||
    originalSrc.startsWith('data:') ||
    originalSrc.includes('localhost') ||
    originalSrc.includes('meteorit.my.id') ||
    originalSrc.includes('r2.dev') ||
    originalSrc.includes('images.unsplash.com')
  ) {
    return originalSrc;
  }
  return `/api/image-proxy?url=${encodeURIComponent(originalSrc)}`;
}

const DEFAULT_FALLBACK_IMAGE = 'https://cdn.meteorit.my.id/data/glossary/images/nasa-apod.webp';

const R2_BASE = 'https://cdn.meteorit.my.id';

/**
 * Membuat fallback chain untuk gambar R2 glossary / umum:
 * .webp → .jpg → default AI space banner
 */
function buildGlossaryFallbackChain(src: string): string[] {
  if (!src.includes(R2_BASE + '/data/glossary/images/')) return [];
  const noExt = src.replace(/\.(webp|jpg|jpeg|png)$/, '');
  const key = noExt.split('/data/glossary/images/')[1];
  if (!key) return [];
  return [
    `${R2_BASE}/data/glossary/images/${key}.webp`,
    `${R2_BASE}/data/glossary/images/${key}.jpg`,
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
  const proxiedUrl = getProxiedUrl(src);
  const [imgSrc, setImgSrc] = useState<string | undefined>(proxiedUrl);
  const [fallbackChain] = useState<string[]>(() => buildGlossaryFallbackChain(src || ''));
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    setImgSrc(proxiedUrl);
    setFallbackIndex(0);
  }, [proxiedUrl]);

  const handleError = () => {
    // Coba fallback chain (webp → jpg) sebelum pakai fallback akhir
    const nextIndex = fallbackIndex + 1;
    if (fallbackChain.length > 0 && nextIndex < fallbackChain.length) {
      const nextUrl = fallbackChain[nextIndex];
      if (nextUrl !== imgSrc) {
        setFallbackIndex(nextIndex);
        setImgSrc(nextUrl);
        return;
      }
    }
    setImgSrc(fallback);
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
