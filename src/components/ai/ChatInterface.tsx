'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { aiApi, type ChatMessage } from '@/lib/api/ai';
import { Send, Bot, User, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { useT } from '@/hooks/use-t';

// ── Markdown-like formatting for assistant messages ──────────────────────────
function formatText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('# '))
      return (
        <h2 key={i} className="text-base font-bold mt-2 mb-1">
          {line.slice(2)}
        </h2>
      );
    if (line.startsWith('## '))
      return (
        <h3 key={i} className="text-sm font-semibold mt-2 mb-1">
          {line.slice(3)}
        </h3>
      );
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={i} className="ml-4 list-disc text-sm">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === '') return <br key={i} />;
    return (
      <p key={i} className="text-sm leading-relaxed">
        {line}
      </p>
    );
  });
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, locale }: { msg: ChatMessage; locale: 'en' | 'vi' }) {
  const isUser = msg.role === 'user';
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
            : 'bg-gradient-to-br from-violet-500 to-purple-600'
        }
      `}
      >
        {isUser ? (
          <User size={15} className="text-white" />
        ) : (
          <Bot size={15} className="text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`
        max-w-[78%] rounded-2xl px-4 py-3 shadow-sm
        ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-md'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
        }
      `}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <div className="text-gray-800">{formatText(msg.content)}</div>
        )}
        <p
          className={`text-[10px] mt-1.5 ${isUser ? 'text-blue-100 text-right' : 'text-gray-400'}`}
        >
          {msg.timestamp.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <Bot size={15} className="text-white" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatInterface() {
  const { t, locale } = useT();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Localized initial state derived from i18n
  const welcomeMessage = t('aiAssistant.welcome');
  const suggestions = useMemo(
    () => [
      t('aiAssistant.suggestions.schedule'),
      t('aiAssistant.suggestions.attendance'),
      t('aiAssistant.suggestions.documents'),
      t('aiAssistant.suggestions.help'),
    ],
    [t]
  );

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { history } = await aiApi.getHistory(locale);

        if (history.length > 0) {
          // Reverse history because backend returns it sorted by timestamp DESC
          setMessages(history.reverse());
        } else {
          // If no history, show the welcome message as the first message
          setMessages([
            {
              role: 'assistant',
              content: welcomeMessage,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        // Fallback if API fails
        setMessages([
          {
            role: 'assistant',
            content: `${welcomeMessage} ${locale === 'vi' ? '(Loi tai lich su)' : '(Error loading history)'}`,
            timestamp: new Date(),
          },
        ]);
      }
    };
    loadHistory();
  }, [welcomeMessage, locale]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const reply = await aiApi.chat(trimmed, locale);
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errMsg: ChatMessage = {
          role: 'assistant',
          content: t('auth.errors.network'),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [isLoading, locale, t]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border dark:border-slate-700/60 overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-border dark:border-slate-700/60 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-neutral-900 dark:text-slate-100 text-sm">
                {t('nav.aiAssistant')}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                {locale === 'vi' ? 'Duoc ho tro boi Gemini' : 'Powered by Gemini'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              title={t('common.delete')}
              className="p-1.5 rounded-lg text-neutral-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} locale={locale} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && suggestions.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors cursor-pointer rounded-full"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="bg-white dark:bg-slate-900 border-t border-border dark:border-slate-700/60 px-4 py-3 shrink-0">
          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 bg-neutral-50 dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 dark:focus-within:ring-violet-500/20 transition-all px-3 py-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('discussion.inputPlaceholder')}
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none border-none outline-none text-sm text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 py-1.5 max-h-[120px] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mb-0.5 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} className="-ml-0.5" />
              )}
            </button>
          </form>
          <p className="text-center text-[10px] text-neutral-400 dark:text-slate-500 mt-2">
            {locale === 'vi'
              ? 'AI co the mac loi. Hay kiem tra thong tin quan trong.'
              : 'AI can make mistakes. Check important info.'}
          </p>
        </div>
      </div>
    </div>
  );
}
