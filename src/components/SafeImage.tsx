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
    originalSrc.includes('placehold.co') ||
    originalSrc.includes('pollinations.ai')
  ) {
    return originalSrc;
  }
  return `/api/image-proxy?url=${encodeURIComponent(originalSrc)}`;
}

export default function SafeImage({
  src,
  fallback = 'https://placehold.co/600x400/020617/22d3ee?text=Gambar',
  alt,
  className,
  ...props
}: SafeImageProps) {
  const proxiedUrl = getProxiedUrl(src);
  const [imgSrc, setImgSrc] = useState<string | undefined>(proxiedUrl);

  useEffect(() => {
    setImgSrc(proxiedUrl);
  }, [proxiedUrl]);

  return (
    <img
      src={imgSrc || proxiedUrl}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
      suppressHydrationWarning
      {...props}
    />
  );
}
