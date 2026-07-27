"use client";

import { useState, useEffect } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

function getProxiedUrl(originalSrc: string | undefined): string | undefined {
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
  // Proxy all external images (NASA APIs, etc.)
  return `/api/image-proxy?url=${encodeURIComponent(originalSrc)}`;
}

export default function SafeImage({ src, fallback = 'https://placehold.co/600x400/020617/22d3ee?text=Image', alt, className, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(() => getProxiedUrl(src));

  useEffect(() => {
    setImgSrc(getProxiedUrl(src));
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
      {...props}
    />
  );
}
