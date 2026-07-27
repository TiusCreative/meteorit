"use client";

import Link from 'next/link';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

export default function GlossaryLandingSection() {
  const language = useSiteLanguage();
  const t = landingText[language];

  return (
    <section className="py-14 bg-slate-950 border-t border-cyan-900/10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center rounded-2xl border border-cyan-900/30 bg-slate-900/40 p-6 md:p-8 text-left">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">{t.glossaryBadge}</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-cyan-300">{t.glossaryTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-slate-300">
              {t.glossaryDescription}
            </p>
          </div>
          <Link
            href="/glossarium"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-cyan-400"
          >
            {t.openGlossary}
          </Link>
        </div>
      </div>
    </section>
  );
}
