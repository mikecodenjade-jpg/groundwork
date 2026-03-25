"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import MoodHistoryChart from "@/components/MoodHistoryChart";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrendsData = {
  sentiment_over_time: Array<{ date: string; score: number }>;
  emotion_frequency: Array<{ emotion: string; count: number }>;
  trajectory: "improving" | "declining" | "stable";
  workout_mood_correlation: number | null;
  average_score: number;
  total_entries: number;
};

type Period = "week" | "month" | "quarter";

type CheckinRow = {
  mood: string;
  created_at: string;
};

type DailyCheckinRow = {
  id: string;
  mood: number;
  sleep: number;
  energy: number;
  note: string | null;
  created_at: string;
};

const DAILY_MOOD_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "In the Mud",  color: "#ef4444" },
  2: { label: "Struggling",  color: "#f97316" },
  3: { label: "Getting By",  color: "#eab308" },
  4: { label: "Good to Go",  color: "#84cc16" },
  5: { label: "Rock Solid",  color: "#22c55e" },
};

const DAILY_SLEEP_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Didn't Sleep",     color: "#ef4444" },
  2: { label: "Rough Night",      color: "#f97316" },
  3: { label: "Got By",           color: "#eab308" },
  4: { label: "Decent Rest",      color: "#84cc16" },
  5: { label: "Slept Like a Log", color: "#22c55e" },
};

const DAILY_ENERGY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Running on Empty", color: "#ef4444" },
  2: { label: "Low Tank",         color: "#f97316" },
  3: { label: "Half Charge",      color: "#eab308" },
  4: { label: "Charged Up",       color: "#84cc16" },
  5: { label: "Full Battery",     color: "#22c55e" },
};

function dailyMetricDot(v: number): string {
  if (v >= 4) return "#22c55e";
  if (v === 3) return "#eab308";
  return "#ef4444";
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const dayMs = new Date(d).setHours(0, 0, 0, 0);
  const diff = Math.floor((todayMs - dayMs) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

// ─── Mood color map (for dots/heatmap) ────────────────────────────────────────
// green=locked in, yellow=solid, orange=holding, red-orange=low, red=stressed

const MOOD_COLORS: Record<string, string> = {
  "OK — Locked":     "#22C55E",
  "GOOD — Solid":    "#EAB308",
  "MID — Holding":   "#F97316",
  "LOW":             "#EA580C",
  "HIGH — Stressed": "#DC2626",
};

const MOOD_LABELS: Record<string, string> = {
  "OK — Locked":     "Locked In",
  "GOOD — Solid":    "Solid",
  "MID — Holding":   "Holding",
  "LOW":             "Low",
  "HIGH — Stressed": "Stressed",
};

function moodColor(mood: string | undefined): string {
  if (!mood) return "#252525";
  return MOOD_COLORS[mood] ?? "#252525";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MoodTrendsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Direct mood checkin data (no edge function needed)
  const [checkins30, setCheckins30] = useState<CheckinRow[]>([]);
  const [checkinsLoading, setCheckinsLoading] = useState(true);

  // New daily_checkins data (mood + sleep + energy)
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckinRow[]>([]);
  const [dailyLoading, setDailyLoading] = useState(true);

  useEffect(() => {
    async function loadDaily() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { setDailyLoading(false); return; }

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const { data } = await supabase
        .from("daily_checkins")
        .select("id, mood, sleep, energy, note, created_at")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(20);

      setDailyCheckins((data as DailyCheckinRow[]) ?? []);
      setDailyLoading(false);
    }
    loadDaily();
  }, []);

  function dailyAvg(field: "mood" | "sleep" | "energy"): string {
    if (dailyCheckins.length === 0) return "—";
    const sum = dailyCheckins.reduce((s, c) => s + c[field], 0);
    return (sum / dailyCheckins.length).toFixed(1);
  }

  // Load 30-day checkins directly from Supabase
  useEffect(() => {
    async function loadCheckins() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: rows } = await supabase
        .from("mood_checkins")
        .select("mood, created_at")
        .eq("user_id", user.id)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      setCheckins30((rows as CheckinRow[]) ?? []);
      setCheckinsLoading(false);
    }
    loadCheckins();
  }, []);

  // Load sentiment trends from edge function
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "mood-trends",
        { body: { period, user_id: user.id } }
      );

      if (fnError || !result) {
        setError(true);
        setLoading(false);
        return;
      }

      setData(result as TrendsData);
      setLoading(false);
    }
    load();
  }, [period, router]);

  // Build 7-day dots from checkins30
  const dots7 = buildDots(checkins30, 7);
  // Build 30-day heatmap cells
  const cells30 = buildCells(checkins30, 30);

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-28">
        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/mind"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{
              border: "1px solid #252525",
              color: "#9A9A9A",
              borderRadius: "8px",
            }}
            aria-label="Back to mind"
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
              Mind
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{
                fontFamily: "var(--font-oswald)",
                color: "#E8E2D8",
              }}
            >
              Mood Trends
            </h1>
          </div>
        </header>

        {/* ── Daily Check-In Averages (new) ───────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-3"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            7-Day Average · Daily Check-In
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Mood",   value: dailyLoading ? "–" : dailyAvg("mood"),   color: "#8B5CF6" },
              { label: "Sleep",  value: dailyLoading ? "–" : dailyAvg("sleep"),  color: "#3b82f6" },
              { label: "Energy", value: dailyLoading ? "–" : dailyAvg("energy"), color: "#f97316" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "14px 8px",
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: 10,
                }}
              >
                <span style={{ fontFamily: "var(--font-oswald)", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
                  {value}
                </span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 9, fontWeight: 600, color: "#9A9A9A", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                  {label}
                </span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 9, color: "#3A3A3A" }}>/ 5</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mood / Sleep / Energy Chart (new) ──────────────────────────── */}
        <section>
          <MoodHistoryChart />
        </section>

        {/* ── Recent Daily Check-Ins (new) ────────────────────────────────── */}
        {!dailyLoading && dailyCheckins.length > 0 && (
          <section>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-3"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Recent Check-Ins
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dailyCheckins.slice(0, 5).map((c) => {
                const mInfo = DAILY_MOOD_LABELS[Math.round(c.mood)];
                const sInfo = DAILY_SLEEP_LABELS[Math.round(c.sleep)];
                const eInfo = DAILY_ENERGY_LABELS[Math.round(c.energy)];
                return (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: "#161616",
                      border: "1px solid #252525",
                      borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9A9A9A", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                        {relativeDate(c.created_at)}
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[{ l: "M", v: c.mood }, { l: "S", v: c.sleep }, { l: "E", v: c.energy }].map(({ l, v }) => (
                          <div key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: dailyMetricDot(v) }} />
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9A9A9A" }}>
                              {l}: <span style={{ color: dailyMetricDot(v), fontWeight: 600 }}>{v}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
                      {[
                        { info: mInfo, v: c.mood },
                        { info: sInfo, v: c.sleep },
                        { info: eInfo, v: c.energy },
                      ].map(({ info, v }, i) => (
                        <span
                          key={i}
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 10,
                            fontWeight: 600,
                            color: info?.color ?? "#9A9A9A",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: `1px solid ${info?.color ?? "#252525"}33`,
                            backgroundColor: `${info?.color ?? "#252525"}11`,
                          }}
                        >
                          {info?.label ?? v}
                        </span>
                      ))}
                    </div>
                    {c.note && (
                      <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9A9A9A", fontStyle: "italic", margin: 0 }}>
                        &ldquo;{c.note}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 7-Day Mood Dots ─────────────────────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Last 7 Days
          </p>
          {checkinsLoading ? (
            <div
              className="h-20 animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
          ) : (
            <div
              className="px-6 py-5 flex flex-col gap-3"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                {dots7.map((dot, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        backgroundColor: dot.color,
                        opacity: dot.mood ? 1 : 0.18,
                        border: dot.mood
                          ? `2px solid ${dot.color}`
                          : "2px solid #252525",
                      }}
                      title={dot.mood ? MOOD_LABELS[dot.mood] ?? dot.mood : "No check-in"}
                    />
                    <span
                      className="text-[10px] text-center"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {dot.dayLabel}
                    </span>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 pt-1" style={{ borderTop: "1px solid #252525" }}>
                {Object.entries(MOOD_COLORS).map(([mood, color]) => (
                  <div key={mood} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="text-[10px]"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {MOOD_LABELS[mood]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── 30-Day Heatmap ──────────────────────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Last 30 Days
          </p>
          {checkinsLoading ? (
            <div
              className="h-32 animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
          ) : (
            <div
              className="px-6 py-5"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
              }}
            >
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: "repeat(10, 1fr)",
                }}
              >
                {cells30.map((cell, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded"
                    style={{
                      backgroundColor: cell.color,
                      opacity: cell.mood ? 1 : 0.15,
                    }}
                    title={
                      cell.mood
                        ? `${cell.dateLabel}: ${MOOD_LABELS[cell.mood] ?? cell.mood}`
                        : `${cell.dateLabel}: No check-in`
                    }
                  />
                ))}
              </div>
              <p
                className="text-[10px] mt-3 text-right"
                style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}
              >
                Oldest → Most recent
              </p>
            </div>
          )}
        </section>

        {/* ── Period Selector (for sentiment data) ────────────────────────── */}
        <div className="flex gap-2">
          {(["week", "month", "quarter"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-150"
              style={{
                fontFamily: "var(--font-inter)",
                borderRadius: "8px",
                ...(period === p
                  ? { backgroundColor: "#C45B28", color: "#0A0A0A" }
                  : {
                      border: "1px solid #252525",
                      color: "#9A9A9A",
                      backgroundColor: "transparent",
                    }),
              }}
            >
              {p === "week" ? "Week" : p === "month" ? "Month" : "Quarter"}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && !loading && (
          <div
            className="px-6 py-5 text-sm"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            Unable to load mood trends. Try again later.
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col gap-6">
            <div
              className="h-24 animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
            <div
              className="h-52 animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
            <div
              className="h-40 animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
          </div>
        )}

        {/* Data Sections */}
        {!loading && !error && data && (
          <>
            {/* Trajectory Card */}
            <TrajectoryCard
              trajectory={data.trajectory}
              averageScore={data.average_score}
              totalEntries={data.total_entries}
            />

            {/* Sentiment Over Time */}
            <section>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                style={{
                  color: "#C45B28",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Sentiment Over Time
              </p>
              {data.sentiment_over_time.length === 0 ? (
                <div
                  className="px-6 py-10 text-center flex flex-col items-center gap-4"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "12px",
                    color: "#9A9A9A",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <p className="text-sm">Your first check-in starts here. Takes 10 seconds.</p>
                  <Link
                    href="/dashboard/mind"
                    className="px-6 py-2.5 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "8px" }}
                  >
                    Check In Now &rarr;
                  </Link>
                </div>
              ) : (
                <SentimentChart points={data.sentiment_over_time} />
              )}
            </section>

            {/* Emotion Frequency */}
            {data.emotion_frequency.length > 0 && (
              <section>
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                  style={{
                    color: "#C45B28",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  What&apos;s Showing Up
                </p>
                <EmotionBars emotions={data.emotion_frequency.slice(0, 8)} />
              </section>
            )}

            {/* Workout-Mood Correlation */}
            {data.workout_mood_correlation !== null && (
              <CorrelationCard value={data.workout_mood_correlation} />
            )}
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns an array of N day entries (oldest → newest) with mood and color. */
function buildDots(
  checkins: CheckinRow[],
  days: number
): Array<{ mood: string | null; color: string; dayLabel: string }> {
  const result: Array<{ mood: string | null; color: string; dayLabel: string }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD

    // Find the last check-in for that day
    const dayCheckins = checkins.filter(
      (c) => c.created_at.slice(0, 10) === dateStr
    );
    const last = dayCheckins[dayCheckins.length - 1];

    const label =
      i === 0
        ? "Today"
        : i === 1
        ? "Yest"
        : d.toLocaleDateString("en-US", { weekday: "short" });

    result.push({
      mood: last?.mood ?? null,
      color: moodColor(last?.mood),
      dayLabel: label,
    });
  }

  return result;
}

/** Returns an array of N day cells (oldest → newest) for the heatmap. */
function buildCells(
  checkins: CheckinRow[],
  days: number
): Array<{ mood: string | null; color: string; dateLabel: string }> {
  const result: Array<{ mood: string | null; color: string; dateLabel: string }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const dayCheckins = checkins.filter(
      (c) => c.created_at.slice(0, 10) === dateStr
    );
    const last = dayCheckins[dayCheckins.length - 1];

    const dateLabel = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    result.push({
      mood: last?.mood ?? null,
      color: moodColor(last?.mood),
      dateLabel,
    });
  }

  return result;
}

// ─── Trajectory Card ──────────────────────────────────────────────────────────

function TrajectoryCard({
  trajectory,
  averageScore,
  totalEntries,
}: {
  trajectory: "improving" | "declining" | "stable";
  averageScore: number;
  totalEntries: number;
}) {
  const config = {
    improving: { label: "Improving", color: "#2A6A4A", bg: "#0F1F15" },
    stable: { label: "Stable", color: "#9A9A9A", bg: "#161616" },
    declining: { label: "Declining", color: "#5A1A1A", bg: "#1A0F0F" },
  }[trajectory];

  return (
    <div
      className="px-7 py-6 flex flex-col gap-4"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.color}`,
        borderRadius: "12px",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: config.color }}
        >
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
            {trajectory === "improving" ? (
              <path
                d="M10 15V5M10 5L5 10M10 5L15 10"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : trajectory === "declining" ? (
              <path
                d="M10 5V15M10 15L5 10M10 15L15 10"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M4 10H16"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
        <div>
          <p
            className="text-xl font-bold uppercase"
            style={{
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
            }}
          >
            {config.label}
          </p>
          <p
            className="text-xs"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            Overall trajectory
          </p>
        </div>
      </div>
      <div
        className="flex gap-6 pt-3"
        style={{ borderTop: "1px solid #252525" }}
      >
        <div>
          <p
            className="text-2xl font-bold"
            style={{
              color: "#C45B28",
              fontFamily: "var(--font-oswald)",
            }}
          >
            {averageScore.toFixed(2)}
          </p>
          <p
            className="text-xs uppercase tracking-widest"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            Avg Score
          </p>
        </div>
        <div>
          <p
            className="text-2xl font-bold"
            style={{
              color: "#C45B28",
              fontFamily: "var(--font-oswald)",
            }}
          >
            {totalEntries}
          </p>
          <p
            className="text-xs uppercase tracking-widest"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            Entries
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SVG Sentiment Chart ──────────────────────────────────────────────────────

function SentimentChart({
  points,
}: {
  points: Array<{ date: string; score: number }>;
}) {
  const W = 600;
  const H = 200;
  const PAD_X = 40;
  const PAD_TOP = 16;
  const PAD_BOT = 32;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_TOP - PAD_BOT;

  function toX(i: number): number {
    if (points.length === 1) return PAD_X + chartW / 2;
    return PAD_X + (i / (points.length - 1)) * chartW;
  }

  function toY(score: number): number {
    const normalized = (score + 1) / 2;
    return PAD_TOP + chartH - normalized * chartH;
  }

  const linePoints = points
    .map((p, i) => `${toX(i)},${toY(p.score)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `M${toX(0)},${toY(points[0].score)} ` +
        points
          .slice(1)
          .map((p, i) => `L${toX(i + 1)},${toY(p.score)}`)
          .join(" ") +
        ` L${toX(points.length - 1)},${PAD_TOP + chartH} L${toX(0)},${PAD_TOP + chartH} Z`
      : "";

  const gridScores = [-1, -0.5, 0, 0.5, 1];

  const labelIndices: number[] = [];
  if (points.length <= 5) {
    points.forEach((_, i) => labelIndices.push(i));
  } else {
    labelIndices.push(0);
    labelIndices.push(Math.floor(points.length / 2));
    labelIndices.push(points.length - 1);
  }

  function formatDate(d: string): string {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: "12px",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "200px" }}
        preserveAspectRatio="none"
      >
        {gridScores.map((s) => (
          <g key={s}>
            <line
              x1={PAD_X}
              y1={toY(s)}
              x2={W - PAD_X}
              y2={toY(s)}
              stroke="#252525"
              strokeWidth="1"
            />
            <text
              x={PAD_X - 6}
              y={toY(s) + 3}
              textAnchor="end"
              fill="#3A3A3A"
              fontSize="10"
              fontFamily="var(--font-inter)"
            >
              {s}
            </text>
          </g>
        ))}

        {points.length > 1 && (
          <path d={areaPath} fill="rgba(196,91,40,0.15)" />
        )}

        {points.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="#C45B28"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(p.score)}
            r="4"
            fill="#C45B28"
            stroke="#161616"
            strokeWidth="2"
          />
        ))}

        {labelIndices.map((idx) => (
          <text
            key={idx}
            x={toX(idx)}
            y={H - 6}
            textAnchor="middle"
            fill="#9A9A9A"
            fontSize="10"
            fontFamily="var(--font-inter)"
          >
            {formatDate(points[idx].date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Emotion Frequency Bars ───────────────────────────────────────────────────

function EmotionBars({
  emotions,
}: {
  emotions: Array<{ emotion: string; count: number }>;
}) {
  const maxCount = Math.max(...emotions.map((e) => e.count), 1);

  return (
    <div
      className="px-7 py-6 flex flex-col gap-3"
      style={{
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: "12px",
      }}
    >
      {emotions.map((e) => (
        <div key={e.emotion} className="flex items-center gap-3">
          <span
            className="text-xs font-semibold w-24 shrink-0 capitalize"
            style={{
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
            }}
          >
            {e.emotion}
          </span>
          <div
            className="flex-1 h-5 relative"
            style={{ backgroundColor: "#0A0A0A", borderRadius: "4px" }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(e.count / maxCount) * 100}%`,
                backgroundColor: "#C45B28",
                borderRadius: "4px",
                minWidth: e.count > 0 ? "4px" : "0px",
              }}
            />
          </div>
          <span
            className="text-xs font-bold w-8 text-right shrink-0"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            {e.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Correlation Card ─────────────────────────────────────────────────────────

function CorrelationCard({ value }: { value: number }) {
  let label: string;
  let indicatorColor: string;

  if (value >= 0.5) {
    label = "Strong positive link between training and mood";
    indicatorColor = "#2A6A4A";
  } else if (value >= 0.2) {
    label = "Moderate connection between training and mood";
    indicatorColor = "#C45B28";
  } else if (value >= -0.2) {
    label = "No clear link yet";
    indicatorColor = "#9A9A9A";
  } else if (value >= -0.5) {
    label = "Moderate inverse connection";
    indicatorColor = "#7A5228";
  } else {
    label = "Strong inverse link between training and mood";
    indicatorColor = "#5A1A1A";
  }

  const barWidth = Math.abs(value) * 100;
  const isPositive = value >= 0;

  return (
    <section>
      <p
        className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
        style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
      >
        Workout-Mood Correlation
      </p>
      <div
        className="px-7 py-6 flex flex-col gap-4"
        style={{
          backgroundColor: "#161616",
          border: "1px solid #252525",
          borderRadius: "12px",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: indicatorColor }}
          />
          <p
            className="text-sm font-semibold"
            style={{
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
            }}
          >
            {label}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-xs w-6 text-right shrink-0"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            -1
          </span>
          <div
            className="flex-1 h-4 relative"
            style={{
              backgroundColor: "#0A0A0A",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ left: "50%", backgroundColor: "#3A3A3A" }}
            />
            <div
              className="absolute top-0 bottom-0 transition-all duration-500"
              style={{
                backgroundColor: indicatorColor,
                borderRadius: "4px",
                ...(isPositive
                  ? { left: "50%", width: `${barWidth / 2}%` }
                  : {
                      right: "50%",
                      width: `${barWidth / 2}%`,
                    }),
              }}
            />
          </div>
          <span
            className="text-xs w-6 shrink-0"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            +1
          </span>
        </div>

        <p
          className="text-xs text-center"
          style={{
            color: "#9A9A9A",
            fontFamily: "var(--font-inter)",
          }}
        >
          Correlation: {value.toFixed(2)}
        </p>
      </div>
    </section>
  );
}
