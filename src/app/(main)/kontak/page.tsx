"use client";

import { useState } from 'react';
import { getSiteHost } from '@/lib/siteUrl';

export default function KontakKami() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const contactEmail = `info@${getSiteHost()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      alert("Semua kolom formulir wajib diisi.");
      return;
    }

    setIsSending(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_ag07itm',
          template_id: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_u2z5f9u',
          user_id: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'PyE4txaqSdaKImtPP',
          template_params: {
            from_name: name,
            from_email: email,
            subject: subject,
            message: message,
          },
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        const errorText = await response.text();
        console.error("EmailJS Error Response:", errorText);
        setSubmitStatus('error');
      }
    } catch (err) {
      console.error("Error sending message via EmailJS:", err);
      setSubmitStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 text-cyan-400">Hubungi Kami</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Contact Form */}
          <div className="bg-slate-800/50 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Formulir Kontak</h2>
            
            {submitStatus === 'success' && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl text-xs text-center font-semibold">
                🎉 Pesan Anda berhasil dikirim! Kami akan menghubungi Anda segera.
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs text-center font-semibold">
                ❌ Gagal mengirim pesan. Silakan hubungi kami langsung via email atau WhatsApp.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder="Masukkan nama Anda"
                  disabled={isSending}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder="Masukkan alamat email"
                  disabled={isSending}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Subjek</label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  disabled={isSending}
                >
                  <option value="">Pilih subjek</option>
                  <option value="Pertanyaan Umum">Pertanyaan Umum</option>
                  <option value="Dukungan Teknis">Dukungan Teknis</option>
                  <option value="Kerjasama">Kerjasama</option>
                  <option value="Lapor Masalah">Lapor Masalah</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Pesan</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder="Tulis pesan Anda di sini..."
                  disabled={isSending}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? '⏳ Mengirim...' : 'Kirim Pesan'}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="bg-slate-800/50 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Informasi Kontak</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📧</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email</h3>
                  <p className="text-gray-300">{contactEmail}</p>

                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📱</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">WhatsApp</h3>
                  <p className="text-gray-300">+62 812-3456-7890</p>
                  <p className="text-gray-300">(Senin-Jumat, 09:00-17:00 WIB)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📧</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Media Sosial</h3>
                  <div className="space-y-1">
                    <a href="https://whatsapp.com/channel/meteorit" className="block text-cyan-400 hover:text-cyan-300">WhatsApp Channel</a>
                    <a href="https://t.me/meteoritindonesia" className="block text-cyan-400 hover:text-cyan-300">Telegram Group</a>
                    <a href="https://instagram.com/meteoritindonesia" className="block text-cyan-400 hover:text-cyan-300">Instagram</a>
                    <a href="https://facebook.com/meteoritindonesia" className="block text-cyan-400 hover:text-cyan-300">Facebook</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

       {/* Office Location */}
<div className="bg-slate-800/50 rounded-lg p-8 mb-8">
  <h2 className="text-2xl font-bold mb-6 text-amber-400">Lokasi Kantor</h2>
  
  {/* Bagian Peta */}
  <div className="h-64 bg-slate-700 rounded-lg overflow-hidden mb-4">
    <iframe
      src="https://maps.google.com/maps?q=Jl.%20Astronomi,%20Bekasi,%20Jawa%20Barat&t=&z=15&ie=UTF8&iwloc=&output=embed"
      className="w-full h-full border-0"
      allowFullScreen={true}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    ></iframe>
  </div>

  <div className="text-center">
    <h3 className="font-semibold text-white mb-2">Alamat Kantor</h3>
    <p className="text-gray-300">Jl. Astronomi No. </p>
    <p className="text-gray-300">Bekasi, Jawa Barat 40115</p>
    <p className="text-gray-300">Indonesia</p>
  </div>
</div>
        {/* FAQ Section */}
        <div className="bg-slate-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Pertanyaan yang Sering Diajukan</h2>

          <div className="space-y-4">
            <details className="border border-slate-700 rounded-lg">
              <summary className="px-4 py-3 font-medium cursor-pointer text-white hover:text-cyan-400">
                Bagaimana cara bergabung dengan komunitas?
              </summary>
              <p className="px-4 py-3 text-gray-300">
                Anda dapat bergabung dengan membuat akun di website kami dan kemudian berpartisipasi di forum. Bergabunglah dengan grup Telegram atau WhatsApp Channel kami untuk diskusi real-time.
              </p>
            </details>

            <details className="border border-slate-700 rounded-lg">
              <summary className="px-4 py-3 font-medium cursor-pointer text-white hover:text-cyan-400">
                Bagaimana cara mengidentifikasi meteorit?
              </summary>
              <p className="px-4 py-3 text-gray-300">
                Kami memiliki panduan lengkap di ensiklopedia kami. Anda juga dapat mengunggah foto batu yang Anda temukan di forum kami untuk mendapatkan pendapat dari ahli.
              </p>
            </details>

            <details className="border border-slate-700 rounded-lg">
              <summary className="px-4 py-3 font-medium cursor-pointer text-white hover:text-cyan-400">
                Apakah data di website ini akurat?
              </summary>
              <p className="px-4 py-3 text-gray-300">
                Ya, kami mengambil data langsung dari NASA API dan sumber terpercaya lainnya. Data kami diperbarui secara otomatis setiap hari.
              </p>
            </details>

            <details className="border border-slate-700 rounded-lg">
              <summary className="px-4 py-3 font-medium cursor-pointer text-white hover:text-cyan-400">
                Bagaimana cara mendukung Meteorit Indonesia?
              </summary>
              <p className="px-4 py-3 text-gray-300">
                Anda dapat mendukung kami melalui donasi, menjadi anggota premium, atau berkontribusi dengan menambahkan konten berkualitas di forum kami.
              </p>
            </details>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-300 mb-4">Tidak menemukan jawaban yang Anda cari?</p>
            <a
              href={`mailto:${contactEmail}`}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <span>📧</span> Hubungi Dukungan
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
