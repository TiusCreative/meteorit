"use client";

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Send, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Mail, 
  User as UserIcon, 
  FileText, 
  History, 
  PlusCircle, 
  RefreshCw, 
  Search, 
  Calendar,
  X,
  Inbox,
  ArrowDownLeft,
  Trash2,
  CornerUpLeft,
  CornerUpRight
} from 'lucide-react';

// Form validation schema with Zod
const sendEmailSchema = z.object({
  fromName: z.string().min(1, 'Nama pengirim wajib diisi'),
  fromEmail: z.enum(['timotius@meteorit.my.id', 'info@meteorit.my.id'] as const, {
    message: 'Alamat pengirim tidak valid'
  }),
  to: z.string().min(1, 'Email penerima wajib diisi').email('Format email tidak valid'),
  cc: z.string().refine(val => {
    if (!val) return true;
    return val.split(',').every(email => z.string().email().safeParse(email.trim()).success);
  }, { message: 'Format email pada CC tidak valid' }).optional(),
  bcc: z.string().refine(val => {
    if (!val) return true;
    return val.split(',').every(email => z.string().email().safeParse(email.trim()).success);
  }, { message: 'Format email pada BCC tidak valid' }).optional(),
  subject: z.string().min(3, 'Subjek minimal 3 karakter'),
  message: z.string().min(10, 'Konten email minimal 10 karakter')
});

type FormFields = z.infer<typeof sendEmailSchema>;

interface EmailLog {
  id: string;
  fromName: string;
  fromEmail: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  sentAt: string;
  status: 'success' | 'failed';
}

interface EmailDetail extends EmailLog {
  message: string;
}

interface InboundEmailLog {
  id: string;
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
}

interface InboundEmailDetail extends InboundEmailLog {
  text?: string;
  html?: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function KirimEmailAdmin() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'inbound'>('compose');
  const [showPreview, setShowPreview] = useState(true);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sent History states
  const [emailHistory, setEmailHistory] = useState<EmailLog[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Inbound Inbox states
  const [inboundEmails, setInboundEmails] = useState<InboundEmailLog[]>([]);
  const [isInboundLoading, setIsInboundLoading] = useState(false);
  const [inboundSearchQuery, setInboundSearchQuery] = useState('');
  const [selectedInboundEmail, setSelectedInboundEmail] = useState<InboundEmailDetail | null>(null);
  const [isInboundDetailLoading, setIsInboundDetailLoading] = useState(false);
  
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const { register, handleSubmit, setValue, watch, reset, setError, formState: { errors } } = useForm<FormFields>({
    defaultValues: {
      fromName: 'Meteorit Indonesia',
      fromEmail: 'info@meteorit.my.id',
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      message: ''
    }
  });

  const watchMessage = watch('message');
  const watchFromName = watch('fromName');
  const watchFromEmail = watch('fromEmail');
  const watchSubject = watch('subject');
  const watchTo = watch('to');
  const watchCc = watch('cc');
  const watchBcc = watch('bcc');

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Fetch Outbound History from R2
  const loadHistory = useCallback(async () => {
    if (!currentUser) return;
    setIsHistoryLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/send', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEmailHistory(data.list || []);
      } else {
        const errData = await res.json();
        addToast(errData.error || 'Gagal memuat riwayat pengiriman.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan koneksi saat memuat riwayat.', 'error');
    } finally {
      setIsHistoryLoading(false);
    }
  }, [currentUser]);

  // Fetch Inbound Email List from R2
  const loadInboundHistory = useCallback(async () => {
    if (!currentUser) return;
    setIsInboundLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/inbound', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInboundEmails(data.list || []);
      } else {
        const errData = await res.json();
        addToast(errData.error || 'Gagal memuat email masuk.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan koneksi saat memuat email masuk.', 'error');
    } finally {
      setIsInboundLoading(false);
    }
  }, [currentUser]);

  // Load history on tab toggle
  useEffect(() => {
    if (activeTab === 'history' && currentUser) {
      loadHistory();
    } else if (activeTab === 'inbound' && currentUser) {
      loadInboundHistory();
    }
  }, [activeTab, currentUser, loadHistory, loadInboundHistory]);

  // Load detailed sent email log
  const handleOpenDetail = async (id: string) => {
    if (!currentUser) return;
    setIsDetailLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/send?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedEmail(data.detail);
      } else {
        addToast('Gagal memuat detail log email.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Load detailed inbound email log
  const handleOpenInboundDetail = async (id: string) => {
    if (!currentUser) return;
    setIsInboundDetailLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/inbound?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedInboundEmail(data.detail);
      } else {
        addToast('Gagal memuat detail email masuk.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsInboundDetailLoading(false);
    }
  };

  // Helper to extract email address from "Name <email@domain.com>"
  const extractEmailAddress = (fromStr: string) => {
    const match = fromStr.match(/<([^>]+)>/);
    return match ? match[1] : fromStr.trim();
  };

  // Delete Inbound Email from R2
  const handleDeleteInbound = async (id: string) => {
    if (!currentUser) return;
    if (!confirm('Apakah Anda yakin ingin menghapus email masuk ini?')) return;
    
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/inbound?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        addToast('Email masuk berhasil dihapus.', 'success');
        setSelectedInboundEmail(null);
        loadInboundHistory();
      } else {
        const errData = await res.json();
        addToast(errData.error || 'Gagal menghapus email masuk.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan saat menghapus email.', 'error');
    }
  };

  // Helper to strip HTML tags and decode basic HTML entities
  const stripHtml = (htmlStr: string) => {
    if (!htmlStr) return '';
    return htmlStr
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '')
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  };

  // Reply Inbound Email
  const handleReplyInbound = (email: InboundEmailDetail) => {
    const toEmail = extractEmailAddress(email.from);
    setValue('to', toEmail);
    setValue('subject', email.subject.toLowerCase().startsWith('re:') ? email.subject : `Re: ${email.subject}`);
    
    const formattedDate = new Date(email.receivedAt).toLocaleString('id-ID');
    const plainContent = email.text || stripHtml(email.html || '');
    const quotedLines = plainContent.split('\n').map(line => `> ${line}`).join('\n');
    
    const replyBody = `\n\nPada tanggal ${formattedDate}, ${email.from} menulis:\n${quotedLines}`;
    setValue('message', replyBody);
    
    setActiveTab('compose');
    setSelectedInboundEmail(null);
    addToast(`Menyiapkan balasan untuk ${toEmail}`, 'info');
  };

  // Forward Inbound Email
  const handleForwardInbound = (email: InboundEmailDetail) => {
    setValue('to', '');
    setValue('subject', email.subject.toLowerCase().startsWith('fwd:') ? email.subject : `Fwd: ${email.subject}`);
    
    const formattedDate = new Date(email.receivedAt).toLocaleString('id-ID');
    const plainContent = email.text || stripHtml(email.html || '');
    const quotedLines = plainContent.split('\n').map(line => `> ${line}`).join('\n');
    
    const forwardBody = `\n\n---------- Forwarded message ---------\nDari: ${email.from}\nTanggal: ${formattedDate}\nSubjek: ${email.subject}\nKepada: ${email.to}\n\n${quotedLines}`;
    setValue('message', forwardBody);
    
    setActiveTab('compose');
    setSelectedInboundEmail(null);
    addToast('Menyiapkan penerusan email. Silakan isi alamat tujuan.', 'info');
  };

  // Fetch detailed inbound email and trigger action (Reply/Forward) directly from table row
  const handleActionWithDetail = async (id: string, action: 'reply' | 'forward') => {
    if (!currentUser) return;
    setIsInboundDetailLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/inbound?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (action === 'reply') {
          handleReplyInbound(data.detail);
        } else if (action === 'forward') {
          handleForwardInbound(data.detail);
        }
      } else {
        addToast('Gagal memuat detail email untuk aksi ini.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan koneksi.', 'error');
    } finally {
      setIsInboundDetailLoading(false);
    }
  };

  // Submit Handler
  const onSubmit = async (data: FormFields) => {
    // Validate with Zod
    const validation = sendEmailSchema.safeParse(data);
    if (!validation.success) {
      validation.error.issues.forEach(err => {
        setError(err.path[0] as any, { message: err.message });
      });
      return;
    }

    if (!currentUser) {
      addToast('Anda belum terautentikasi.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(data)
      });

      const resData = await res.json();

      if (res.ok && resData.success) {
        addToast('Email sukses dikirim dan dicatat ke R2!', 'success');
        // Reset form inputs except sender details
        reset({
          fromName: data.fromName,
          fromEmail: data.fromEmail,
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          message: ''
        });
      } else {
        addToast(resData.error || 'Gagal mengirim email.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan koneksi saat mengirim email.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Format HTML Insertion Helper
  const insertHtmlHelper = (tagStart: string, tagEnd: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = tagStart + selectedText + tagEnd;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    setValue('message', newValue, { shouldValidate: true });
    
    // Focus back and select inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selectedText.length);
    }, 0);
  };

  // Filtered History
  const filteredHistory = emailHistory.filter(log => 
    log.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.fromName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Inbound Emails
  const filteredInbound = inboundEmails.filter(log => 
    log.from.toLowerCase().includes(inboundSearchQuery.toLowerCase()) ||
    log.subject.toLowerCase().includes(inboundSearchQuery.toLowerCase()) ||
    log.to.toLowerCase().includes(inboundSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left relative min-h-[80vh]">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-start gap-3 border text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200' :
              toast.type === 'error' ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200' :
              'bg-blue-50 dark:bg-blue-950/90 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200'
            }`}
          >
            <span className="text-base shrink-0">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <div className="flex-1 text-xs md:text-sm leading-relaxed">{toast.message}</div>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Header and Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Panel Pengiriman Email
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kirim newsletter, info transaksi, atau pengumuman dengan domain <strong>meteorit.my.id</strong> menggunakan Resend API.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-200/60 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-300/40 dark:border-slate-800 w-fit shrink-0">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'compose'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PlusCircle size={15} />
            Tulis Email
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History size={15} />
            Riwayat Log R2
          </button>
          <button
            onClick={() => setActiveTab('inbound')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'inbound'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Inbox size={15} />
            Email Masuk
          </button>
        </div>
      </div>

      {/* Tab Content 1: Compose Form */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Email Compose Form */}
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            className={`bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-900 space-y-5 transition-all duration-300 ${
              showPreview ? 'lg:col-span-7' : 'lg:col-span-12'
            }`}
          >
            <div className="flex justify-between items-center border-b dark:border-slate-900 pb-3">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                ✉️ Tulis Pesan Baru
              </h2>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                {showPreview ? (
                  <>
                    <EyeOff size={14} /> Sembunyikan Preview
                  </>
                ) : (
                  <>
                    <Eye size={14} /> Tampilkan Preview
                  </>
                )}
              </button>
            </div>

            {/* Input Row: From Name & From Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <UserIcon size={12} /> From Name
                </label>
                <input
                  type="text"
                  {...register('fromName')}
                  placeholder="Contoh: Meteorit Indonesia"
                  className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 text-sm ${
                    errors.fromName ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.fromName && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.fromName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Mail size={12} /> From Email
                </label>
                <select
                  {...register('fromEmail')}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 text-sm bg-white ${
                    errors.fromEmail ? 'border-red-500' : 'border-slate-300'
                  }`}
                >
                  <option value="info@meteorit.my.id">info@meteorit.my.id</option>
                  <option value="timotius@meteorit.my.id">timotius@meteorit.my.id</option>
                </select>
                {errors.fromEmail && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.fromEmail.message}</p>
                )}
              </div>
            </div>

            {/* Input: To (Recipient) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  📥 Kepada (To)
                </label>
                <button
                  type="button"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                >
                  {showCcBcc ? 'Sembunyikan CC/BCC' : '+ Tambah CC/BCC'}
                </button>
              </div>
              <input
                type="email"
                {...register('to')}
                placeholder="penerima@example.com"
                className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 text-sm ${
                  errors.to ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.to && (
                <p className="text-red-500 text-xs mt-1 font-semibold">{errors.to.message}</p>
              )}
            </div>

            {/* Optional inputs: CC & BCC */}
            {showCcBcc && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-900">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    CC (Carbon Copy)
                  </label>
                  <input
                    type="text"
                    {...register('cc')}
                    placeholder="email1@domain.com, email2@domain.com"
                    className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-105 text-xs ${
                      errors.cc ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Gunakan koma (,) untuk memisahkan beberapa email</p>
                  {errors.cc && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{errors.cc.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    BCC (Blind Carbon Copy)
                  </label>
                  <input
                    type="text"
                    {...register('bcc')}
                    placeholder="email3@domain.com, email4@domain.com"
                    className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-105 text-xs ${
                      errors.bcc ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Penerima BCC tidak akan terlihat oleh penerima lainnya</p>
                  {errors.bcc && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{errors.bcc.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Input: Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileText size={12} /> Subjek (Subject)
              </label>
              <input
                type="text"
                {...register('subject')}
                placeholder="Masukkan subjek email"
                className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 text-sm ${
                  errors.subject ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1 font-semibold">{errors.subject.message}</p>
              )}
            </div>

            {/* Message Area (HTML Message) */}
            <div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  💬 Isi Pesan (HTML / Rich Text)
                </label>
                
                {/* HTML Helper Formatting Buttons */}
                <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 select-none">
                  {[
                    { label: 'Bold', tag: ['<strong>', '</strong>'] },
                    { label: 'Italic', tag: ['<em>', '</em>'] },
                    { label: 'H1', tag: ['<h1>', '</h1>'] },
                    { label: 'H2', tag: ['<h2>', '</h2>'] },
                    { label: 'Link', tag: ['<a href="https://" target="_blank">', '</a>'] },
                    { label: 'Paragraf', tag: ['<p>', '</p>'] },
                    { label: 'LineBreak', tag: ['<br />', ''] },
                    { label: 'Button', tag: ['<a href="https://" style="display:inline-block;background-color:#0284c7;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">', '</a>'] }
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => insertHtmlHelper(btn.tag[0], btn.tag[1])}
                      className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="message-textarea"
                rows={12}
                {...register('message')}
                placeholder="Ketik isi email Anda di sini. Tag HTML didukung..."
                className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 font-mono text-sm leading-relaxed ${
                  errors.message ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1 font-semibold">{errors.message.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-900">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl text-xs md:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Kirim Email
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => reset()}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold py-3 px-5 rounded-xl text-xs md:text-sm transition-colors disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>
          </form>

          {/* Email Preview Section (Right Panel) */}
          {showPreview && (
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 static lg:sticky lg:top-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1 border-b dark:border-slate-800 pb-2">
                👀 Live HTML Preview
              </h3>

              {/* Browser mockup design */}
              <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
                {/* Browser top-bar */}
                <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b dark:border-slate-800">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 bg-red-400 rounded-full"></span>
                    <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></span>
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full"></span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 px-6 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                    meteorit.my.id/mailer
                  </div>
                  <div className="w-10"></div>
                </div>

                {/* Email headers mockup */}
                <div className="p-4 border-b dark:border-slate-850 space-y-2 text-slate-600 dark:text-slate-350">
                  <div>
                    <span className="font-bold text-slate-400">Dari:</span> {watchFromName || 'Meteorit Indonesia'} &lt;{watchFromEmail || 'info@meteorit.my.id'}&gt;
                  </div>
                  <div>
                    <span className="font-bold text-slate-400">Ke:</span> {watchTo || 'penerima@example.com'}
                  </div>
                  {watchCc && (
                    <div>
                      <span className="font-bold text-slate-400">CC:</span> <span className="font-mono text-slate-500">{watchCc}</span>
                    </div>
                  )}
                  {watchBcc && (
                    <div>
                      <span className="font-bold text-slate-400">BCC:</span> <span className="font-mono text-slate-500">{watchBcc}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-slate-400">Subjek:</span> <strong className="text-slate-800 dark:text-slate-100 font-bold">{watchSubject || '(Tanpa Subjek)'}</strong>
                  </div>
                </div>

                {/* Email body render */}
                <div className="p-4 min-h-[300px] max-h-[450px] overflow-y-auto bg-white text-slate-800 text-sm">
                  {watchMessage ? (
                    <div 
                      className="prose prose-sm max-w-none break-words email-preview-body"
                      dangerouslySetInnerHTML={{ __html: watchMessage }} 
                    />
                  ) : (
                    <p className="text-slate-400 italic text-center py-20 select-none">Tulis pesan untuk melihat pratinjau di sini.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Outbound History */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-900 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-slate-900 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              📜 Log Riwayat Pengiriman
            </h2>

            {/* Filter & Refresh Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Cari penerima / subjek..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <button
                type="button"
                onClick={loadHistory}
                disabled={isHistoryLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition-colors disabled:opacity-50 shrink-0"
              >
                <RefreshCw size={13} className={isHistoryLoading ? 'animate-spin' : ''} />
                {isHistoryLoading ? 'Memuat...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Logs List Table */}
          {isHistoryLoading && emailHistory.length === 0 ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-semibold flex flex-col items-center justify-center gap-3">
              <span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              Mengambil log riwayat dari R2...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-sm">
              Tidak ada log pengiriman ditemukan {searchQuery && 'yang cocok dengan pencarian Anda'}.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-900 shadow-sm">
              <table className="w-full text-xs text-left border-collapse bg-white dark:bg-slate-950">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-bold">
                    <th className="p-4">Tanggal &amp; Waktu</th>
                    <th className="p-4">Pengirim (From)</th>
                    <th className="p-4">Penerima (To)</th>
                    <th className="p-4">Subjek</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-900 text-slate-700 dark:text-slate-350">
                  {filteredHistory.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-455 font-mono">
                          <Calendar size={12} />
                          {new Date(log.sentAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </div>
                      </td>
                      <td className="p-4 font-semibold">
                        <p>{log.fromName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.fromEmail}</p>
                      </td>
                      <td className="p-4 font-semibold font-mono text-slate-800 dark:text-slate-200">
                        <div className="max-w-[150px] truncate">{log.to}</div>
                        {(log.cc || log.bcc) && (
                          <div className="flex gap-1.5 mt-1">
                            {log.cc && <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded text-[9px] font-bold">CC</span>}
                            {log.bcc && <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded text-[9px] font-bold">BCC</span>}
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-xs truncate font-medium">
                        {log.subject}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'success' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50' 
                            : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                          {log.status === 'success' ? 'Berhasil' : 'Gagal'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(log.id)}
                          className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 rounded-lg font-bold transition-all text-[11px]"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Inbound Emails */}
      {activeTab === 'inbound' && (
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-900 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-slate-900 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              📥 Email Masuk (Inbound Inbox)
            </h2>

            {/* Inbound Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Cari pengirim / subjek..."
                  value={inboundSearchQuery}
                  onChange={(e) => setInboundSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <button
                type="button"
                onClick={loadInboundHistory}
                disabled={isInboundLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition-colors disabled:opacity-50 shrink-0"
              >
                <RefreshCw size={13} className={isInboundLoading ? 'animate-spin' : ''} />
                {isInboundLoading ? 'Memuat...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Inbound Emails Table */}
          {isInboundLoading && inboundEmails.length === 0 ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-semibold flex flex-col items-center justify-center gap-3">
              <span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              Mengambil email masuk dari R2...
            </div>
          ) : filteredInbound.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center gap-2">
              <ArrowDownLeft size={24} className="text-slate-355" />
              <p>Tidak ada email masuk terdeteksi {inboundSearchQuery && 'yang cocok dengan pencarian'}.</p>
              <p className="text-[10px] text-slate-400 max-w-sm mt-1 leading-normal text-center">
                Hubungkan Gmail Forwarding Anda ke <strong>inbox@inbound.meteorit.my.id</strong> dan pastikan DNS Subdomain diaktifkan di Rumahweb.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-900 shadow-sm">
              <table className="w-full text-xs text-left border-collapse bg-white dark:bg-slate-950">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-bold">
                    <th className="p-4">Tanggal Terima</th>
                    <th className="p-4">Pengirim (From)</th>
                    <th className="p-4">Penerima (To)</th>
                    <th className="p-4">Subjek</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-900 text-slate-700 dark:text-slate-350">
                  {filteredInbound.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-450 font-mono">
                          <Calendar size={12} />
                          {new Date(log.receivedAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </div>
                      </td>
                      <td className="p-4 font-semibold font-mono text-slate-800 dark:text-slate-200">
                        {log.from}
                      </td>
                      <td className="p-4 font-mono text-slate-500">
                        {log.to}
                      </td>
                      <td className="p-4 max-w-xs truncate font-medium">
                        {log.subject}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenInboundDetail(log.id)}
                            className="px-2.5 py-1.5 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 rounded-lg font-bold transition-all text-[11px]"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => handleActionWithDetail(log.id, 'reply')}
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-all"
                            title="Balas Email"
                          >
                            <CornerUpLeft size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleActionWithDetail(log.id, 'forward')}
                            className="p-1.5 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all"
                            title="Teruskan Email"
                          >
                            <CornerUpRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInbound(log.id)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-all"
                            title="Hapus Email"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal: Sent Email */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div 
            className="bg-white dark:bg-slate-950 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Detail Log Pengiriman Email
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Resend ID: {selectedEmail.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Info */}
            <div className="p-6 border-b dark:border-slate-900 space-y-3 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm text-slate-600 dark:text-slate-350">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="font-bold text-slate-400">Dari:</span> {selectedEmail.fromName} &lt;{selectedEmail.fromEmail}&gt;
                </div>
                <div>
                  <span className="font-bold text-slate-400">Waktu Kirim:</span> {new Date(selectedEmail.sentAt).toLocaleString('id-ID')}
                </div>
                <div>
                  <span className="font-bold text-slate-400">Ke:</span> <span className="font-mono">{selectedEmail.to}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400">Status:</span> 
                  <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-bold">✅ Sukses Tercatat</span>
                </div>
                {selectedEmail.cc && (
                  <div className="md:col-span-2">
                    <span className="font-bold text-slate-400">CC:</span> <span className="font-mono">{selectedEmail.cc}</span>
                  </div>
                )}
                {selectedEmail.bcc && (
                  <div className="md:col-span-2">
                    <span className="font-bold text-slate-400">BCC:</span> <span className="font-mono">{selectedEmail.bcc}</span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-slate-150 dark:border-slate-900">
                <span className="font-bold text-slate-400">Subjek:</span> <strong className="text-slate-800 dark:text-slate-100 font-bold">{selectedEmail.subject}</strong>
              </div>
            </div>

            {/* Rendered HTML Container */}
            <div className="flex-1 p-6 overflow-y-auto bg-white min-h-[250px]">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-50/10">
                <div className="bg-slate-100 px-4 py-2 border-b text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Pratinjau HTML Pesan</span>
                  <span className="text-[9px] text-slate-400">Dimuat dari Cloudflare R2</span>
                </div>
                <div className="p-5 bg-white text-sm text-slate-800 min-h-[200px] break-words">
                  <div 
                    className="prose prose-sm max-w-none email-preview-body"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.message }} 
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal: Inbound Email */}
      {selectedInboundEmail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div 
            className="bg-white dark:bg-slate-950 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ArrowDownLeft size={16} className="text-cyan-500" />
                  Detail Email Masuk (Inbound Log)
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Resend Message ID: {selectedInboundEmail.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedInboundEmail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Info */}
            <div className="p-6 border-b dark:border-slate-900 space-y-3 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm text-slate-600 dark:text-slate-350">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="font-bold text-slate-400">Dari (From):</span> <span className="font-mono">{selectedInboundEmail.from}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400">Diterima:</span> {new Date(selectedInboundEmail.receivedAt).toLocaleString('id-ID')}
                </div>
                <div>
                  <span className="font-bold text-slate-400">Kepada (To):</span> <span className="font-mono">{selectedInboundEmail.to}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-150 dark:border-slate-900">
                <span className="font-bold text-slate-400">Subjek:</span> <strong className="text-slate-800 dark:text-slate-100 font-bold">{selectedInboundEmail.subject}</strong>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-white min-h-[250px]">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner">
                <div className="bg-slate-100 px-4 py-2 border-b text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Konten Email Masuk</span>
                  <span className="text-[9px] text-slate-400">Resend Webhook</span>
                </div>
                <div className="p-5 bg-white text-sm text-slate-800 min-h-[200px] break-words">
                  {selectedInboundEmail.html ? (
                    <div 
                      className="prose prose-sm max-w-none email-preview-body"
                      dangerouslySetInnerHTML={{ __html: selectedInboundEmail.html }} 
                    />
                  ) : (
                    <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed">{selectedInboundEmail.text || '(Pesan kosong)'}</pre>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => handleDeleteInbound(selectedInboundEmail.id)}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5 mr-auto"
              >
                <Trash2 size={13} />
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleForwardInbound(selectedInboundEmail)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-800"
              >
                <CornerUpRight size={13} />
                Teruskan
              </button>
              <button
                type="button"
                onClick={() => handleReplyInbound(selectedInboundEmail)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <CornerUpLeft size={13} />
                Balas
              </button>
              <button
                type="button"
                onClick={() => setSelectedInboundEmail(null)}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
