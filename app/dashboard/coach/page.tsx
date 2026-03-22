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

type Profile = {
  full_name: string | null;
  role: string | null;
  company: string | null;
};

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

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "I'm exhausted and can't switch off after work.",
  "How do I handle a crew member who won't listen?",
  "What's a quick 15-min workout I can do on a job site?",
  "I'm burned out. What do I do?",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load user profile
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setProfileLoading(false); return; }
      const { data } = await supabase
        .from("user_profiles")
        .select("full_name, role, company")
        .eq("id", user.id)
        .single();
      setProfile(data as Profile | null);
      setProfileLoading(false);
    }
    load();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      // Resize textarea back to default
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      try {
        const apiMessages = [...messages, userMsg].map(({ role, content }) => ({
          role,
          content,
        }));

        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
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
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Network error. Check your connection and try again.",
          },
        ]);
      }

      setLoading(false);
    },
    [loading, messages, profile]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  const showWelcome = messages.length === 0 && !profileLoading;

  return (
    <main
      className="flex flex-col"
      style={{ height: "100svh", backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-5 px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid #1A1A1A", backgroundColor: "#0A0A0A" }}
      >
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
          style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "6px" }}
          aria-label="Back to dashboard"
        >
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
            <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
            Groundwork
          </p>
          <h1 className="text-3xl font-bold uppercase leading-none"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
            Coach
          </h1>
        </div>
        {profile && (
          <p className="ml-auto text-xs text-right hidden sm:block"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {profile.full_name && <span className="block font-semibold" style={{ color: "#E8E2D8" }}>{profile.full_name}</span>}
            {profile.role}
          </p>
        )}
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
              <p className="text-xs font-semibold tracking-[0.25em] uppercase"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                AI Coach
              </p>
              <p className="text-sm leading-relaxed"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Your AI coach. Built for construction. Ask anything about fitness,
                stress, nutrition, leadership, or life on the job.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}>
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
        className="shrink-0 px-4 py-3"
        style={{
          borderTop: "1px solid #1A1A1A",
          backgroundColor: "#0A0A0A",
          paddingBottom: "calc(64px + 12px)", // BottomNav height + padding
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
              <path d="M3 10L17 10M17 10L11 4M17 10L11 16"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] mt-2"
          style={{ color: "#2A2A2A", fontFamily: "var(--font-inter)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      <BottomNav />
    </main>
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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}>
      {/* Coach avatar */}
      {!isUser && (
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mb-0.5"
          style={{ backgroundColor: "#1A0A00", border: "1px solid #3A1A00" }}
        >
          <span className="text-[10px] font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
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
