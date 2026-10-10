import dynamic from 'next/dynamic';
import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import StatsBanner from '@/components/StatsBanner'
import EncyclopediaHighlight from '@/components/EncyclopediaHighlight'
import AdDisplay from '@/components/AdDisplay'
import Footer from '@/components/Footer'
import { adminDb } from '@/lib/firebaseAdmin';
import { fetchJsonFromR2 } from '@/lib/r2Client';

// Lazy load komponen berat di below-the-fold agar tidak blokir First Load JS
const EarthTEWSWidget = dynamic(() => import('@/components/EarthTEWSWidget'), { ssr: false });
const DisasterMapSection = dynamic(() => import('@/components/DisasterMapSection'), { ssr: false });
const SpaceMissionControl = dynamic(() => import('@/components/SpaceMissionControl'), { ssr: false });
const ForumHighlights = dynamic(() => import('@/components/ForumHighlights'), { ssr: false });
const CommunityFeature = dynamic(() => import('@/components/CommunityFeature'), { ssr: false });
const DonationSection = dynamic(() => import('@/components/DonationSection'), { ssr: false });
const GlossaryLandingSection = dynamic(() => import('@/components/GlossaryLandingSection'), { ssr: false });
const FireballEonetSection = dynamic(() => import('@/components/FireballEonetSection'), { ssr: false });
const MarsLandingSection = dynamic(() => import('@/components/MarsLandingSection'), { ssr: false });
const BlogSection = dynamic(() => import('@/components/BlogSection'), { ssr: false });

// Revalidate setiap 5 menit — hindari force-dynamic agar bisa di-cache Vercel Edge
export const revalidate = 300;

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  mars_data?: {
    rover?: string;
    camera?: string;
    sol?: number;
  };
  createdAt?: string;
  translations?: Record<string, { title?: string; excerpt?: string; content?: string }>;
}

const STATIC_APOD_FALLBACK = {
  id: new Date().toISOString().split('T')[0],
  title: { en: 'Meteor Shower over Indonesia', id: 'Hujan Meteor di Langit Indonesia' },
  explanation: {
    en: 'A beautiful display of shooting stars captured in the night skies of Indonesia.',
    id: 'Tampilan indah bintang jatuh yang ditangkap di langit malam Indonesia.'
  },
  image_url: 'https://placehold.co/800x500/020617/f59e0b?text=Hujan+Meteor',
  copyright: 'Kolektor Astronomi',
  media_type: 'image'
};

const STATIC_BLOG_FALLBACK: BlogPost[] = [{
  id: 'article-fallback-1',
  title: 'Misteri Perjalanan Bintang Jatuh dan Batuan Meteorit',
  category: 'Edukasi',
  date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  excerpt: 'Bagaimana sebuah batu luar angkasa mampu bertahan melewati atmosfer bumi dan memberikan wawasan ilmiah yang berharga.',
  image: 'https://placehold.co/800x500/020617/22d3ee?text=Sains+Meteorit'
}];

export default async function Home() {
  // Fetch semua data secara PARALEL untuk mengurangi TTFB
  const [apodResult, postsResult] = await Promise.allSettled([
    fetchJsonFromR2<any>('data/encyclopedia/latest.json'),
    fetchJsonFromR2<BlogPost[]>('data/blog/posts.json'),
  ]);

  // ── APOD data ────────────────────────────────────────────────────────────────
  let apodData: any = apodResult.status === 'fulfilled' ? apodResult.value : null;
  if (!apodData) {
    try {
      const snapshot = await adminDb.collection('apod_history').orderBy('id', 'desc').limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]; const data = doc.data();
        apodData = { id: doc.id, title: data.title || { en: '', id: '' }, explanation: data.explanation || { en: '', id: '' }, image_url: data.image_url || '', copyright: data.copyright || 'NASA Public Domain', media_type: data.media_type || 'image' };
      }
    } catch { /* fallback below */ }
  }
  if (!apodData) apodData = STATIC_APOD_FALLBACK;

  // ── Blog / Post data ──────────────────────────────────────────────────────────
  let fireballPosts: BlogPost[] = [];
  let eonetPosts: BlogPost[] = [];
  let blogPosts: BlogPost[] = [];
  let marsPosts: BlogPost[] = [];

  const postsRaw = postsResult.status === 'fulfilled' ? postsResult.value : null;
  if (Array.isArray(postsRaw) && postsRaw.length > 0) {
    const sorted = [...postsRaw].sort((a: any, b: any) =>
      new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
    );
    fireballPosts = sorted.filter((p: any) => ['Bola Api & Fireball','Fireball','Bola Api'].includes(p.category)).slice(0, 4);
    eonetPosts = sorted.filter((p: any) => ['Peristiwa Alam','EONET','Bencana Alam'].includes(p.category)).slice(0, 4);
    blogPosts = sorted.filter((p: any) => p.category !== 'Komet & Asteroid').slice(0, 3);
    marsPosts = sorted.filter((p: any) => p.category === 'Planet Mars').slice(0, 3);
  }

  // Firestore fallback hanya jika R2 gagal
  if (blogPosts.length === 0) {
    try {
      const snapshot = await adminDb.collection('articles').orderBy('createdAt', 'desc').limit(15).get();
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.status !== 'Published') return;
        const post: BlogPost = {
          id: doc.id, title: data.title || '', category: data.category || 'Trivia',
          date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
          image: data.image || data.imageUrl || '', createdAt: data.createdAt || '', translations: data.translations || {},
          mars_data: data.mars_data || {}
        };
        if (data.category !== 'Komet & Asteroid' && blogPosts.length < 3) blogPosts.push(post);
        if (data.category === 'Planet Mars' && marsPosts.length < 3) marsPosts.push(post);
      });
    } catch (err) { console.error('Firestore blog fallback failed:', err); }
  }
  if (blogPosts.length === 0) blogPosts = STATIC_BLOG_FALLBACK;

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      <Header />
      <HeroSection />
      <div className="container mx-auto px-4 max-w-6xl">
        <AdDisplay position="hero" />
      </div>
      <EarthTEWSWidget />
      <DisasterMapSection />
      <StatsBanner />
      <EncyclopediaHighlight initialData={apodData} />
      <SpaceMissionControl />
      <ForumHighlights />
      <div className="container mx-auto px-4 max-w-6xl">
        <AdDisplay position="content" />
      </div>
      <CommunityFeature />
      <DonationSection />
      <GlossaryLandingSection />
      <FireballEonetSection fireballPosts={fireballPosts as any} eonetPosts={eonetPosts as any} />
      <MarsLandingSection posts={marsPosts} />
      <BlogSection initialPosts={blogPosts} />
      <div className="container mx-auto px-4 max-w-6xl">
        <AdDisplay position="footer" />
      </div>
      <Footer />
    </main>
  );
}
