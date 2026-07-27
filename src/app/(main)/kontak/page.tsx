"use client";

import { useState } from 'react';
import { getSiteHost } from '@/lib/siteUrl';
import { kontakText } from '@/lib/translations/kontak';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

export default function KontakKami() {
  const language = useSiteLanguage();
  const t = kontakText[language];
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
      alert(t.alertValidation || "Semua kolom formulir wajib diisi.");
      return;
    }

    setIsSending(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/20">
            {t.badge}
          </span>
          <h1 className="text-4xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-400 mt-3 text-sm max-w-xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Contact Form */}
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700/40">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.title}</h2>
            
            {submitStatus === 'success' && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl text-xs text-center font-semibold">
                🎉 {t.successMsg}
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs text-center font-semibold">
                ❌ {t.errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-300 mb-1">{t.nameLabel}</label>
                <input
                  type="text"
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder={t.namePlaceholder}
                  disabled={isSending}
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-300 mb-1">{t.emailLabel}</label>
                <input
                  type="email"
                  id="contact-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder={t.emailPlaceholder}
                  disabled={isSending}
                />
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-300 mb-1">{t.subjectLabel}</label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  disabled={isSending}
                >
                  <option value="">{t.subjectPlaceholder}</option>
                  <option value="Pertanyaan Umum">Pertanyaan Umum / General Question</option>
                  <option value="Dukungan Teknis">Dukungan Teknis / Technical Support</option>
                  <option value="Kerjasama">Kerjasama / Collaboration</option>
                  <option value="Lapor Masalah">Lapor Masalah / Report Issue</option>
                  <option value="Lainnya">Lainnya / Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-300 mb-1">{t.messageLabel}</label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder={t.messagePlaceholder}
                  disabled={isSending}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? `⏳ ${t.submitting}` : t.submit}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700/40">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Info</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📧</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{t.emailTitle}</h3>
                  <p className="text-gray-300">{contactEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">💬</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{t.telegramTitle}</h3>
                  <p className="text-gray-300">{t.telegramDesc}</p>
                  <div className="space-y-1 mt-2">
                    <a href="https://whatsapp.com/channel/meteorit" className="block text-cyan-400 hover:text-cyan-300 text-sm">WhatsApp Channel</a>
                    <a href="https://t.me/meteoritindonesia" className="block text-cyan-400 hover:text-cyan-300 text-sm">Telegram Group</a>
                    <a href="https://instagram.com/meteoritindonesia" className="block text-cyan-400 hover:text-cyan-300 text-sm">Instagram</a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{t.locationTitle}</h3>
                  <p className="text-gray-300">{t.locationDesc}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">⏱</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{t.responseTitle}</h3>
                  <p className="text-gray-300">{t.responseDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
