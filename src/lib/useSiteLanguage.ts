"use client";

import { useEffect, useState } from 'react';
import {
  defaultLanguage,
  isSiteLanguage,
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_STORAGE_KEY,
  type SiteLanguage,
} from './i18n';

export function useSiteLanguage() {
  const [language, setLanguage] = useState<SiteLanguage>(defaultLanguage);

  useEffect(() => {
    const readLanguage = () => {
      try {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
        const cookieLocale = typeof document !== 'undefined'
          ? document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${LANGUAGE_COOKIE_KEY}=`))
              ?.split('=')[1]
          : null;

        if (isSiteLanguage(stored)) setLanguage(stored);
        else if (isSiteLanguage(cookieLocale || null)) setLanguage(cookieLocale as SiteLanguage);
        else setLanguage(defaultLanguage);
      } catch (err) {
        console.warn('Gagal membaca storage/cookie bahasa:', err);
        setLanguage(defaultLanguage);
      }
    };

    readLanguage();
    window.addEventListener('storage', readLanguage);
    window.addEventListener('meteorit-language-change', readLanguage);
    return () => {
      window.removeEventListener('storage', readLanguage);
      window.removeEventListener('meteorit-language-change', readLanguage);
    };
  }, []);

  return language;
}
