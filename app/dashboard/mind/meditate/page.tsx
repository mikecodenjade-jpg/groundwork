"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  duration_minutes: number;
  difficulty: string;
  instructor: string | null;
  thumbnail_url: string | null;
  content_url: string | null;
  tags: string[] | null;
}

interface MeditationSession {
  id: string;
  user_id: string;
  content_id: string | null;
  content_title: string;
  mood_before: number;
  mood_after: number | null;
  duration_seconds: number;
  completed_at: string;
}

type ViewPhase = "browse" | "mood_before" | "session" | "mood_after" | "complete";
type CategoryTab = "all" | "meditation" | "yoga" | "breathwork";

const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "meditation", label: "Meditation" },
  { key: "yoga", label: "Yoga" },
  { key: "breathwork", label: "Breathwork" },
];

const UNGUIDED_DURATIONS = [5, 10, 15, 20];

const CONTENT_TYPE_ICONS: Record<string, string> = {
  audio: "\uD83C\uDFA7",
  video: "\uD83D\uDCF9",
  article: "\uD83D\uDCD6",
  guided: "\uD83E\uDDD8",
};

const MOOD_LABELS: Record<number, string> = {
  1: "Stressed",
  2: "Tense",
  3: "Uneasy",
  4: "Restless",
  5: "Neutral",
  6: "Okay",
  7: "Calm",
  8: "Focused",
  9: "Peaceful",
  10: "Clear",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function calculateStreak(sessions: MeditationSession[]): number {
  if (sessions.length === 0) return 0;

  const uniqueDays = new Set(
    sessions.map((s) => {
      const d = new Date(s.completed_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const check = new Date(today);
    check.setDate(check.getDate() - i);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (uniqueDays.has(key)) {
      streak++;
    } else {
      if (i === 0) continue; // today hasn't happened yet — allow gap
      break;
    }
  }
  return streak;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MeditatePage() {
  // Phase state machine
  const [phase, setPhase] = useState<ViewPhase>("browse");

  // Browse state
  const [content, setContent] = useState<ContentItem[]>([]);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");

  // Selection state
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isUnguided, setIsUnguided] = useState(false);
  const [unguidedMinutes, setUnguidedMinutes] = useState(10);

  // Mood state
  const [moodBefore, setMoodBefore] = useState<number>(0);
  const [moodAfter, setMoodAfter] = useState<number>(0);

  // Timer state (unguided)
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session elapsed time
  const [sessionStart, setSessionStart] = useState<number>(0);

  // Streak
  const [streak, setStreak] = useState(0);

  // ─── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const contentQuery = supabase
        .from("content_library")
        .select("*")
        .in("category", ["meditation", "yoga", "breathwork"])
        .order("title");

      if (user) {
        const sessionsQuery = supabase
          .from("meditation_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(7);

        const [contentRes, sessionsRes] = await Promise.all([contentQuery, sessionsQuery]);
        setContent(contentRes.data ?? []);
        const sessionData = (sessionsRes.data ?? []) as MeditationSession[];
        setSessions(sessionData);
        setStreak(calculateStreak(sessionData));
      } else {
        const contentRes = await contentQuery;
        setContent(contentRes.data ?? []);
      }

      setLoading(false);
    }
    load();
  }, []);

  // ─── Timer logic ───────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pauseTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setTimerRunning(false);
  }

  function resetTimer() {
    pauseTimer();
    setTimerSeconds(unguidedMinutes * 60);
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleSelectContent(item: ContentItem) {
    setSelectedContent(item);
    setIsUnguided(false);
    setPhase("mood_before");
  }

  function handleSelectUnguided() {
    setSelectedContent(null);
    setIsUnguided(true);
    setPhase("mood_before");
  }

  function handleMoodBeforeSelect(val: number) {
    setMoodBefore(val);
    setSessionStart(Date.now());
    if (isUnguided) {
      setTimerSeconds(unguidedMinutes * 60);
    }
    setPhase("session");
  }

  function handleCompleteSession() {
    pauseTimer();
    setPhase("mood_after");
  }

  async function handleMoodAfterSelect(val: number) {
    setMoodAfter(val);

    const elapsed = Math.round((Date.now() - sessionStart) / 1000);
    const title = isUnguided
      ? `Unguided Timer (${unguidedMinutes} min)`
      : selectedContent?.title ?? "Session";

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("meditation_sessions").insert({
        user_id: user.id,
        content_id: selectedContent?.id ?? null,
        content_title: title,
        mood_before: moodBefore,
        mood_after: val,
        duration_seconds: elapsed,
        completed_at: new Date().toISOString(),
      });
    }

    setPhase("complete");
  }

  function handleDone() {
    setPhase("browse");
    setSelectedContent(null);
    setIsUnguided(false);
    setMoodBefore(0);
    setMoodAfter(0);
    setTimerSeconds(0);
    setSessionStart(0);
    // Refresh sessions
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("meditation_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(7);
        const sessionData = (data ?? []) as MeditationSession[];
        setSessions(sessionData);
        setStreak(calculateStreak(sessionData));
      }
    })();
  }

  // ─── Filtered content ──────────────────────────────────────────────────────

  const filteredContent =
    activeTab === "all" ? content : content.filter((c) => c.category === activeTab);

  // ─── Elapsed time in session ───────────────────────────────────────────────

  const sessionElapsed = sessionStart > 0 ? Math.round((Date.now() - sessionStart) / 1000) : 0;
  const canComplete = isUnguided ? timerSeconds === 0 || sessionElapsed >= 60 : true;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10 pb-28"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-12">
        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/mind"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back"
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
              Practice
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Meditate &amp; Breathe
            </h1>
          </div>
        </header>

        {/* ═══ BROWSE PHASE ═══ */}
        {phase === "browse" && (
          <>
            {loading ? (
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Loading...
              </p>
            ) : (
              <>
                {/* Unguided Timer Card */}
                <section
                  style={{
                    border: "1px solid #252525",
                    backgroundColor: "#161616",
                    borderRadius: "12px",
                  }}
                >
                  <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <p
                        className="text-xs font-semibold tracking-[0.25em] uppercase"
                        style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                      >
                        Unguided
                      </p>
                      <p
                        className="text-xl font-bold uppercase"
                        style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                      >
                        Timer Session
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                      >
                        Set your own duration. No guidance, just focus.
                      </p>
                    </div>
                    <button
                      onClick={handleSelectUnguided}
                      className="text-xs font-bold uppercase tracking-widest px-5 py-2 transition-opacity hover:opacity-80 active:scale-95 shrink-0"
                      style={{
                        fontFamily: "var(--font-inter)",
                        backgroundColor: "#C45B28",
                        color: "#E8E2D8",
                        borderRadius: "8px",
                        minHeight: "48px",
                      }}
                    >
                      Start Timer
                    </button>
                  </div>
                </section>

                {/* Category Tabs */}
                <div className="flex gap-2 flex-wrap">
                  {CATEGORY_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="text-xs font-bold uppercase tracking-widest px-4 py-2 transition-all duration-150"
                      style={{
                        fontFamily: "var(--font-inter)",
                        backgroundColor: activeTab === tab.key ? "#C45B28" : "#0A0A0A",
                        color: activeTab === tab.key ? "#E8E2D8" : "#9A9A9A",
                        border: `1px solid ${activeTab === tab.key ? "#C45B28" : "#252525"}`,
                        borderRadius: "8px",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content Grid */}
                {filteredContent.length === 0 ? (
                  <p
                    className="text-sm py-8 text-center"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    No content available for this category yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredContent.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectContent(item)}
                        className="text-left transition-all duration-150 hover:opacity-90 active:scale-[0.99]"
                        style={{
                          backgroundColor: "#161616",
                          border: "1px solid #252525",
                          borderRadius: "12px",
                        }}
                      >
                        <div className="px-6 py-5 flex flex-col gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                              style={{
                                color: "#C45B28",
                                border: "1px solid #C45B28",
                                borderRadius: "6px",
                                fontFamily: "var(--font-inter)",
                              }}
                            >
                              {item.category}
                            </span>
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                              style={{
                                color: "#9A9A9A",
                                border: "1px solid #252525",
                                borderRadius: "6px",
                                fontFamily: "var(--font-inter)",
                              }}
                            >
                              {item.difficulty}
                            </span>
                          </div>
                          <p
                            className="text-lg font-bold uppercase"
                            style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                          >
                            {item.title}
                          </p>
                          <div
                            className="flex items-center gap-3 text-xs"
                            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                          >
                            <span>
                              {CONTENT_TYPE_ICONS[item.content_type] ?? ""}{" "}
                              {item.content_type}
                            </span>
                            <span>{item.duration_minutes} min</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Session History */}
                <section
                  style={{
                    border: "1px solid #252525",
                    backgroundColor: "#161616",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="px-8 py-6"
                    style={{ borderBottom: "1px solid #252525" }}
                  >
                    <p
                      className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                      style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                    >
                      History
                    </p>
                    <div className="flex items-center justify-between">
                      <h2
                        className="text-2xl font-bold uppercase"
                        style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                      >
                        Recent Sessions
                      </h2>
                      {streak > 0 && (
                        <span
                          className="text-xs font-bold uppercase tracking-widest px-3 py-1"
                          style={{
                            color: "#C45B28",
                            border: "1px solid #C45B28",
                            borderRadius: "8px",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          {streak} day streak
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-8 py-6">
                    {sessions.length === 0 ? (
                      <p
                        className="text-sm"
                        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                      >
                        No sessions yet. Start your first one above.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {sessions.map((s) => {
                          const date = new Date(s.completed_at);
                          const dateStr = date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                          const mins = Math.round(s.duration_seconds / 60);
                          return (
                            <div
                              key={s.id}
                              className="flex items-center justify-between py-3 px-4"
                              style={{
                                backgroundColor: "#0A0A0A",
                                border: "1px solid #252525",
                                borderRadius: "8px",
                              }}
                            >
                              <div className="flex flex-col gap-1">
                                <p
                                  className="text-sm font-bold"
                                  style={{
                                    color: "#E8E2D8",
                                    fontFamily: "var(--font-inter)",
                                  }}
                                >
                                  {s.content_title}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{
                                    color: "#9A9A9A",
                                    fontFamily: "var(--font-inter)",
                                  }}
                                >
                                  {dateStr} &middot; {mins} min
                                </p>
                              </div>
                              <div
                                className="text-xs font-bold text-right"
                                style={{
                                  color: "#9A9A9A",
                                  fontFamily: "var(--font-inter)",
                                }}
                              >
                                {s.mood_before} &rarr;{" "}
                                <span style={{ color: s.mood_after !== null && s.mood_after > s.mood_before ? "#2A6A4A" : "#E8E2D8" }}>
                                  {s.mood_after ?? "—"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* ═══ MOOD BEFORE PHASE ═══ */}
        {phase === "mood_before" && (
          <section
            style={{
              border: "1px solid #252525",
              backgroundColor: "#161616",
              borderRadius: "12px",
            }}
          >
            <div
              className="px-8 py-6"
              style={{ borderBottom: "1px solid #252525" }}
            >
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Before You Begin
              </p>
              <h2
                className="text-2xl font-bold uppercase"
                style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
              >
                How&apos;s your mind right now?
              </h2>
            </div>
            <div className="px-8 py-6 flex flex-col gap-6">
              {isUnguided && (
                <div className="flex flex-col gap-2">
                  <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    Select Duration
                  </p>
                  <div className="flex gap-2">
                    {UNGUIDED_DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setUnguidedMinutes(d)}
                        className="flex-1 text-sm font-bold uppercase tracking-widest py-3 transition-all duration-150"
                        style={{
                          fontFamily: "var(--font-inter)",
                          backgroundColor: unguidedMinutes === d ? "#C45B28" : "#0A0A0A",
                          color: unguidedMinutes === d ? "#E8E2D8" : "#9A9A9A",
                          border: `1px solid ${unguidedMinutes === d ? "#C45B28" : "#252525"}`,
                          borderRadius: "8px",
                        }}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    Stressed
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    Clear
                  </span>
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                    <button
                      key={val}
                      onClick={() => handleMoodBeforeSelect(val)}
                      className="flex-1 aspect-square flex items-center justify-center text-sm font-bold transition-all duration-150 hover:opacity-80"
                      style={{
                        fontFamily: "var(--font-inter)",
                        backgroundColor: "#0A0A0A",
                        color: "#E8E2D8",
                        border: "1px solid #252525",
                        borderRadius: "50%",
                        minWidth: "36px",
                        minHeight: "36px",
                      }}
                      title={MOOD_LABELS[val]}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ SESSION PHASE ═══ */}
        {phase === "session" && (
          <>
            {isUnguided ? (
              /* Unguided Timer Session */
              <section
                style={{
                  border: "1px solid #252525",
                  backgroundColor: "#161616",
                  borderRadius: "12px",
                }}
              >
                <div
                  className="px-8 py-6"
                  style={{ borderBottom: "1px solid #252525" }}
                >
                  <p
                    className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                    style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                  >
                    Unguided
                  </p>
                  <h2
                    className="text-2xl font-bold uppercase"
                    style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                  >
                    Timer &mdash; {unguidedMinutes} min
                  </h2>
                </div>
                <div className="px-8 py-12 flex flex-col items-center gap-8">
                  <p
                    className="text-7xl font-bold tabular-nums"
                    style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                  >
                    {formatDuration(timerSeconds)}
                  </p>
                  <div className="flex gap-3">
                    {!timerRunning ? (
                      <button
                        onClick={startTimer}
                        className="text-xs font-bold uppercase tracking-widest px-6 py-3 transition-opacity hover:opacity-80 active:scale-95"
                        style={{
                          fontFamily: "var(--font-inter)",
                          backgroundColor: "#C45B28",
                          color: "#E8E2D8",
                          borderRadius: "8px",
                        }}
                      >
                        {timerSeconds === unguidedMinutes * 60 ? "Start" : "Resume"}
                      </button>
                    ) : (
                      <button
                        onClick={pauseTimer}
                        className="text-xs font-bold uppercase tracking-widest px-6 py-3 transition-opacity hover:opacity-80 active:scale-95"
                        style={{
                          fontFamily: "var(--font-inter)",
                          backgroundColor: "#0A0A0A",
                          color: "#E8E2D8",
                          border: "1px solid #252525",
                          borderRadius: "8px",
                        }}
                      >
                        Pause
                      </button>
                    )}
                    <button
                      onClick={resetTimer}
                      className="text-xs font-bold uppercase tracking-widest px-6 py-3 transition-opacity hover:opacity-80 active:scale-95"
                      style={{
                        fontFamily: "var(--font-inter)",
                        backgroundColor: "#0A0A0A",
                        color: "#9A9A9A",
                        border: "1px solid #252525",
                        borderRadius: "8px",
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  <button
                    onClick={handleCompleteSession}
                    disabled={!canComplete}
                    style={{
                      backgroundColor: canComplete ? "#C45B28" : "#252525",
                      color: canComplete ? "#E8E2D8" : "#9A9A9A",
                      borderRadius: "8px",
                      height: "56px",
                      fontFamily: "var(--font-inter)",
                      opacity: canComplete ? 1 : 0.5,
                    }}
                    className="w-full font-bold uppercase tracking-widest text-sm transition-all duration-150 active:scale-[0.99] hover:opacity-90"
                  >
                    Complete Session
                  </button>
                </div>
              </section>
            ) : (
              /* Guided Content Session */
              <section
                style={{
                  border: "1px solid #252525",
                  backgroundColor: "#161616",
                  borderRadius: "12px",
                }}
              >
                <div
                  className="px-8 py-6"
                  style={{ borderBottom: "1px solid #252525" }}
                >
                  <p
                    className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                    style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                  >
                    {selectedContent?.category}
                  </p>
                  <h2
                    className="text-2xl font-bold uppercase"
                    style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                  >
                    {selectedContent?.title}
                  </h2>
                </div>
                <div className="px-8 py-6 flex flex-col gap-6">
                  {selectedContent?.description && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {selectedContent.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                      style={{
                        color: "#C45B28",
                        border: "1px solid #C45B28",
                        borderRadius: "6px",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {selectedContent?.category}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {selectedContent?.duration_minutes} min &middot;{" "}
                      {selectedContent?.difficulty}
                    </span>
                  </div>

                  {/* Placeholder player */}
                  <div
                    className="flex items-center justify-center py-12"
                    style={{
                      backgroundColor: "#0A0A0A",
                      border: "1px solid #252525",
                      borderRadius: "8px",
                    }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">
                        {CONTENT_TYPE_ICONS[selectedContent?.content_type ?? "guided"]}
                      </span>
                      <p
                        className="text-sm font-bold uppercase tracking-widest"
                        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                      >
                        Content is playing...
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCompleteSession}
                    style={{
                      backgroundColor: "#C45B28",
                      color: "#E8E2D8",
                      borderRadius: "8px",
                      height: "56px",
                      fontFamily: "var(--font-inter)",
                    }}
                    className="w-full font-bold uppercase tracking-widest text-sm transition-all duration-150 active:scale-[0.99] hover:opacity-90"
                  >
                    Mark Complete
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {/* ═══ MOOD AFTER PHASE ═══ */}
        {phase === "mood_after" && (
          <section
            style={{
              border: "1px solid #252525",
              backgroundColor: "#161616",
              borderRadius: "12px",
            }}
          >
            <div
              className="px-8 py-6"
              style={{ borderBottom: "1px solid #252525" }}
            >
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Session Complete
              </p>
              <h2
                className="text-2xl font-bold uppercase"
                style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
              >
                How do you feel now?
              </h2>
            </div>
            <div className="px-8 py-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Stressed
                </span>
                <span
                  className="text-xs"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Clear
                </span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                  <button
                    key={val}
                    onClick={() => handleMoodAfterSelect(val)}
                    className="flex-1 aspect-square flex items-center justify-center text-sm font-bold transition-all duration-150 hover:opacity-80"
                    style={{
                      fontFamily: "var(--font-inter)",
                      backgroundColor: "#0A0A0A",
                      color: "#E8E2D8",
                      border: "1px solid #252525",
                      borderRadius: "50%",
                      minWidth: "36px",
                      minHeight: "36px",
                    }}
                    title={MOOD_LABELS[val]}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ COMPLETE PHASE ═══ */}
        {phase === "complete" && (
          <section
            style={{
              border: "1px solid #252525",
              backgroundColor: "#161616",
              borderRadius: "12px",
            }}
          >
            <div
              className="px-8 py-6"
              style={{ borderBottom: "1px solid #252525" }}
            >
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Complete
              </p>
              <h2
                className="text-2xl font-bold uppercase"
                style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
              >
                Session Logged
              </h2>
            </div>
            <div className="px-8 py-6 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <p
                  className="text-sm font-bold"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                >
                  {isUnguided
                    ? `Unguided Timer (${unguidedMinutes} min)`
                    : selectedContent?.title}
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-1">
                    <p
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      Before
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                    >
                      {moodBefore}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {MOOD_LABELS[moodBefore]}
                    </p>
                  </div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: "#9A9A9A" }}
                  >
                    &rarr;
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      After
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{
                        fontFamily: "var(--font-oswald)",
                        color: moodAfter > moodBefore ? "#2A6A4A" : "#E8E2D8",
                      }}
                    >
                      {moodAfter}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {MOOD_LABELS[moodAfter]}
                    </p>
                  </div>
                </div>
                {moodAfter > moodBefore && (
                  <p
                    className="text-sm font-bold"
                    style={{ color: "#2A6A4A", fontFamily: "var(--font-inter)" }}
                  >
                    +{moodAfter - moodBefore} improvement. Keep building.
                  </p>
                )}
              </div>
              <button
                onClick={handleDone}
                style={{
                  backgroundColor: "#C45B28",
                  color: "#E8E2D8",
                  borderRadius: "8px",
                  height: "56px",
                  fontFamily: "var(--font-inter)",
                }}
                className="w-full font-bold uppercase tracking-widest text-sm transition-all duration-150 active:scale-[0.99] hover:opacity-90"
              >
                Done
              </button>
            </div>
          </section>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
