import { useEffect, useState } from 'react';
import type { SiteLanguage } from './i18n';
import type { GlossaryTerm } from './glossaryData';

export function useLocalizedGlossary(
  initialTerms: GlossaryTerm[],
  language: SiteLanguage
): GlossaryTerm[] {
  const [terms, setTerms] = useState<GlossaryTerm[]>(initialTerms);

  useEffect(() => {
    setTerms(initialTerms);
  }, [initialTerms]);

  useEffect(() => {
    if (language === 'id') return;

    let isMounted = true;

    async function translatePending() {
      // Cari terms yang belum di-translate untuk bahasa target atau yang terjemahannya masih bahasa Indonesia
      const pending = terms.filter(t => {
        const isStillIndonesian = t.definition?.[language] === t.definition?.id;
        return !t.translatedLocales?.[language] || isStillIndonesian;
      });
      if (pending.length === 0) return;

      // Batasi maksimal 6 item sekali jalan agar aman dari rate limit dan responsif
      const batch = pending.slice(0, 6);
      let updatedTerms = [...terms];
      let hasChanges = false;

      for (const term of batch) {
        if (!isMounted) break;
        try {
          const res = await fetch(`/api/glossary/translate?id=${encodeURIComponent(term.id)}&locale=${language}`);
          if (res.ok) {
            const data = await res.json();
            if (data.term && data.definition && isMounted) {
              hasChanges = true;
              updatedTerms = updatedTerms.map(t => {
                if (t.id === term.id) {
                  return {
                    ...t,
                    term: {
                      ...t.term,
                      [language]: data.term,
                    },
                    definition: {
                      ...t.definition,
                      [language]: data.definition,
                    },
                    example: {
                      ...t.example,
                      [language]: data.example || t.example.id,
                    },
                    translatedLocales: {
                      ...t.translatedLocales,
                      [language]: true,
                    },
                  };
                }
                return t;
              });
            }
          }
        } catch {
          // silent fail
        }
        // Jeda 600ms untuk menjaga rate limit Groq API
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      if (hasChanges && isMounted) {
        setTerms(updatedTerms);
      }
    }

    translatePending();

    return () => {
      isMounted = false;
    };
  }, [language, initialTerms, terms]);

  return terms;
}
