import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1Client';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import { getGlossarySeed } from '@/lib/glossaryData';
import { getFallbackAstronautDataset } from '@/lib/astronautData';
import R2_CONFIG from '@/lib/cloudflareR2Config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const lang = searchParams.get('lang') || 'id'; // default indonesian

    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        results: {
          articles: [],
          meteorites: [],
          glossary: [],
          astronauts: [],
          pages: []
        }
      });
    }

    const queryLower = q.toLowerCase().trim();

    // 1. Pencarian Halaman & Menu Statis
    const allPages = [
      { id: 'page-home', title: 'Beranda / Home', desc: 'Halaman utama portal Meteorit Indonesia', href: '/' },
      { id: 'page-ensiklopedia', title: 'Ensiklopedia Meteorit', desc: 'Katalog batu meteorit, klasifikasi massal, tahun jatuh, dan gambar', href: '/ensiklopedia' },
      { id: 'page-comet-tracker', title: 'Komet Tracker (Komet & Asteroid)', desc: 'Pelacak komet dan asteroid yang mendekati bumi via NASA NeoWs', href: '/ensiklopedia?tab=komet' },
      { id: 'page-komet-articles', title: 'Artikel Komet & Asteroid', desc: 'Artikel sains, berita populer tentang komet dan objek dekat bumi', href: '/komet' },
      { id: 'page-mars-articles', title: 'Artikel Eksplorasi Mars', desc: 'Berita foto Mars Rover NASA dan penemuan di planet merah', href: '/mars' },
      { id: 'page-fireball-articles', title: 'Artikel Fireball / Meteor Jatuh', desc: 'Kajian laporan meteor jatuh, bolide, dan fireball di bumi', href: '/fireball' },
      { id: 'page-eonet-articles', title: 'Artikel EONET / Kejadian Alam', desc: 'Pemantauan kejadian biosfer dari NASA Earth Observatory', href: '/eonet' },
      { id: 'page-apod', title: 'APOD (Astronomy Picture of the Day)', desc: 'Gambar astronomi harian pilihan NASA disertai penjelasan astronom', href: '/apod' },
      { id: 'page-langit-malam', title: 'Peta Langit Malam', desc: 'Panduan rasi bintang, fase bulan, dan waktu pengamatan langit malam', href: '/langit-malam' },
      { id: 'page-glossarium', title: 'Glosarium Astronomi', desc: 'Kamus istilah astronomi, BMKG, NASA, dan sains kebumian', href: '/glossarium' },
      { id: 'page-kebencanaan', title: 'Peta & Dashboard Kebencanaan', desc: 'Status gunung api, gempa bumi BMKG, hotspot kebakaran hutan, dan curah hujan', href: '/kebencanaan' },
      { id: 'page-monitoring', title: 'Mission Control & Realtime ISS', desc: 'Pelacak stasiun luar angkasa ISS, astronot aktif, dan dashboard telemetri', href: '/monitoring' },
      { id: 'page-monitoring-epic', title: 'Earth EPIC Monitoring', desc: 'Foto satelit bumi utuh dari kamera EPIC NASA DSCOVR', href: '/monitoring-epic' },
      { id: 'page-tentang', title: 'Tentang Kami', desc: 'Profil komunitas, visi misi, dan tim pengembang Meteorit Indonesia', href: '/tentang' },
      { id: 'page-visi-misi', title: 'Visi & Misi', desc: 'Arah perjuangan, tujuan edukasi astronomi, dan cita-cita Meteorit Indonesia', href: '/visi-misi' },
      { id: 'page-kebijakan-privasi', title: 'Kebijakan Privasi', desc: 'Kebijakan privasi data pengguna dan keamanan portal', href: '/kebijakan-privasi' },
      { id: 'page-syarat-ketentuan', title: 'Syarat & Ketentuan', desc: 'Ketentuan layanan, lisensi konten, dan hak cipta media', href: '/syarat-ketentuan' },
    ];

    const matchedPages = allPages.filter(p => 
      p.title.toLowerCase().includes(queryLower) || p.desc.toLowerCase().includes(queryLower)
    );

    let articles: any[] = [];
    let meteorites: any[] = [];
    let glossary: any[] = [];
    let astronauts: any[] = [];

    // --- STRATEGY: HYBRID D1 & FALLBACK TO R2 JSON ---

    // 1. Search Articles
    try {
      const d1Res = await queryD1(
        `SELECT id, title, category, date, excerpt, image, tags FROM articles 
         WHERE status = 'Published' AND (title LIKE ? OR excerpt LIKE ? OR tags LIKE ? OR category LIKE ?) 
         ORDER BY createdAt DESC LIMIT 20`,
        [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
      );
      articles = d1Res.results || [];
    } catch (d1Err) {
      console.warn('[Search API] Articles D1 failed, falling back to R2 posts.json:', d1Err);
    }

    if (articles.length === 0) {
      try {
        const posts = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
        articles = posts.filter(p => {
          if (p.status !== 'Published') return false;
          const titleMatch = p.title?.toLowerCase().includes(queryLower);
          const excerptMatch = p.excerpt?.toLowerCase().includes(queryLower);
          const tagsMatch = Array.isArray(p.tags)
            ? p.tags.some((t: string) => t.toLowerCase().includes(queryLower))
            : p.tags?.toLowerCase().includes(queryLower);
          const catMatch = p.category?.toLowerCase().includes(queryLower);
          return titleMatch || excerptMatch || tagsMatch || catMatch;
        }).slice(0, 20);
      } catch (r2Err) {
        console.error('[Search API] Articles R2 fallback also failed:', r2Err);
      }
    }

    const formattedArticles = articles.map(art => {
      const category = art.category || 'Blog';
      let path = `/blog/${art.id}`;
      if (category === 'Komet & Asteroid') path = `/blog/${art.id}`;
      else if (category === 'Mars') path = `/mars/${art.id}`;
      else if (category === 'Fireball') path = `/fireball/${art.id}`;
      else if (category === 'Eonet') path = `/eonet/${art.id}`;

      return {
        id: art.id,
        title: art.title,
        excerpt: art.excerpt || '',
        category,
        date: art.date || '',
        image: art.image || art.imageUrl || '',
        href: path
      };
    });

    // 2. Search Encyclopedia (Meteorites)
    try {
      const d1Res = await queryD1(
        `SELECT id, name, translated_name, mass, year, recclass, lat, long, description, translated_description, image_url 
         FROM meteorites 
         WHERE (name LIKE ? OR translated_name LIKE ? OR recclass LIKE ? OR description LIKE ? OR translated_description LIKE ?) 
         LIMIT 20`,
        [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
      );
      meteorites = d1Res.results || [];
    } catch (d1Err) {
      console.warn('[Search API] Meteorites D1 failed, falling back to R2 catalog.json:', d1Err);
    }

    if (meteorites.length === 0) {
      try {
        const catalogRes = await fetch(`${R2_CONFIG.publicUrl}/data/meteorites/catalog.json?t=${Date.now()}`);
        if (catalogRes.ok) {
          const catalog: any[] = await catalogRes.json();
          meteorites = catalog.filter(m => {
            const nameMatch = m.name?.toLowerCase().includes(queryLower) || m.translated_name?.toLowerCase().includes(queryLower);
            const classMatch = m.recclass?.toLowerCase().includes(queryLower);
            const descMatch = m.description?.toLowerCase().includes(queryLower) || m.translated_description?.toLowerCase().includes(queryLower);
            return nameMatch || classMatch || descMatch;
          }).slice(0, 20);
        }
      } catch (r2Err) {
        console.error('[Search API] Meteorites R2 fallback failed:', r2Err);
      }
    }

    const formattedMeteorites = meteorites.map(m => {
      const displayName = lang === 'id' ? (m.translated_name || m.name) : (m.translations?.[lang]?.name || m.name || m.translated_name);
      const displayDesc = lang === 'id' ? (m.translated_description || m.description) : (m.translations?.[lang]?.description || m.description || m.translated_description);
      return {
        id: m.id,
        name: displayName || m.name || '',
        recclass: m.recclass || 'Meteorit',
        mass: m.mass || '',
        year: m.year || '',
        excerpt: displayDesc ? (displayDesc.substring(0, 120) + '...') : '',
        image: m.image_url || m.imageUrl || '',
        href: `/ensiklopedia/${m.id}`
      };
    });

    // 3. Search Glossary
    try {
      const d1Res = await queryD1(
        `SELECT id, term, definition, translations FROM glossary_terms 
         WHERE (term LIKE ? OR definition LIKE ? OR translations LIKE ?) 
         LIMIT 20`,
        [`%${q}%`, `%${q}%`, `%${q}%`]
      );
      const rows = d1Res.results || [];
      glossary = rows.map(g => {
        let termObj = {};
        let defObj = {};
        try {
          termObj = typeof g.term === 'string' ? JSON.parse(g.term) : g.term;
        } catch {
          termObj = { id: g.term, en: g.term };
        }
        try {
          defObj = typeof g.definition === 'string' ? JSON.parse(g.definition) : g.definition;
        } catch {
          defObj = { id: g.definition, en: g.definition };
        }
        return {
          id: g.id,
          term: termObj,
          definition: defObj
        };
      });
    } catch (d1Err) {
      console.warn('[Search API] Glossary D1 failed, falling back to R2 terms.json:', d1Err);
    }

    if (glossary.length === 0) {
      try {
        const terms = await fetchJsonFromR2<any[]>('data/glossary/terms.json') || getGlossarySeed();
        glossary = terms.filter(t => {
          const termMatch = Object.values(t.term || {}).some(val => typeof val === 'string' && val.toLowerCase().includes(queryLower));
          const defMatch = Object.values(t.definition || {}).some(val => typeof val === 'string' && val.toLowerCase().includes(queryLower));
          return termMatch || defMatch;
        }).slice(0, 20);
      } catch (r2Err) {
        console.error('[Search API] Glossary R2 fallback failed:', r2Err);
      }
    }

    const formattedGlossary = glossary.map(g => {
      const termLabel = g.term?.[lang] || g.term?.id || g.term?.en || '';
      const defLabel = g.definition?.[lang] || g.definition?.id || g.definition?.en || '';
      return {
        id: g.id,
        term: termLabel,
        excerpt: defLabel ? (defLabel.substring(0, 120) + '...') : '',
        href: `/glossarium/${g.id}`
      };
    });

    // 4. Search Astronauts
    try {
      const d1Res = await queryD1(
        `SELECT id, name, craft, country, agency, role, biography, imageUrl FROM astronauts 
         WHERE (name LIKE ? OR role LIKE ? OR agency LIKE ? OR biography LIKE ?) 
         LIMIT 20`,
        [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
      );
      astronauts = d1Res.results || [];
    } catch (d1Err) {
      console.warn('[Search API] Astronauts D1 failed, falling back to R2 astronauts.json:', d1Err);
    }

    if (astronauts.length === 0) {
      try {
        const astroRes = await fetchJsonFromR2<any>('data/astronauts/astronauts.json');
        const astroList = astroRes?.astronauts || getFallbackAstronautDataset().astronauts;
        astronauts = astroList.filter((a: any) => {
          const nameMatch = a.name?.toLowerCase().includes(queryLower);
          const roleMatch = a.role?.toLowerCase().includes(queryLower);
          const agencyMatch = a.agency?.toLowerCase().includes(queryLower);
          const bioMatch = a.biography?.toLowerCase().includes(queryLower);
          return nameMatch || roleMatch || agencyMatch || bioMatch;
        }).slice(0, 20);
      } catch (r2Err) {
        console.error('[Search API] Astronauts R2 fallback failed:', r2Err);
      }
    }

    const formattedAstronauts = astronauts.map(a => {
      return {
        id: a.id,
        name: a.name || '',
        role: a.role || '',
        agency: a.agency || '',
        craft: a.craft || '',
        excerpt: a.biography ? (a.biography.substring(0, 120) + '...') : '',
        image: a.imageUrl || a.image || '',
        href: `/astronot/${a.id}`
      };
    });

    return NextResponse.json({
      success: true,
      results: {
        articles: formattedArticles,
        meteorites: formattedMeteorites,
        glossary: formattedGlossary,
        astronauts: formattedAstronauts,
        pages: matchedPages
      }
    });

  } catch (error) {
    console.error('[Search API] Global search error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
