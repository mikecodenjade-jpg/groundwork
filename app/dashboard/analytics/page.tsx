"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type PillarData = {
  name: string;
  href: string;
  score: number; // 0–1 normalized weekly engagement
  color: string;
  count: number;
  unit: string;
};

type MoodPoint = {
  dateStr: string;
  label: string;
  score: number; // 1–5
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MOOD_STR_MAP: Record<string, number> = {
  ok_locked: 5,
  locked_in: 5,
  good_solid: 4,
  solid: 4,
  mid_holding: 3,
  off: 3,
  alright: 3,
  low: 2,
  running_low: 2,
  burned_out: 2,
  high_stressed: 1,
  in_trouble: 1,
  struggling: 1,
};

const COACH_KEY = "gw_coach_sessions";

const PILLAR_RECS: Record<string, { message: string; href: string }> = {
  Train: { message: "You haven't trained this week. Start a session today.", href: "/dashboard/body" },
  Mind: { message: "Take 30 seconds for a mood check-in.", href: "/dashboard/mind" },
  Fuel: { message: "You haven't logged meals this week. Log one today.", href: "/dashboard/nutrition" },
  Heart: { message: "You haven't visited Heart this week. Write one reflection.", href: "/dashboard/heart" },
  Lead: { message: "Try a breathing exercise today to reset your system.", href: "/dashboard/lead" },
  Coach: { message: "Coach is ready when you are. Start a conversation.", href: "/dashboard/coach" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBack(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toLocaleDateString("en-CA");
  });
}

function shortLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

function inWeek(dates: string[], weekSet: Set<string>): number {
  return dates.filter((d) => weekSet.has(d)).length;
}

function norm(v: number, max: number): number {
  return Math.min(1, v / max);
}

function loadCoachThisWeek(weekSet: Set<string>): number {
  try {
    const raw = localStorage.getItem(COACH_KEY);
    if (!raw) return 0;
    const sessions = JSON.parse(raw);
    if (!Array.isArray(sessions)) return 0;
    return sessions.filter((s: { updatedAt: string }) =>
      weekSet.has(new Date(s.updatedAt).toLocaleDateString("en-CA"))
    ).length;
  } catch {
    return 0;
  }
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

function RadarChart({ pillars }: { pillars: PillarData[] }) {
  const cx = 150;
  const cy = 160;
  const maxR = 88;
  const labelR = maxR + 28;

  const angles = pillars.map((_, i) => (i * 360) / pillars.length - 90);

  function pt(r: number, deg: number): [number, number] {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function hexPoly(pct: number): string {
    return angles.map((a) => pt(maxR * pct, a).join(",")).join(" ");
  }

  const dataPts = pillars.map((p, i) => pt(Math.max(5, maxR * p.score), angles[i]));

  return (
    <svg viewBox="0 0 300 320" style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((pct, i) => (
        <polygon key={i} points={hexPoly(pct)} fill="none" stroke="#1a2332" strokeWidth={1} />
      ))}
      {/* Axis lines */}
      {angles.map((a, i) => {
        const [ox, oy] = pt(maxR, a);
        return <line key={i} x1={cx} y1={cy} x2={ox} y2={oy} stroke="#1a2332" strokeWidth={1} />;
      })}
      {/* Data area */}
      <polygon
        points={dataPts.map((p) => p.join(",")).join(" ")}
        fill="#f9731618"
        stroke="#f97316"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Pillar dots */}
      {dataPts.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={5} fill={pillars[i].color} />
      ))}
      {/* Labels */}
      {angles.map((a, i) => {
        const [lx, ly] = pt(labelR, a);
        const active = pillars[i].score > 0;
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fill={active ? pillars[i].color : "#374151"}
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {pillars[i].name}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Mood Line Chart ──────────────────────────────────────────────────────────

function MoodLineChart({ points }: { points: MoodPoint[] }) {
  const W = 300;
  const H = 110;
  const pad = { t: 12, r: 10, b: 24, l: 26 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  const n = points.length;

  if (n === 0) {
    return (
      <div
        style={{
          padding: "20px 0",
          textAlign: "center",
          color: "#374151",
          fontFamily: "var(--font-inter)",
          fontSize: 13,
        }}
      >
        No mood data yet. Start checking in daily.
      </div>
    );
  }

  const xp = (i: number) => pad.l + (n <= 1 ? cW / 2 : (i / (n - 1)) * cW);
  const yp = (s: number) => pad.t + cH - ((s - 1) / 4) * cH;

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xp(i).toFixed(1)} ${yp(p.score).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${xp(n - 1).toFixed(1)} ${H - pad.b} L ${xp(0).toFixed(1)} ${H - pad.b} Z`;

  const labelIdxs =
    n <= 5
      ? Array.from({ length: n }, (_, i) => i)
      : [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* Gridlines + Y labels */}
      {[1, 3, 5].map((v) => (
        <g key={v}>
          <line
            x1={pad.l}
            y1={yp(v)}
            x2={W - pad.r}
            y2={yp(v)}
            stroke="#1a2332"
            strokeWidth={1}
            strokeDasharray={v === 3 ? "4,4" : undefined}
          />
          <text x={pad.l - 4} y={yp(v)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#374151">
            {v}
          </text>
        </g>
      ))}
      {/* Area fill */}
      <path d={area} fill="#f9731612" />
      {/* Line */}
      <path
        d={line}
        fill="none"
        stroke="#f97316"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {points.map((p, i) => {
        const c = p.score >= 4 ? "#22c55e" : p.score >= 3 ? "#eab308" : "#ef4444";
        return <circle key={i} cx={xp(i)} cy={yp(p.score)} r={3} fill={c} />;
      })}
      {/* X labels */}
      {labelIdxs.map((i) => (
        <text key={i} x={xp(i)} y={H - 6} textAnchor="middle" fontSize={8} fill="#374151">
          {points[i].label}
        </text>
      ))}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [pillars, setPillars] = useState<PillarData[]>([]);
  const [moodTrend7, setMoodTrend7] = useState<MoodPoint[]>([]);
  const [moodTrend30, setMoodTrend30] = useState<MoodPoint[]>([]);
  const [moodRange, setMoodRange] = useState<7 | 30>(7);
  const [streakData, setStreakData] = useState({ current: 0, longest: 0, daysThisMonth: 0 });
  const [weeklySummary, setWeeklySummary] = useState({
    workouts: 0,
    meals: 0,
    journals: 0,
    coach: 0,
    mind: 0,
  });
  const [recs, setRecs] = useState<{ pillar: string; message: string; href: string }[]>([]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const week7 = daysBack(7);
      const week7Set = new Set(week7);
      const days30 = daysBack(30);
      const monthPrefix = new Date().toISOString().slice(0, 7);
      const coachCount = loadCoachThisWeek(week7Set);

      const [workoutRes, mealRes, checkinRes, journalRes, moodRes, streakRes] = await Promise.all([
        supabase
          .from("workout_logs")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", days30[0]),
        supabase
          .from("meal_logs")
          .select("date, logged_at")
          .eq("user_id", user.id)
          .gte("date", days30[0]),
        supabase
          .from("daily_checkins")
          .select("mood, created_at")
          .eq("user_id", user.id)
          .gte("created_at", days30[0]),
        supabase
          .from("journal_entries")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", days30[0]),
        supabase
          .from("mood_checkins")
          .select("mood, created_at")
          .eq("user_id", user.id)
          .gte("created_at", days30[0]),
        supabase
          .from("user_streaks")
          .select("current_streak, longest_streak")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const workouts = workoutRes.data ?? [];
      const meals = mealRes.data ?? [];
      const checkins = checkinRes.data ?? [];
      const journals = journalRes.data ?? [];
      const moodRows = moodRes.data ?? [];
      const streakRow = streakRes.data;

      // ── Date arrays ──────────────────────────────────────────────────────
      const workoutDates = workouts.map((w) => new Date(w.created_at).toLocaleDateString("en-CA"));
      const mealDates = meals.map((m) => {
        if (m.date) return m.date as string;
        return new Date((m.logged_at as string) ?? "").toLocaleDateString("en-CA");
      });
      const checkinDates = checkins.map((c) => new Date(c.created_at).toLocaleDateString("en-CA"));
      const journalDates = journals.map((j) => new Date(j.created_at).toLocaleDateString("en-CA"));
      const moodDates = moodRows.map((m) => new Date(m.created_at).toLocaleDateString("en-CA"));

      // ── Weekly counts ─────────────────────────────────────────────────────
      const wWorkouts = inWeek(workoutDates, week7Set);
      const wMeals = inWeek(mealDates, week7Set);
      const wJournals = inWeek(journalDates, week7Set);
      const wCheckins = inWeek(checkinDates, week7Set);
      const wMoods = inWeek(moodDates, week7Set);
      const wMind = Math.max(wCheckins, wMoods);

      setWeeklySummary({ workouts: wWorkouts, meals: wMeals, journals: wJournals, coach: coachCount, mind: wMind });

      // ── Pillar scores ─────────────────────────────────────────────────────
      setPillars([
        { name: "Train", href: "/dashboard/body", color: "#f97316", score: norm(wWorkouts, 5), count: wWorkouts, unit: "sessions" },
        { name: "Mind", href: "/dashboard/mind", color: "#a855f7", score: norm(wMind, 7), count: wMind, unit: "check-ins" },
        { name: "Fuel", href: "/dashboard/nutrition", color: "#22c55e", score: norm(wMeals, 14), count: wMeals, unit: "meals" },
        { name: "Heart", href: "/dashboard/heart", color: "#e05c7a", score: norm(wJournals, 3), count: wJournals, unit: "entries" },
        { name: "Lead", href: "/dashboard/lead", color: "#eab308", score: 0, count: 0, unit: "actions" },
        { name: "Coach", href: "/dashboard/coach", color: "#c45b28", score: norm(coachCount, 3), count: coachCount, unit: "sessions" },
      ]);

      // ── Mood trend builder ────────────────────────────────────────────────
      function buildMoodTrend(dates: string[]): MoodPoint[] {
        return dates.flatMap((ds) => {
          // Prefer numeric daily_checkins mood
          const dayCheckins = checkins.filter(
            (c) =>
              new Date(c.created_at).toLocaleDateString("en-CA") === ds &&
              typeof c.mood === "number"
          );
          if (dayCheckins.length > 0) {
            const avg =
              dayCheckins.reduce((s, c) => s + (c.mood as number), 0) / dayCheckins.length;
            return [{ dateStr: ds, label: shortLabel(ds), score: Math.round(avg * 10) / 10 }];
          }
          // Fall back to string mood_checkins
          const dayMoods = moodRows.filter(
            (m) => new Date(m.created_at).toLocaleDateString("en-CA") === ds
          );
          if (dayMoods.length > 0) {
            const scores = dayMoods.map((m) => MOOD_STR_MAP[m.mood as string] ?? 3);
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            return [{ dateStr: ds, label: shortLabel(ds), score: Math.round(avg * 10) / 10 }];
          }
          return [];
        });
      }

      setMoodTrend7(buildMoodTrend(week7));
      setMoodTrend30(buildMoodTrend(days30));

      // ── Streak data ───────────────────────────────────────────────────────
      const allDates = new Set([
        ...workoutDates,
        ...mealDates,
        ...checkinDates,
        ...journalDates,
        ...moodDates,
      ]);
      const daysThisMonth = Array.from(allDates).filter((d) => d.startsWith(monthPrefix)).length;

      setStreakData({
        current: streakRow?.current_streak ?? 0,
        longest: streakRow?.longest_streak ?? 0,
        daysThisMonth,
      });

      // ── Recommendations ───────────────────────────────────────────────────
      const recList: { pillar: string; message: string; href: string }[] = [];
      if (wWorkouts === 0) recList.push({ pillar: "Train", ...PILLAR_RECS.Train });
      if (wMind === 0) recList.push({ pillar: "Mind", ...PILLAR_RECS.Mind });
      if (wMeals === 0) recList.push({ pillar: "Fuel", ...PILLAR_RECS.Fuel });
      if (wJournals === 0) recList.push({ pillar: "Heart", ...PILLAR_RECS.Heart });
      if (coachCount === 0) recList.push({ pillar: "Coach", ...PILLAR_RECS.Coach });
      // Lead always surfaces since there's no dedicated tracking yet
      recList.push({ pillar: "Lead", ...PILLAR_RECS.Lead });

      setRecs(recList.slice(0, 3));
      setLoading(false);
    }

    load();
  }, []);

  // ── Weekly summary sentence ───────────────────────────────────────────────
  function weeklySentence(): string {
    const parts: string[] = [];
    if (weeklySummary.workouts > 0)
      parts.push(`trained ${weeklySummary.workouts} time${weeklySummary.workouts !== 1 ? "s" : ""}`);
    if (weeklySummary.meals > 0)
      parts.push(`logged ${weeklySummary.meals} meal${weeklySummary.meals !== 1 ? "s" : ""}`);
    if (weeklySummary.journals > 0)
      parts.push(`journaled ${weeklySummary.journals} time${weeklySummary.journals !== 1 ? "s" : ""}`);
    if (weeklySummary.coach > 0)
      parts.push(
        `chatted with Coach ${weeklySummary.coach} time${weeklySummary.coach !== 1 ? "s" : ""}`
      );
    if (parts.length === 0) return "No activity logged yet this week. Today's the day to start.";
    if (parts.length === 1) return `This week you ${parts[0]}.`;
    const last = parts.pop()!;
    return `This week you ${parts.join(", ")}, and ${last}.`;
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    backgroundColor: "#111111",
    border: "1px solid #1a2332",
    borderRadius: 16,
    padding: "20px",
    marginBottom: 16,
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: "var(--font-inter)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#C45B28",
    marginBottom: 14,
    margin: 0,
  };

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const moodPoints = moodRange === 7 ? moodTrend7 : moodTrend30;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#0a0f1a",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid #1a2332",
            borderTopColor: "#f97316",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "#4b5563", fontFamily: "var(--font-inter)", fontSize: 13, margin: 0 }}>
          Loading your progress...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#0a0f1a", minHeight: "100dvh", paddingBottom: 90 }}>

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header style={{ padding: "56px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/dashboard"
          aria-label="Back to Home"
          style={{
            color: "#4b5563",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 44,
            minHeight: 44,
            borderRadius: 10,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: 26,
              fontWeight: 700,
              color: "#f9fafb",
              margin: 0,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Your Progress
          </h1>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#4b5563", margin: 0, marginTop: 2 }}>
            All 6 pillars · This week
          </p>
        </div>
      </header>

      <div style={{ padding: "0 16px" }}>

        {/* ─── 1. Pillar Balance Radar ──────────────────────────────────────── */}
        <section style={card}>
          <p style={{ ...sectionLabel, marginBottom: 4 }}>Pillar Balance</p>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4b5563", margin: "0 0 12px" }}>
            How you&apos;re showing up across all pillars this week
          </p>

          <RadarChart pillars={pillars} />

          {/* Pillar count grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
            {pillars.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  padding: "10px 6px",
                  backgroundColor: "#0a0f1a",
                  border: `1px solid ${p.score > 0 ? p.color + "44" : "#1a2332"}`,
                  borderRadius: 10,
                  textDecoration: "none",
                  minHeight: 56,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-oswald)",
                    fontSize: 20,
                    fontWeight: 700,
                    color: p.score > 0 ? p.color : "#374151",
                    lineHeight: 1,
                  }}
                >
                  {p.count}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 9,
                    color: p.score > 0 ? "#9a9a9a" : "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── 2. Weekly Summary ───────────────────────────────────────────── */}
        <section style={card}>
          <p style={{ ...sectionLabel, marginBottom: 12 }}>This Week</p>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 15,
              color: "#d1d5db",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {weeklySentence()}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
            {[
              { label: "Workouts", val: weeklySummary.workouts, color: "#f97316" },
              { label: "Meals", val: weeklySummary.meals, color: "#22c55e" },
              { label: "Mind", val: weeklySummary.mind, color: "#a855f7" },
              { label: "Coach", val: weeklySummary.coach, color: "#c45b28" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  backgroundColor: "#0a0f1a",
                  border: "1px solid #1a2332",
                  borderRadius: 10,
                  padding: "14px 14px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-oswald)",
                    fontSize: 28,
                    fontWeight: 700,
                    color: s.val > 0 ? s.color : "#374151",
                    display: "block",
                    lineHeight: 1,
                  }}
                >
                  {s.val}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 10,
                    color: "#4b5563",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    display: "block",
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 3. Mood Trend ───────────────────────────────────────────────── */}
        <section style={card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <p style={{ ...sectionLabel, marginBottom: 0 }}>Mood Trend</p>
            <div style={{ display: "flex", gap: 6 }}>
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setMoodRange(d)}
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: moodRange === d ? "#f97316" : "#1a2332",
                    color: moodRange === d ? "#fff" : "#4b5563",
                    minHeight: 32,
                    minWidth: 44,
                    transition: "background-color 0.15s",
                  }}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <MoodLineChart points={moodPoints} />

          <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { label: "5 — Locked In", color: "#22c55e" },
              { label: "3 — Alright", color: "#eab308" },
              { label: "1 — Struggling", color: "#ef4444" },
            ].map((leg) => (
              <div key={leg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: leg.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#4b5563" }}
                >
                  {leg.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 4. Streak & Consistency ─────────────────────────────────────── */}
        <section style={card}>
          <p style={{ ...sectionLabel, marginBottom: 14 }}>Streak & Consistency</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              {
                label: "Current Streak",
                val: `${streakData.current}d`,
                color: streakData.current > 0 ? "#f97316" : "#374151",
              },
              { label: "Longest Streak", val: `${streakData.longest}d`, color: "#a855f7" },
              {
                label: "Days Active",
                val: `${streakData.daysThisMonth}/${daysInMonth}`,
                color: "#22c55e",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  backgroundColor: "#0a0f1a",
                  border: "1px solid #1a2332",
                  borderRadius: 12,
                  padding: "14px 8px",
                  textAlign: "center",
                  minHeight: 70,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-oswald)",
                    fontSize: 22,
                    fontWeight: 700,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {s.val}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 9,
                    color: "#4b5563",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    lineHeight: 1.3,
                    textAlign: "center",
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {streakData.current > 0 && (
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                color: "#f97316",
                margin: "14px 0 0",
                textAlign: "center",
              }}
            >
              {streakData.current >= 14
                ? `${streakData.current} days straight. That's the standard.`
                : streakData.current >= 7
                ? `One week strong. Keep it going.`
                : `${streakData.current} day streak. Don't stop now.`}
            </p>
          )}
        </section>

        {/* ─── 5. Pillar Recommendations ───────────────────────────────────── */}
        {recs.length > 0 && (
          <section style={card}>
            <p style={{ ...sectionLabel, marginBottom: 14 }}>For You Today</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recs.map((rec) => {
                const pillarColor =
                  pillars.find((p) => p.name === rec.pillar)?.color ?? "#f97316";
                return (
                  <Link
                    key={rec.pillar}
                    href={rec.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      backgroundColor: "#0a0f1a",
                      border: `1px solid ${pillarColor}33`,
                      borderRadius: 12,
                      textDecoration: "none",
                      minHeight: 60,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: pillarColor,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 11,
                          fontWeight: 700,
                          color: pillarColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          display: "block",
                          marginBottom: 3,
                        }}
                      >
                        {rec.pillar}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "#9a9a9a",
                          lineHeight: 1.4,
                        }}
                      >
                        {rec.message}
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      width={16}
                      height={16}
                      style={{ flexShrink: 0, color: "#374151" }}
                    >
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── 6. Progress Cards ───────────────────────────────────────────── */}
        <section style={card}>
          <p style={{ ...sectionLabel, marginBottom: 14 }}>Keep Going</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Groundwork Basics */}
            <Link
              href="/dashboard/challenges"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px",
                backgroundColor: "#0a0f1a",
                border: "1px solid #1a2332",
                borderRadius: 12,
                textDecoration: "none",
                minHeight: 64,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: "#f9731618",
                  border: "1px solid #f9731644",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                  <path
                    d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
                    stroke="#f97316"
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f9fafb",
                    display: "block",
                  }}
                >
                  Groundwork Basics
                </span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4b5563" }}>
                  Build your foundation across all pillars
                </span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" width={16} height={16} style={{ color: "#374151", flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {/* Active Challenges */}
            <Link
              href="/dashboard/challenges"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px",
                backgroundColor: "#0a0f1a",
                border: "1px solid #1a2332",
                borderRadius: 12,
                textDecoration: "none",
                minHeight: 64,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: "#eab30818",
                  border: "1px solid #eab30844",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="#eab308"
                    strokeWidth={1.8}
                    fill="none"
                  />
                  <path d="M8 12l3 3 5-5" stroke="#eab308" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f9fafb",
                    display: "block",
                  }}
                >
                  Active Challenges
                </span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4b5563" }}>
                  See your challenges and track progress
                </span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" width={16} height={16} style={{ color: "#374151", flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

          </div>
        </section>

      </div>

      <BottomNav />
    </div>
  );
}
