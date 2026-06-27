import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import ApodActions from '@/components/ApodActions';
import SafeImage from '@/components/SafeImage';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface Apod {
  id: string; // YYYY-MM-DD
  title: {
    en: string;
    id: string;
  };
  explanation: {
    en: string;
    id: string;
  };
  image_url: string;
  copyright: string;
}

const NASA_API_KEY = process.env.NASA_API_KEY || 'hlogNogFWGEANcJcPnYwlxYJh3auqScaH75m8ktN';

// AI Translation using Groq API
async function translateText(text: string, systemPrompt = 'Terjemahkan teks berikut ke bahasa Indonesia.'): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || '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'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3
      })
    });

    const result = await response.json();
    if (result.choices && result.choices[0]?.message?.content) {
      return result.choices[0].message.content.trim();
    }
    return text;
  } catch (error) {
    console.error('Groq Translation error in APOD page:', error);
    return text;
  }
}

// Format Date to Indonesia Local
function formatDateIndo(dateStr: string) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
  } catch (e) {}
  return dateStr;
}

// Fetch APOD Data
async function getApod(id: string): Promise<Apod | null> {
  // 1. Coba dari Firestore terlebih dahulu
  try {
    const docSnap = await adminDb.collection('apod_history').doc(id).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || { en: '', id: '' },
        explanation: data.explanation || { en: '', id: '' },
        image_url: data.image_url || '',
        copyright: data.copyright || 'NASA Public Domain'
      };
    }
  } catch (err) {
    console.warn("Failed to fetch APOD from Firestore database, falling back to NASA API:", err);
  }

  // 2. Fallback: Fetch langsung dari NASA API jika di-request tanggal yang belum di-cache
  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${id}`);
    if (res.ok) {
      const apodData = await res.json();

      // Terjemahkan dengan AI
      const translatedTitle = await translateText(apodData.title, 'Terjemahkan judul astronomi berikut ke Bahasa Indonesia secara singkat dan menarik.');
      const translatedExplanation = await translateText(apodData.explanation, 'Terjemahkan deskripsi ilmiah astronomi berikut ke Bahasa Indonesia yang mudah dipahami.');

      const finalApod: Apod = {
        id: apodData.date,
        title: {
          en: apodData.title,
          id: translatedTitle
        },
        explanation: {
          en: apodData.explanation,
          id: translatedExplanation
        },
        image_url: apodData.hdurl || apodData.url,
        copyright: apodData.copyright || 'NASA Public Domain'
      };

      // Simpan/Arsipkan ke Firestore agar request selanjutnya instan
      try {
        await adminDb.collection('apod_history').doc(id).set(finalApod);
      } catch (saveErr) {
        console.warn("Failed to save auto-fetched APOD to Firestore:", saveErr);
      }

      return finalApod;
    }
  } catch (err) {
    console.error("NASA APOD Fallback API error:", err);
  }

  return null;
}

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const apod = await getApod(params.id);
  if (!apod) {
    return {
      title: 'Foto Antariksa Tidak Ditemukan - Meteorit Indonesia',
      description: 'Detail foto antariksa NASA APOD tidak ditemukan.'
    };
  }
  return {
    title: `${apod.title.id || apod.title.en} - Foto Antariksa NASA ${formatDateIndo(apod.id)}`,
    description: apod.explanation.id?.substring(0, 150) || `Arsip Astronomy Picture of the Day tanggal ${formatDateIndo(apod.id)}.`,
    keywords: [apod.title.id || apod.title.en, 'nasa apod', 'astronomy picture of the day', 'foto antariksa', 'arsip foto luar angkasa', 'gambar astronomi harian'],
  };
}

export default async function ApodDetailPage({ params }: { params: { id: string } }) {
  const apod = await getApod(params.id);

  if (!apod) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">Foto antariksa tidak ditemukan atau format tanggal salah.</p>
          <Link href="/apod" className="text-cyan-400 hover:underline mt-4 inline-block">
            Kembali ke Galeri APOD
          </Link>
        </div>
      </div>
    );
  }

  const isVideo = apod.image_url.includes('youtube.com') || 
                  apod.image_url.includes('youtu.be') || 
                  apod.image_url.includes('vimeo.com') || 
                  apod.image_url.includes('player.vimeo.com');

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">
        
        {/* Navigation Breadcrumb */}
        <Link 
          href="/apod" 
          className="text-cyan-400 hover:text-cyan-300 font-bold mb-8 inline-flex items-center gap-2 print:hidden"
        >
          ← Kembali ke Galeri Foto Antariksa
        </Link>

        {/* Detail Box */}
        <div className="bg-slate-900/40 border border-cyan-950/30 rounded-3xl p-6 md:p-10 shadow-2xl print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          
          {/* Header Metadata */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <span className="bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-xs font-bold px-3.5 py-1 rounded-full uppercase">
              NASA APOD
            </span>
            <span className="text-gray-500 text-sm">{formatDateIndo(apod.id)}</span>
          </div>

          {/* Titles */}
          <h1 className="text-3xl md:text-5xl font-black mb-2 text-amber-400 print:text-black text-left leading-tight">
            {apod.title.id || apod.title.en}
          </h1>
          {apod.title.id && (
            <h2 className="text-lg md:text-xl font-medium text-gray-400 italic mb-8 text-left print:hidden">
              {apod.title.en}
            </h2>
          )}

          {/* Interactive Client Actions */}
          <ApodActions apod={apod} />

          {/* Printable APOD Content */}
          <div id="printable-apod-content" className="space-y-8">
            
            {/* Visual Media Wrapper */}
            <div className="w-full rounded-2xl overflow-hidden border border-cyan-950/50 relative bg-slate-950">
              {isVideo ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={apod.image_url}
                    title={apod.title.id || 'NASA APOD Video'}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <SafeImage 
                  src={apod.image_url} 
                  alt={apod.title.id || 'NASA APOD'} 
                  className="w-full h-auto max-h-[600px] object-contain mx-auto"
                  fallback="https://placehold.co/800x500/020617/22d3ee?text=APOD+Space+Photo"
                />
              )}
            </div>

            {/* Info and Copyright */}
            <div className="bg-slate-950/50 rounded-2xl p-5 border border-cyan-950/50 flex flex-wrap justify-between items-center text-sm print:border print:border-gray-300 print:bg-gray-50 print:p-5">
              <div className="text-left mb-2 md:mb-0">
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-bold print:text-black">Tanggal Rilis</span>
                <span className="font-bold text-cyan-300 print:text-black">{formatDateIndo(apod.id)}</span>
              </div>
              <div className="text-left md:text-right">
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-bold print:text-black">Hak Cipta / Sumber</span>
                <span className="font-bold text-gray-200 print:text-black">{apod.copyright || 'NASA Public Domain'}</span>
              </div>
            </div>

            {/* Explanation section (Indonesian) */}
            <div className="text-left space-y-4">
              <h3 className="text-xl md:text-2xl font-bold text-cyan-400 border-b border-cyan-900/30 pb-2 print:text-black print:border-gray-300">
                Penjelasan Ilmiah
              </h3>
              <div className="text-gray-300 leading-relaxed text-sm md:text-base space-y-4 print:text-black">
                {(apod.explanation.id || apod.explanation.en).split('\n').filter(p => p.trim() !== '').map((para, index) => (
                  <p key={index} className="leading-relaxed">{para.trim()}</p>
                ))}
              </div>
            </div>

            {/* Original English Section */}
            {apod.explanation.id && apod.explanation.en && (
              <div className="text-left space-y-3 pt-6 border-t border-slate-900 print:hidden">
                <h4 className="text-sm font-bold text-amber-500/70 uppercase tracking-widest">
                  Original English Explanation
                </h4>
                <div className="text-gray-500 italic leading-relaxed text-xs md:text-sm space-y-3">
                  {apod.explanation.en.split('\n').filter(p => p.trim() !== '').map((para, index) => (
                    <p key={index}>{para.trim()}</p>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="print:hidden mt-8">
            <AdDisplay position="content" />
          </div>

        </div>
      </div>
    </main>
  );
}
