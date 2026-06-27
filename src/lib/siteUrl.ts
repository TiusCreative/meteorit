export const DEFAULT_SITE_URL = "https://meteorit.my.id";

function cleanUrl(value: string) {
  const markdownMatch = value.match(/\[([^\]]+)\]\(([^)]+)\)/);
  return (markdownMatch?.[1] || value).trim().replace(/\/+$/, "");
}

export function normalizeSiteUrl(
  url = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL
) {
  return cleanUrl(url);
}

export function getSiteUrl() {
  return normalizeSiteUrl();
}

export function getSiteHost() {
  return getSiteUrl().replace(/^https?:\/\//, "");
}

export function getAbsoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
