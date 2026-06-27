import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import StatsBanner from '@/components/StatsBanner'
import EncyclopediaHighlight from '@/components/EncyclopediaHighlight'
import SpaceMissionControl from '@/components/SpaceMissionControl'
import CommunityFeature from '@/components/CommunityFeature'
import DonationSection from '@/components/DonationSection'
import BlogSection from '@/components/BlogSection'
import MarsLandingSection from '@/components/MarsLandingSection'
import AdDisplay from '@/components/AdDisplay'
import Footer from '@/components/Footer'
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

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
}

export default async function Home() {
  const r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

  // 1. Fetch APOD ("Benda Langit Hari Ini") server-side
  let apodData = null;
  try {
    const res = await fetch(`${r2PublicUrl}/data/encyclopedia/latest.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      apodData = await res.json();
    }
  } catch (err) {
    console.warn("Failed to load latest APOD on server for landing page:", err);
  }

  // Fallback APOD to Firestore
  if (!apodData) {
    try {
      const snapshot = await adminDb.collection('apod_history').orderBy('id', 'desc').limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        apodData = {
          id: doc.id,
          title: data.title || { en: '', id: '' },
          explanation: data.explanation || { en: '', id: '' },
          image_url: data.image_url || '',
          copyright: data.copyright || 'NASA Public Domain',
          media_type: data.media_type || 'image'
        };
      }
    } catch (err) {
      console.error("Failed to load fallback APOD on server:", err);
    }
  }

  // Final static APOD fallback if Firestore is also empty
  if (!apodData) {
    apodData = {
      id: new Date().toISOString().split('T')[0],
      title: {
        en: "Meteor Shower over Indonesia",
        id: "Hujan Meteor di Langit Indonesia"
      },
      explanation: {
        en: "A beautiful display of shooting stars captured in the night skies of Indonesia, highlighting celestial beauty.",
        id: "Tampilan indah bintang jatuh yang ditangkap di langit malam Indonesia, menyoroti keindahan benda angkasa luar biasa."
      },
      image_url: "https://placehold.co/800x500/020617/f59e0b?text=Hujan+Meteor",
      copyright: "Kolektor Astronomi",
      media_type: "image"
    };
  }

  // 2. Fetch Blog Posts server-side
  let blogPosts: BlogPost[] = [];
  let marsPosts: BlogPost[] = [];
  try {
    const res = await fetch(`${r2PublicUrl}/data/blog/posts.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        // Exclude komet articles from general homepage feed
        const onlyBlog = data.filter((p: any) => p.category !== 'Komet & Asteroid');
        blogPosts = onlyBlog.slice(0, 3);
        marsPosts = data.filter((p: any) => p.category === 'Planet Mars').slice(0, 3);
      }
    }
  } catch (err) {
    console.warn("Failed to load newest blogs on server for landing page:", err);
  }

  // Fallback Blog to Firestore
  if (blogPosts.length === 0) {
    try {
      const snapshot = await adminDb.collection('articles').orderBy('createdAt', 'desc').limit(10).get();
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.status === 'Published' && data.category !== 'Komet & Asteroid' && blogPosts.length < 3) {
          blogPosts.push({
            id: doc.id,
            title: data.title || '',
            category: data.category || 'Trivia',
            date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
            image: data.image || data.imageUrl || '',
          });
        }
        if (data.status === 'Published' && data.category === 'Planet Mars' && marsPosts.length < 3) {
          marsPosts.push({
            id: doc.id,
            title: data.title || '',
            category: data.category || 'Planet Mars',
            date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
            image: data.image || data.imageUrl || '',
            mars_data: data.mars_data || {},
            createdAt: data.createdAt || '',
          });
        }
      });
    } catch (err) {
      console.error("Failed to load blog fallback on server:", err);
    }
  }

  if (marsPosts.length === 0) {
    try {
      const snapshot = await adminDb
        .collection('articles')
        .where('category', '==', 'Planet Mars')
        .get();

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.status === 'Published') {
          marsPosts.push({
            id: doc.id,
            title: data.title || '',
            category: data.category || 'Planet Mars',
            date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            excerpt: data.excerpt || '',
            image: data.image || '',
            mars_data: data.mars_data || {},
            createdAt: data.createdAt || '',
          });
        }
      });
      marsPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      marsPosts = marsPosts.slice(0, 3);
    } catch (err) {
      console.error("Failed to load Mars articles fallback on server:", err);
    }
  }

  // Final static blog fallback if Firestore is also empty
  if (blogPosts.length === 0) {
    blogPosts.push({
      id: "article-fallback-1",
      title: "Misteri Perjalanan Bintang Jatuh dan Batuan Meteorit",
      category: "Edukasi",
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      excerpt: "Bagaimana sebuah batu luar angkasa mampu bertahan melewati atmosfer bumi dan memberikan wawasan ilmiah yang berharga bagi sains modern.",
      image: "https://placehold.co/800x500/020617/22d3ee?text=Sains+Meteorit"
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />
      <HeroSection />
      <div className="container mx-auto px-4 max-w-6xl">
        <AdDisplay position="hero" />
      </div>
      <StatsBanner />
      <EncyclopediaHighlight initialData={apodData} />
      <SpaceMissionControl />
      <div className="container mx-auto px-4 max-w-6xl">
        <AdDisplay position="content" />
      </div>
      <CommunityFeature />
      <DonationSection />
      <MarsLandingSection posts={marsPosts} />
      <BlogSection initialPosts={blogPosts} />
      <div className="container mx-auto px-4 max-w-6xl">
        <AdDisplay position="footer" />
      </div>
      <Footer />
    </main>
  );
}
