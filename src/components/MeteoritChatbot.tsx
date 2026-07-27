"use client";

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isCached?: boolean;
}

const QUICK_SUGGESTIONS = [
  '☄️ Apa itu meteorit?',
  '🔭 Artikel Komet & Asteroid',
  '🌋 Monitoring Bencana (TEWS)',
  '🌌 Peta Langit Malam',
];

export default function MeteoritChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [quotaLimit, setQuotaLimit] = useState<number>(5);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Monitor Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setQuotaLimit(currentUser ? 20 : 5);
      if (remainingQuota === null) {
        setRemainingQuota(currentUser ? 20 : 5);
      }
    });

    return () => unsubscribe();
  }, [remainingQuota]);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('meteorit_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('meteorit_chat_history', JSON.stringify(messages.slice(-20)));
      } catch {
        // Ignore storage errors
      }
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleOpenToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setHasUnread(false);
      // Welcome message if empty
      if (messages.length === 0) {
        const initialGreeting: Message = {
          id: 'welcome',
          role: 'assistant',
          content: 'Halo! 👋 Saya **Meteorit AI Assistant**. Anda dapat menjelajahi [Ensiklopedia Meteorit](/ensiklopedia), mengecek [Peta Langit Malam](/langit-malam), membaca [Artikel Terbaru](/blog), atau memantau [Cuaca Luar Angkasa](/cuaca). Ada yang bisa saya bantu?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([initialGreeting]);
      }
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    try {
      localStorage.removeItem('meteorit_chat_history');
    } catch {
      // Ignore storage errors
    }
    setErrorMessage(null);
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      setErrorMessage(`Batas pesan tercapai. Silakan tunggu beberapa saat lagi.`);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let idToken: string | undefined = undefined;
      if (user) {
        idToken = await user.getIdToken();
      }

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          idToken,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setRemainingQuota(0);
        setErrorMessage(data.error || 'Kuota pesan per jam telah habis.');
        if (data.resetInMinutes) {
          setRateLimitedUntil(Date.now() + data.resetInMinutes * 60 * 1000);
        }
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Gagal terhubung ke server');
      }

      if (typeof data.remaining === 'number') {
        setRemainingQuota(data.remaining);
      }
      if (typeof data.limit === 'number') {
        setQuotaLimit(data.limit);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Maaf, saya tidak dapat memproses tanggapan.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCached: Boolean(data.isCached),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (!isOpen) setHasUnread(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan koneksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (content: string) => {
    if (!content) return null;

    const parts = content.split('\n').map((line, idx) => {
      // Escape HTML entities to prevent invalid markup injection
      let safeLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Process bold **text**
      safeLine = safeLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-100">$1</strong>');
      
      // Process inline code `code`
      safeLine = safeLine.replace(
        /`([^`]+)`/g,
        '<code class="bg-cyan-950/60 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono border border-cyan-800/40">$1</code>'
      );

      // Process markdown links [label](url)
      safeLine = safeLine.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (match, label, url) => {
          let cleanUrl = url.trim();
          if (cleanUrl.includes('meteorit.my.id') || cleanUrl.includes('localhost') || cleanUrl.includes('vercel.app')) {
            try {
              const parsed = new URL(cleanUrl);
              cleanUrl = parsed.pathname + parsed.search + parsed.hash;
            } catch {
              cleanUrl = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');
            }
          }

          const isExternal = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
          const target = isExternal ? '_blank' : '_self';
          const rel = isExternal ? 'rel="noopener noreferrer"' : '';
          return `<a href="${cleanUrl}" target="${target}" ${rel} class="inline-flex items-center gap-0.5 text-cyan-400 font-semibold underline underline-offset-2 hover:text-cyan-200 transition-colors cursor-pointer group/link">${label}<span class="text-[10px] text-cyan-400 inline-block">🔗</span></a>`;
        }
      );

      return (
        <p key={idx} className="mb-1.5 last:mb-0 leading-relaxed" dangerouslySetInnerHTML={{ __html: safeLine }} />
      );
    });

    return <div className="text-sm space-y-1">{parts}</div>;
  };

  return (
    <>
      {/* Floating Action Button (Stacked vertically above ScrollToTop at bottom-20 right-6) */}
      <div className="fixed bottom-20 right-6 z-[120] print:hidden">
        <button
          onClick={handleOpenToggle}
          aria-label="Meteorit AI Chatbot"
          className="relative group bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold p-3.5 rounded-full shadow-xl shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105 flex items-center justify-center border border-cyan-300/30 active:scale-95"
        >
          {/* Pulse Glow Effect */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 opacity-40 blur group-hover:opacity-75 transition duration-500 animate-pulse"></span>

          {/* Unread Badge */}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-900 animate-bounce" />
          )}

          {isOpen ? (
            <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <svg className="w-6 h-6 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 sm:right-6 z-[120] w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[calc(100vh-10rem)] bg-slate-950/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 flex items-center justify-center shadow-md shadow-cyan-500/30">
                <span className="text-sm">☄️</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  Meteorit AI
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-400/30 font-normal">
                    v1.0
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Asisten Astronomi & Kebencanaan</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearHistory}
                title="Hapus Histori Chat"
                className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Tutup Chat"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Rate Limit & Quota Banner */}
          <div className="bg-slate-900/80 border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-cyan-400' : 'bg-amber-400'}`}></span>
              Status: <strong className="text-slate-200">{user ? 'User Login' : 'Guest'}</strong>
            </span>
            <span className="text-cyan-300 font-medium">
              Sisa Kuota: {remainingQuota !== null ? `${remainingQuota}/${quotaLimit}` : `${quotaLimit}/${quotaLimit}`} pesan/jam
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none border border-cyan-400/20'
                      : 'bg-slate-900/90 text-slate-100 rounded-bl-none border border-slate-800/80'
                  }`}
                >
                  {renderFormattedText(msg.content)}
                  <div className={`text-[10px] mt-1 flex items-center justify-between gap-1.5 ${msg.role === 'user' ? 'text-cyan-200/80' : 'text-slate-400'}`}>
                    {msg.role === 'assistant' && msg.isCached ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5 font-medium">
                        ⚡ R2 Cache
                      </span>
                    ) : <span></span>}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-3.5 py-2.5 text-slate-400 text-sm flex items-center space-x-1.5">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
                  <span className="text-xs">Mencari data & mengetik...</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl p-2.5 text-xs">
                {errorMessage}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-900 overflow-x-auto flex space-x-1.5 no-scrollbar">
            {QUICK_SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => sendMessage(chip.replace(/^[^\s]+\s/, ''))}
                className="whitespace-nowrap text-[11px] bg-slate-900 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded-full border border-slate-800 hover:border-cyan-500/40 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? 'Sedang mengetik...' : 'Tanyakan sesuatu tentang meteorit...'}
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white p-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20"
            >
              <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
