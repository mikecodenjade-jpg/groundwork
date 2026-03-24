"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Session = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
};

type Profile = {
  full_name: string | null;
  role: string | null;
  company: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSIONS_KEY = "gw_coach_sessions";
const WELCOME_KEY = "gw_coach_welcome_shown";
const MAX_SESSIONS = 20;

const QUICK_PROMPTS = [
  "My crew is dragging and I don't know why",
  "I'm behind schedule and the GC is on me",
  "How do I handle a safety incident with my team",
  "I want to move up but don't know the next step",
  "I can't stop thinking about work when I'm home",
  "One of my guys is struggling and I don't know what to say",
];

// ─── Session helpers ──────────────────────────────────────────────────────────

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

function persistSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(
      SESSIONS_KEY,
      JSON.stringify(sessions.slice(0, MAX_SESSIONS))
    );
  } catch {}
}

function newSession(): Session {
  return {
    id: Date.now().toString(),
    title: "New conversation",
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(profile: Profile | null): string {
  const who = profile
    ? [
        profile.full_name && `The user's name is ${profile.full_name}.`,
        profile.role && `Their role is ${profile.role}.`,
        profile.company && `They work at ${profile.company}.`,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return `You are the Groundwork Coach — an AI built specifically for construction professionals. You speak directly, no fluff, no therapy-speak. You understand jobsite culture, long hours, physical demands, crew management, and the pressure of schedules and budgets. You help with fitness (workouts, recovery, nutrition), mental health (stress, burnout, anger, sleep), leadership (managing crews, difficult conversations, career growth), and personal life (being present at home, relationships). Keep responses short — 2-3 paragraphs max. Talk like a mentor who's been in the field, not a corporate coach. Never be soft. Be real.${who ? `\n\n${who}` : ""}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions, welcome flag, and profile on mount
  useEffect(() => {
    const stored = loadSessions();
    setSessions(stored);
    setWelcomeShown(localStorage.getItem(WELCOME_KEY) === "1");

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfileLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_profiles")
        .select("full_name, role, company")
        .eq("id", user.id)
        .single();
      setProfile(data as Profile | null);
      setProfileLoading(false);
    }
    loadProfile();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function startNewSession() {
    const session = newSession();
    setSessions((prev) => {
      const updated = [session, ...prev];
      persistSessions(updated);
      return updated;
    });
    setCurrentSessionId(session.id);
    setMessages([]);
    setShowHistory(false);
  }

  function openSession(session: Session) {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setShowHistory(false);
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      // Create a session on first message if none active
      let sessionId = currentSessionId;
      if (!sessionId) {
        const session = newSession();
        sessionId = session.id;
        setCurrentSessionId(session.id);
        setSessions((prev) => {
          const updated = [session, ...prev];
          persistSessions(updated);
          return updated;
        });
        if (!welcomeShown) {
          localStorage.setItem(WELCOME_KEY, "1");
          setWelcomeShown(true);
        }
      }

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      let finalMessages: Message[];

      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map(({ role, content }) => ({ role, content })),
            system: buildSystemPrompt(profile),
          }),
        });

        const data = await res.json();
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: res.ok
            ? data.content
            : "Something went wrong. Check your API key configuration.",
        };
        finalMessages = [...newMessages, assistantMsg];
      } catch {
        finalMessages = [
          ...newMessages,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Network error. Check your connection and try again.",
          },
        ];
      }

      setMessages(finalMessages);

      // Persist session with updated messages
      const sid = sessionId;
      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== sid) return s;
          const title =
            finalMessages.find((m) => m.role === "user")?.content.slice(0, 55) ??
            s.title;
          return {
            ...s,
            messages: finalMessages,
            title,
            updatedAt: new Date().toISOString(),
          };
        });
        persistSessions(updated);
        return updated;
      });

      setLoading(false);
    },
    [loading, messages, profile, currentSessionId, welcomeShown]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  const showWelcome = messages.length === 0 && !profileLoading;

  return (
    <main
      className="flex flex-col"
      style={{ height: "100svh", backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      {/* History Panel */}
      {showHistory && (
        <HistoryPanel
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNew={startNewSession}
          onOpen={openSession}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <header
        className="flex items-center gap-4 px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid #1A1A1A", backgroundColor: "#0A0A0A" }}
      >
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
          style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "6px" }}
          aria-label="Back to dashboard"
        >
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
            <path
              d="M13 4L7 10L13 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Groundwork
          </p>
          <h1
            className="text-3xl font-bold uppercase leading-none"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Coach
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {profile && (
            <p
              className="text-xs text-right hidden sm:block"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              {profile.full_name && (
                <span className="block font-semibold" style={{ color: "#E8E2D8" }}>
                  {profile.full_name}
                </span>
              )}
              {profile.role}
            </p>
          )}

          {/* New chat button */}
          <button
            onClick={startNewSession}
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "6px" }}
            aria-label="New conversation"
            title="New conversation"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path
                d="M10 4v12M4 10h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* History button */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "6px" }}
            aria-label="View conversation history"
            title="Conversation history"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 7v3.5l2.5 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4"
        style={{ paddingBottom: "8px" }}
      >
        {/* Welcome state */}
        {showWelcome && (
          <div className="flex flex-col gap-6 flex-1 justify-center max-w-lg mx-auto w-full">
            <div className="flex flex-col gap-2">
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                AI Coach
              </p>
              {!welcomeShown && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  This is your Coach. Think of it like talking to a foreman
                  who&apos;s seen everything — crew problems, schedule pressure,
                  career moves. Ask it anything about the job or yourself.
                  It&apos;s private.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}
              >
                Common questions
              </p>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-3 text-sm transition-all hover:opacity-80 active:scale-[0.99]"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "8px",
                    color: "#E8E2D8",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start gap-3 max-w-[80%]">
            <div
              className="flex items-center gap-1.5 px-4 py-3"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px 12px 12px 3px",
              }}
            >
              {[0, 150, 300].map((delay) => (
                <div
                  key={delay}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: "#C45B28",
                    animationDelay: `${delay}ms`,
                    animationDuration: "900ms",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 px-4 pt-3"
        style={{
          borderTop: "1px solid #1A1A1A",
          backgroundColor: "#0A0A0A",
          paddingBottom: "calc(64px + 12px)",
        }}
      >
        <div
          className="flex items-end gap-3 px-4 py-3"
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: "12px",
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach anything…"
            disabled={loading}
            className="flex-1 text-sm leading-relaxed resize-none outline-none bg-transparent"
            style={{
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
              maxHeight: "120px",
              minHeight: "24px",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-95 disabled:opacity-30"
            style={{ backgroundColor: "#C45B28", color: "#0A0A0A" }}
            aria-label="Send message"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path
                d="M3 10L17 10M17 10L11 4M17 10L11 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <p
          className="text-center text-[10px] mt-2"
          style={{ color: "#2A2A2A", fontFamily: "var(--font-inter)" }}
        >
          Enter to send · Shift+Enter for new line
        </p>
        <p
          className="text-center text-[10px] mt-1"
          style={{ color: "#2A2A2A", fontFamily: "var(--font-inter)" }}
        >
          Coach gives advice, not therapy or legal counsel. If you&apos;re in crisis,{" "}
          <Link
            href="/dashboard/mind#crisis"
            className="underline"
            style={{ color: "#3A3A3A" }}
          >
            tap Mind → crisis support
          </Link>
          .
        </p>
      </div>

      <BottomNav />
    </main>
  );
}

// ─── History Panel ─────────────────────────────────────────────────────────────

function HistoryPanel({
  sessions,
  currentSessionId,
  onNew,
  onOpen,
  onClose,
}: {
  sessions: Session[];
  currentSessionId: string | null;
  onNew: () => void;
  onOpen: (s: Session) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid #1A1A1A" }}
      >
        <div>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Coach
          </p>
          <h2
            className="text-2xl font-bold uppercase leading-none"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Conversations
          </h2>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
          style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "6px" }}
          aria-label="Close history"
        >
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
            <path
              d="M6 6l8 8M14 6l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {/* New conversation */}
        <button
          onClick={onNew}
          className="flex items-center gap-3 px-5 py-4 text-left transition-all hover:opacity-80 active:scale-[0.99]"
          style={{ backgroundColor: "#C45B28", borderRadius: "10px", color: "#0A0A0A" }}
        >
          <svg viewBox="0 0 20 20" fill="none" width={18} height={18}>
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span
            className="text-sm font-bold uppercase tracking-widest"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            New Conversation
          </span>
        </button>

        {sessions.length === 0 && (
          <p
            className="text-sm text-center py-8"
            style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}
          >
            No past conversations yet.
          </p>
        )}

        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onOpen(session)}
            className="flex flex-col gap-1 px-5 py-4 text-left transition-all hover:opacity-80 active:scale-[0.99]"
            style={{
              backgroundColor:
                session.id === currentSessionId ? "#1E1209" : "#161616",
              border: `1px solid ${
                session.id === currentSessionId ? "#C45B28" : "#252525"
              }`,
              borderRadius: "10px",
            }}
          >
            <p
              className="text-sm font-semibold truncate w-full"
              style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
            >
              {session.title}
            </p>
            <p
              className="text-xs"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              {formatSessionDate(session.updatedAt)} ·{" "}
              {session.messages.length} messages
            </p>
          </button>
        ))}
      </div>

      {/* Space for BottomNav */}
      <div style={{ height: "64px" }} />
      <BottomNav />
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  const paragraphs = message.content
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}
    >
      {!isUser && (
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mb-0.5"
          style={{ backgroundColor: "#1A0A00", border: "1px solid #3A1A00" }}
        >
          <span
            className="text-[10px] font-bold"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            GW
          </span>
        </div>
      )}

      <div
        className="max-w-[78%] flex flex-col gap-2 px-4 py-3 text-sm leading-relaxed"
        style={{
          backgroundColor: isUser ? "#C45B28" : "#161616",
          color: isUser ? "#0A0A0A" : "#E8E2D8",
          borderRadius: isUser
            ? "12px 12px 3px 12px"
            : "12px 12px 12px 3px",
          border: isUser ? "none" : "1px solid #252525",
          fontFamily: "var(--font-inter)",
        }}
      >
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}
