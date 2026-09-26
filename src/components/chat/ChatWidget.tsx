"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/i18n/LocaleProvider";

type Message = {
  role: "user" | "assistant";
  content: string;
  /** Questions proposées sous une réponse du bot, cliquables. */
  suggestions?: string[];
};

/**
 * Floating support chat. Talks to /api/chat, a model-free intent router
 * that only answers from the site's own dictionaries — no key, no external
 * call, nothing a visitor could steer. Suggestion chips show what can be
 * asked, since a rule-based bot only understands the questions it was taught.
 */
export default function ChatWidget() {
  const { locale, dict } = useLocale();
  const t = dict.chat;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape closes the panel, matching the site's other overlays.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })), locale }),
      });
      const data = await response.json();
      setMessages([
        ...next,
        response.ok && data.reply
          ? { role: "assistant", content: data.reply, suggestions: data.suggestions }
          : { role: "assistant", content: t.error },
      ]);
    } catch {
      setMessages([...next, { role: "assistant", content: t.error }]);
    } finally {
      setPending(false);
    }
  }

  function send(event: React.FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  const chips = (items: string[]) => (
    <div className="chat-chips">
      {items.map((q) => (
        <button key={q} type="button" className="chat-chip" onClick={() => void ask(q)} disabled={pending}>
          {q}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="chat-launcher"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? t.close : t.open}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.3-.7L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel"
            role="dialog"
            aria-label={t.title}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="chat-head">
              <strong>{t.title}</strong>
              <span>{t.subtitle}</span>
            </header>

            <div className="chat-log" ref={scrollRef}>
              <div className="chat-msg chat-msg-bot">{t.greeting}</div>
              {messages.length === 0 && chips(t.buddy.suggestions.map((s) => s.label))}
              {messages.map((message, index) => (
                <div key={index}>
                  <div className={`chat-msg ${message.role === "user" ? "chat-msg-user" : "chat-msg-bot"}`}>
                    {message.content}
                  </div>
                  {message.suggestions && message.suggestions.length > 0 && chips(message.suggestions)}
                </div>
              ))}
              {pending && (
                <div className="chat-msg chat-msg-bot chat-msg-pending">{t.thinking}</div>
              )}
            </div>

            <form className="chat-form" onSubmit={send}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t.placeholder}
                aria-label={t.placeholder}
                maxLength={1500}
              />
              <button type="submit" disabled={pending || !input.trim()} aria-label={t.send}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
