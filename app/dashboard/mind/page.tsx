"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { queueAction, registerSync, cacheData, getCachedData } from "@/lib/offline-cache";

// ─── Constants ────────────────────────────────────────────────────────────────

const MOODS = [
  { label: "Locked In",  value: "locked_in",  color: "#2A6A4A" },
  { label: "Solid",      value: "solid",       color: "#3A5A3A" },
  { label: "Off",        value: "off",         color: "#5A5248" },
  { label: "Burned Out", value: "burned_out",  color: "#7A5228" },
  { label: "In Trouble", value: "in_trouble",  color: "#5A1A1A" },
];

const SOURCES = ["Work", "Family", "Money", "Health", "Sleep"];

const MOOD_MESSAGES: Record<string, string> = {
  locked_in:  "That's the standard. Lock it in and go.",
  solid:      "Good base. Push the edge today.",
  off:        "Noted. That's real — it matters. What's driving it?",
  burned_out: "Acknowledged. Rest isn't quitting. What's the source?",
  in_trouble: "Takes guts to say that. You're not alone — what's weighing on you?",
};

type Phase = "mood" | "source" | "done";

const TOOLS = [
  {
    title: "Stress Reset",
    duration: "5 min",
    desc: "A quick guided sequence to drop cortisol and reset your nervous system between tasks or after a hard conversation.",
    tag: "Breathing + Grounding",
  },
  {
    title: "Box Breathing",
    duration: "4 min",
    desc: "Inhale, hold, exhale, hold — four counts each. Used by special forces to stay sharp under pressure. Works on a jobsite too.",
    tag: "Breathwork",
  },
  {
    title: "Sleep Protocol",
    duration: "10 min",
    desc: "A wind-down routine built around the realities of late nights and early starts. Better sleep, better decisions.",
    tag: "Recovery",
  },
  {
    title: "Time Blocking",
    duration: "Daily",
    desc: "Structure your day before the day structures you. A simple system for leaders who are pulled in every direction.",
    tag: "Planning",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckinRow = {
  id: string;
  mood: string;
  source: string | null;
  created_at: string;
};

type SentimentRow = {
  entry_id: string;
  sentiment_score: number;
  dominant_emotion: string;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type ToolName = "Stress Reset" | "Box Breathing" | "Sleep Protocol" | "Time Blocking";

export default function MindPage() {
  const [phase, setPhase] = useState<Phase>("mood");
  const [selectedMood, setSelectedMood] = useState<(typeof MOODS)[number] | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolName | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckinRow[]>([]);
  const [sentimentMap, setSentimentMap] = useState<Record<string, SentimentRow>>({});
  const [checkinsLoaded, setCheckinsLoaded] = useState(false);

  // Load recent check-ins on mount
  useEffect(() => {
    async function loadRecent() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Offline: show cached check-ins immediately
      if (!navigator.onLine) {
        const cached = getCachedData<CheckinRow[]>("recent-mood-checkins");
        if (cached) setRecentCheckins(cached);
        setCheckinsLoaded(true);
        return;
      }

      const { data: checkins } = await supabase
        .from("mood_checkins")
        .select("id, mood, source, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (checkins && checkins.length > 0) {
        setRecentCheckins(checkins);
        cacheData("recent-mood-checkins", checkins);

        const checkinIds = checkins.map((c) => c.id);
        const { data: sentiments } = await supabase
          .from("sentiment_analysis_logs")
          .select("entry_id, sentiment_score, dominant_emotion")
          .in("entry_id", checkinIds);

        if (sentiments) {
          const map: Record<string, SentimentRow> = {};
          sentiments.forEach((s) => {
            map[s.entry_id] = s;
          });
          setSentimentMap(map);
        }
      }
      setCheckinsLoaded(true);
    }
    loadRecent();
  }, []);

  async function handleMoodSelect(mood: (typeof MOODS)[number]) {
    // Haptic feedback — short tap on mobile devices
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }

    setSelectedMood(mood);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPhase("source");
      return;
    }

    // Offline: queue the check-in for background sync
    if (!navigator.onLine) {
      await queueAction({
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/mood_checkins`,
        method: "POST",
        body: JSON.stringify({ user_id: user.id, mood: mood.label }),
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        tag: "sync-logs",
      });
      await registerSync("sync-logs");
      setPhase("source");
      return;
    }

    const { data } = await supabase
      .from("mood_checkins")
      .insert({ user_id: user.id, mood: mood.label })
      .select("id")
      .single();

    if (data?.id) {
      setSavedId(data.id);

      // Fire-and-forget sentiment analysis
      supabase.functions
        .invoke("analyze-sentiment", {
          body: {
            text: `Mood: ${mood.label}`,
            user_id: user.id,
            entry_type: "mood_checkin",
            entry_id: data.id,
          },
        })
        .catch(() => {});
    }
    setPhase("source");
  }

  async function handleSourceSelect(source: string) {
    if (savedId) {
      await supabase.from("mood_checkins").update({ source }).eq("id", savedId);
    }
    setPhase("done");

    // Fire-and-forget sentiment analysis
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && selectedMood) {
        supabase.functions
          .invoke("analyze-sentiment", {
            body: {
              text: `Mood: ${selectedMood.label}. Source of stress: ${source}`,
              user_id: user.id,
              entry_type: "mood_checkin",
              entry_id: savedId,
            },
          })
          .catch(() => {});
      }
    });
  }

  function reset() {
    setPhase("mood");
    setSelectedMood(null);
    setSavedId(null);
  }

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-12">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
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
              Pillar
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Mind
            </h1>
          </div>
        </header>

        {/* Daily Check-In */}
        <section
          style={{
            border: "1px solid #252525",
            backgroundColor: "#161616",
            borderRadius: "12px",
          }}
        >
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #252525" }}>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Daily Check-In
            </p>
            <h2
              className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              {phase === "mood"
                ? "How are you right now — really?"
                : phase === "source"
                ? "What's the source?"
                : "Checked in."}
            </h2>
            {phase === "mood" && (
              <p className="text-sm mt-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                One tap. Under 10 seconds.
              </p>
            )}
          </div>

          <div className="px-8 py-6 flex flex-col gap-4">

            {/* Phase: Mood selection */}
            {phase === "mood" && (
              <div className="flex flex-col gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodSelect(mood)}
                    className="w-full flex items-center justify-between px-6 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-[0.99] hover:opacity-90"
                    style={{
                      fontFamily: "var(--font-inter)",
                      backgroundColor: "#0A0A0A",
                      color: "#E8E2D8",
                      border: "1px solid #252525",
                      borderRadius: "8px",
                      height: "56px",
                    }}
                  >
                    {mood.label}
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: mood.color }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Phase: Source selection */}
            {phase === "source" && (
              <>
                {selectedMood && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-lg"
                    style={{ backgroundColor: "#0A0A0A", border: `1px solid ${selectedMood.color}` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: selectedMood.color }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {MOOD_MESSAGES[selectedMood.value]}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {SOURCES.map((source) => (
                    <button
                      key={source}
                      onClick={() => handleSourceSelect(source)}
                      className="flex-1 min-w-[80px] flex items-center justify-center px-4 text-sm font-bold uppercase tracking-widest transition-all active:scale-95 hover:opacity-90"
                      style={{
                        fontFamily: "var(--font-inter)",
                        backgroundColor: "#0A0A0A",
                        color: "#E8E2D8",
                        border: "1px solid #252525",
                        borderRadius: "8px",
                        height: "56px",
                      }}
                    >
                      {source}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPhase("done")}
                  className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 text-left"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Skip →
                </button>
              </>
            )}

            {/* Phase: Done */}
            {phase === "done" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: selectedMood?.color ?? "#C45B28" }}
                  >
                    <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
                      <path
                        d="M4 10l4 4 8-8"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                    >
                      {selectedMood?.label} — logged.
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {selectedMood ? MOOD_MESSAGES[selectedMood.value] : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={reset}
                  className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 text-left"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  + Check in again
                </button>
              </div>
            )}

          </div>
        </section>

        {/* Recent Check-Ins */}
        {checkinsLoaded && recentCheckins.length > 0 && (
          <section>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Recent Check-Ins
            </p>
            <div
              className="flex flex-col"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {recentCheckins.map((checkin, idx) => {
                const moodDef = MOODS.find(
                  (m) => m.label === checkin.mood
                );
                const sentiment = sentimentMap[checkin.id];
                const timeAgo = formatTimeAgo(checkin.created_at);

                return (
                  <div key={checkin.id}>
                    {idx > 0 && (
                      <div style={{ borderTop: "1px solid #252525" }} />
                    )}
                    <div className="flex items-center gap-3 px-6 py-4">
                      {/* Mood dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: moodDef?.color ?? "#9A9A9A",
                        }}
                      />
                      {/* Mood + source */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{
                            color: "#E8E2D8",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          {checkin.mood}
                          {checkin.source && (
                            <span
                              style={{ color: "#9A9A9A", fontWeight: 400 }}
                            >
                              {" "}
                              &middot; {checkin.source}
                            </span>
                          )}
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            color: "#9A9A9A",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          {timeAgo}
                        </p>
                      </div>
                      {/* Sentiment pill */}
                      {sentiment && (
                        <SentimentPill score={sentiment.sentiment_score} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <Link
                href="/dashboard/mind/trends"
                className="text-sm font-semibold transition-opacity hover:opacity-70"
                style={{
                  color: "#C45B28",
                  fontFamily: "var(--font-inter)",
                }}
              >
                View Mood Trends →
              </Link>
            </div>
          </section>
        )}

        {/* Tools */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Tools
          </p>
          <div className="flex flex-col gap-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.title} {...tool} onStart={() => setActiveTool(tool.title as ToolName)} />
            ))}
          </div>
        </section>

        {/* Professional Support */}
        <section className="pb-28">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Professional Support
          </p>
          <div
            className="px-8 py-7 flex flex-col gap-5"
            style={{
              backgroundColor: "#0D1B2A",
              border: "1px solid #1E3A5F",
              borderRadius: "12px",
            }}
          >
            <p
              className="text-lg font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              You don&apos;t have to carry it alone.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Construction has one of the highest suicide rates of any industry — more than
              four times the national average. The pressure is real. The weight is real. And
              reaching out is one of the strongest things a leader can do.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              If you or someone on your crew is struggling, the{" "}
              <strong style={{ color: "#E8E2D8" }}>988 Suicide &amp; Crisis Lifeline</strong>{" "}
              is free, confidential, and available 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:988"
                className="flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                  borderRadius: "8px",
                  minHeight: "48px",
                }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Call 988
              </a>
              <a
                href="sms:988"
                className="flex items-center justify-center px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  color: "#C45B28",
                  border: "1px solid #C45B28",
                  borderRadius: "8px",
                  minHeight: "48px",
                }}
              >
                Text 988
              </a>
            </div>
            <p
              className="text-xs"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Free · Confidential · Available 24/7
            </p>
          </div>
        </section>

      </div>
      <BottomNav />

      {/* Tool Overlays */}
      {activeTool === "Box Breathing" && <BoxBreathingOverlay onClose={() => setActiveTool(null)} />}
      {activeTool === "Stress Reset" && <StressResetOverlay onClose={() => setActiveTool(null)} />}
      {activeTool === "Sleep Protocol" && <SleepProtocolOverlay onClose={() => setActiveTool(null)} />}
      {activeTool === "Time Blocking" && <TimeBlockingOverlay onClose={() => setActiveTool(null)} />}
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Sentiment Pill ───────────────────────────────────────────────────────────

function SentimentPill({ score }: { score: number }) {
  let bg: string;
  let label: string;

  if (score > 0.2) {
    bg = "#2A6A4A";
    label = "+";
  } else if (score < -0.2) {
    bg = "#5A1A1A";
    label = "-";
  } else {
    bg = "#5A5248";
    label = "~";
  }

  return (
    <span
      className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0"
      style={{
        backgroundColor: bg,
        color: "#E8E2D8",
        fontFamily: "var(--font-inter)",
      }}
    >
      {label}
    </span>
  );
}

// ─── Tool Card ────────────────────────────────────────────────────────────────

function ToolCard({
  title,
  duration,
  desc,
  tag,
  onStart,
}: {
  title: string;
  duration: string;
  desc: string;
  tag: string;
  onStart: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="transition-all duration-150"
      style={{
        backgroundColor: "#161616",
        border: `1px solid ${hovered ? "#C45B28" : "#252525"}`,
        borderRadius: "12px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3
              className="text-xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              {title}
            </h3>
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
              style={{
                color: "#9A9A9A",
                border: "1px solid #252525",
                borderRadius: "8px",
                fontFamily: "var(--font-inter)",
              }}
            >
              {tag}
            </span>
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
          >
            {desc}
          </p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
          <span
            className="text-sm font-bold"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            {duration}
          </span>
          <button
            onClick={onStart}
            className="text-xs font-bold uppercase tracking-widest px-5 py-2 transition-opacity hover:opacity-80 active:scale-95"
            style={{
              fontFamily: "var(--font-inter)",
              fontWeight: 600,
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
              borderRadius: "8px",
              minHeight: "48px",
            }}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Overlay Shell ─────────────────────────────────────────────────────────────

function OverlayShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #252525" }}>
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>Mind Tool</p>
          <p className="text-lg font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{title}</p>
        </div>
        <button onClick={onClose}
          className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
          style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px" }} aria-label="Close">
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-10">
        {children}
      </div>
    </div>
  );
}

// ─── Box Breathing Overlay ─────────────────────────────────────────────────────

const BREATH_PHASES = [
  { label: "Breathe In...", duration: 4 },
  { label: "Hold...",       duration: 4 },
  { label: "Breathe Out...", duration: 4 },
  { label: "Hold...",       duration: 4 },
] as const;

const TOTAL_ROUNDS = 4;

function BoxBreathingOverlay({ onClose }: { onClose: () => void }) {
  const [started, setStarted]     = useState(false);
  const [done, setDone]           = useState(false);
  const [round, setRound]         = useState(1);
  const [phaseIdx, setPhaseIdx]   = useState(0);
  const [countdown, setCountdown] = useState(4);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => { return () => clearTimer(); }, [clearTimer]);

  function begin() {
    setStarted(true);
    setRound(1);
    setPhaseIdx(0);
    setCountdown(BREATH_PHASES[0].duration);
    runPhase(0, 1);
  }

  function runPhase(pIdx: number, r: number) {
    clearTimer();
    const dur = BREATH_PHASES[pIdx].duration;
    setPhaseIdx(pIdx);
    setCountdown(dur);
    let remaining = dur;

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearTimer();
        const nextPhase = pIdx + 1;
        if (nextPhase < BREATH_PHASES.length) {
          runPhase(nextPhase, r);
        } else {
          const nextRound = r + 1;
          if (nextRound > TOTAL_ROUNDS) {
            setDone(true);
          } else {
            setRound(nextRound);
            runPhase(0, nextRound);
          }
        }
      }
    }, 1000);
  }

  const isInhale = phaseIdx === 0;
  const isExhale = phaseIdx === 2;
  const scale = started && !done ? (isInhale ? 1.5 : isExhale ? 1 : (phaseIdx === 1 ? 1.5 : 1)) : 1;

  return (
    <OverlayShell title="Box Breathing" onClose={() => { clearTimer(); onClose(); }}>
      {!started ? (
        <div className="flex flex-col items-center gap-8 max-w-sm text-center">
          <p className="text-lg font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            4 seconds in. 4 hold. 4 out. 4 hold.
          </p>
          <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {TOTAL_ROUNDS} rounds. Focus on the circle and follow the prompts.
          </p>
          <button onClick={begin}
            className="px-10 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "10px", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
            Begin
          </button>
        </div>
      ) : done ? (
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1A2A1A", border: "2px solid #2A5A2A" }}>
            <svg viewBox="0 0 24 24" fill="none" width={36} height={36}>
              <path d="M5 13l4 4L19 7" stroke="#5A8A5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-2xl font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            Done — You&apos;re Reset
          </p>
          <button onClick={onClose}
            className="px-10 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "10px", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
            Close
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-10">
          {/* Round indicator */}
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Round {round} of {TOTAL_ROUNDS}
          </p>

          {/* Breathing circle */}
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 160, height: 160,
              backgroundColor: "#C45B28",
              transform: `scale(${scale})`,
              transition: `transform ${BREATH_PHASES[phaseIdx].duration}s ease-in-out`,
              opacity: 0.9,
            }}
          >
            <span className="text-4xl font-bold" style={{ color: "#0A0A0A", fontFamily: "var(--font-inter)" }}>
              {countdown}
            </span>
          </div>

          {/* Phase label */}
          <p className="text-2xl font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            {BREATH_PHASES[phaseIdx].label}
          </p>
        </div>
      )}
    </OverlayShell>
  );
}

// ─── Guided Steps Overlay (shared by Stress Reset + Sleep Protocol) ────────────

function GuidedStepsOverlay({
  title,
  steps,
  doneLabel,
  onClose,
  onComplete,
}: {
  title: string;
  steps: { heading: string; body: string }[];
  doneLabel: string;
  onClose: () => void;
  onComplete?: () => Promise<void>;
}) {
  const [step, setStep]     = useState(0);
  const [done, setDone]     = useState(false);
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    if (onComplete) await onComplete();
    setSaving(false);
    setDone(true);
  }

  const isLast = step === steps.length - 1;

  return (
    <OverlayShell title={title} onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1A2A1A", border: "2px solid #2A5A2A" }}>
            <svg viewBox="0 0 24 24" fill="none" width={36} height={36}>
              <path d="M5 13l4 4L19 7" stroke="#5A8A5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-2xl font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            {doneLabel}
          </p>
          <button onClick={onClose}
            className="px-10 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "10px", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
            Close
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 max-w-md text-center w-full">
          {/* Progress dots */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{ backgroundColor: i <= step ? "#C45B28" : "#252525" }} />
            ))}
          </div>

          {/* Step number */}
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Step {step + 1} of {steps.length}
          </p>

          {/* Step content */}
          <h3 className="text-2xl font-bold uppercase leading-snug" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            {steps[step].heading}
          </h3>
          <p className="text-base leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {steps[step].body}
          </p>

          {/* Navigation */}
          <div className="flex gap-4 w-full max-w-xs">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70 active:scale-95"
                style={{ color: "#9A9A9A", border: "1px solid #252525", borderRadius: "10px", fontFamily: "var(--font-inter)" }}>
                Back
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep((s) => s + 1)}
              disabled={saving}
              className="flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "10px", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
              {saving ? "Saving..." : isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      )}
    </OverlayShell>
  );
}

// ─── Stress Reset Overlay ──────────────────────────────────────────────────────

const STRESS_STEPS = [
  { heading: "5 Things You Can See", body: "Look around. Name five things you can see right now. The crane. The safety vest. The sky. Say them out loud or in your head." },
  { heading: "4 Things You Can Touch", body: "Feel four things. The hardhat. The steering wheel. Your jeans. The phone in your hand. Ground yourself in what's real." },
  { heading: "3 Things You Can Hear", body: "Listen. The engine idling. A radio. Wind. Three sounds that remind you: you're here, right now." },
  { heading: "2 Things You Can Smell", body: "Diesel. Fresh coffee. Sawdust. Whatever's around you — two things that pull you into the present." },
  { heading: "1 Thing You Can Taste", body: "Water. Gum. The last thing you ate. One taste to close the loop and bring you all the way back." },
];

function StressResetOverlay({ onClose }: { onClose: () => void }) {
  async function saveCompletion() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("mood_checkins").insert({ user_id: user.id, mood: "reset", source: "Stress Reset" });
    }
  }

  return (
    <GuidedStepsOverlay
      title="Stress Reset"
      steps={STRESS_STEPS}
      doneLabel="Done — I'm Reset"
      onClose={onClose}
      onComplete={saveCompletion}
    />
  );
}

// ─── Sleep Protocol Overlay ────────────────────────────────────────────────────

const SLEEP_STEPS = [
  { heading: "Set Your Alarm — Both Ways", body: "Pick a lights-out time and stick to it. Your body needs a pattern. If you're up at 4:30, you need to be out by 9:00." },
  { heading: "Blue Light Off", body: "Phone face-down. TV off. 30 minutes before bed, no screens. The light wrecks your melatonin and keeps your brain wired." },
  { heading: "Cool the Room", body: "65-68°F is the sweet spot. Your body drops its core temp to fall asleep — help it out. Fan, AC, window, whatever works." },
  { heading: "Brain Dump", body: "Grab your phone or a notepad. Write down tomorrow's top 3 tasks, anything on your mind, worries about the job. Get it out of your head and onto paper." },
  { heading: "3 Rounds of Box Breathing", body: "Breathe in for 4 counts. Hold for 4. Out for 4. Hold for 4. Three rounds. By the third, your nervous system will start shutting down for the night." },
];

function SleepProtocolOverlay({ onClose }: { onClose: () => void }) {
  return (
    <GuidedStepsOverlay
      title="Sleep Protocol"
      steps={SLEEP_STEPS}
      doneLabel="Protocol Saved — Good Night"
      onClose={onClose}
    />
  );
}

// ─── Time Blocking Overlay ─────────────────────────────────────────────────────

const TIME_BLOCKS = [
  { time: "4:30 AM",  label: "Wake Window",         mins: 30 },
  { time: "5:00 AM",  label: "Morning Routine",     mins: 30 },
  { time: "5:30 AM",  label: "Pre-Work Planning",   mins: 30 },
  { time: "6:00 AM",  label: "Site Walk / Safety",   mins: 60 },
  { time: "7:00 AM",  label: "Crew Coordination",   mins: 60 },
  { time: "8:00 AM",  label: "Deep Work Block",     mins: 120 },
  { time: "10:00 AM", label: "Check-ins / Calls",   mins: 60 },
  { time: "11:00 AM", label: "Lunch",               mins: 60 },
  { time: "12:00 PM", label: "Afternoon Block",     mins: 120 },
  { time: "2:00 PM",  label: "Meetings / Admin",    mins: 90 },
  { time: "3:30 PM",  label: "End of Day Review",   mins: 30 },
  { time: "4:00 PM",  label: "Family / Recovery",   mins: 240 },
  { time: "8:00 PM",  label: "Wind Down",           mins: 60 },
  { time: "9:00 PM",  label: "Lights Out",          mins: 0 },
];

function TimeBlockingOverlay({ onClose }: { onClose: () => void }) {
  const [claimed, setClaimed] = useState<Set<number>>(new Set());

  function toggle(idx: number) {
    setClaimed((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  const totalMins = Array.from(claimed).reduce((sum, idx) => sum + TIME_BLOCKS[idx].mins, 0);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  return (
    <OverlayShell title="Time Blocking" onClose={onClose}>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <p className="text-sm text-center mb-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          Tap each block to claim it. Build your day before the day builds itself.
        </p>

        <div className="flex flex-col gap-1.5">
          {TIME_BLOCKS.map((block, idx) => {
            const active = claimed.has(idx);
            return (
              <button
                key={idx}
                onClick={() => toggle(idx)}
                className="flex items-center gap-4 px-5 py-3.5 w-full text-left transition-all duration-150 active:scale-[0.98]"
                style={{
                  backgroundColor: active ? "#1A0E05" : "#161616",
                  border: `1px solid ${active ? "#C45B28" : "#252525"}`,
                  borderRadius: "10px",
                }}
              >
                <span className="text-xs font-bold w-20 shrink-0" style={{ color: active ? "#C45B28" : "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  {block.time}
                </span>
                <span className="text-sm font-semibold flex-1" style={{ color: active ? "#E8E2D8" : "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  {block.label}
                </span>
                {active && (
                  <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
                    <path d="M4 10l4 4 8-8" stroke="#C45B28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Total claimed */}
        <div className="flex items-center justify-between px-5 py-4 mt-2"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "10px" }}>
          <span className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Time Claimed
          </span>
          <span className="text-lg font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
            {hours > 0 ? `${hours}h ` : ""}{mins > 0 ? `${mins}m` : hours > 0 ? "" : "0m"}
          </span>
        </div>

        <button onClick={onClose}
          className="py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95 mt-2"
          style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "10px", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
          Done
        </button>
      </div>
    </OverlayShell>
  );
}
