import { useEffect, useState } from 'react';
import type { SiteLanguage } from './i18n';
import { fetchArticleTranslation, needsOnTheFlyTranslation, type LocalizableArticle } from './clientArticleLocalization';

export function useLocalizedArticles<T extends LocalizableArticle>(
  initialPosts: T[],
  language: SiteLanguage,
  collection: string = 'articles'
): T[] {
  const [posts, setPosts] = useState<T[]>(initialPosts);

  // Sync state if initialPosts changes (e.g. dynamic filters or pagination)
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    if (language === 'id') return;

    let isMounted = true;

    async function translatePending() {
      // Find all articles that need translation for the current language
      const pending = posts.filter(p => needsOnTheFlyTranslation(p, language));
      if (pending.length === 0) return;

      let hasChanges = false;
      const updatedPosts = await Promise.all(
        posts.map(async (post) => {
          if (needsOnTheFlyTranslation(post, language)) {
            const trans = await fetchArticleTranslation(post.id as any, language, collection);
            if (trans && isMounted) {
              hasChanges = true;
              return {
                ...post,
                translations: {
                  ...post.translations,
                  [language]: {
                    title: trans.title,
                    excerpt: trans.excerpt,
                  },
                },
              };
            }
          }
          return post;
        })
      );

      if (hasChanges && isMounted) {
        setPosts(updatedPosts);
      }
    }

    translatePending();

    return () => {
      isMounted = false;
    };
  }, [language, initialPosts]);

  return posts;
}
