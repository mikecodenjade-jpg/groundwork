"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string | null;
  interests: string[] | null;
};

type DailyScore = {
  workout: boolean;
  checkin: boolean;
  journal: boolean;
  meal: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const INTEREST_TO_SLUG: Record<string, string> = {
  Running: "running",
  Weightlifting: "weightlifting",
  Bodybuilding: "bodybuilding",
  "Hybrid / Functional": "hybrid-functional",
  Calisthenics: "calisthenics",
  "Mobility & Recovery": "mobility-recovery",
  Rucking: "rucking",
  Bodyweight: "bodyweight",
};

const SLUG_LABELS: Record<string, string> = {
  running: "Running",
  weightlifting: "Weightlifting",
  bodybuilding: "Bodybuilding",
  "hybrid-functional": "Hybrid / Functional",
  calisthenics: "Calisthenics",
  "mobility-recovery": "Mobility & Recovery",
  rucking: "Rucking",
  bodyweight: "Bodyweight",
};

const ALL_SLUGS = Object.values(INTEREST_TO_SLUG);

const RESETS = [
  { title: "Box Breathing", duration: "2 min" },
  { title: "Stress Reset", duration: "2 min" },
  { title: "4-7-8 Breathing", duration: "2 min" },
  { title: "Grounding Sequence", duration: "2 min" },
];

const LEADERSHIP_ACTIONS = [
  "Give one person specific, real feedback today.",
  "Have a 5-min conversation with someone you've been avoiding.",
  "Document one process that only lives in your head.",
  "Ask your crew: what's slowing you down?",
  "Leave the site on time. Model what you preach.",
  "Acknowledge one win your crew had this week.",
  "Make one decision you've been putting off.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = Array.from(
    new Set(dates.map((d) => new Date(d).toLocaleDateString("en-CA")))
  ).sort((a, b) => (a > b ? -1 : 1));

  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const diff = Math.round(
      (new Date(unique[i - 1]).getTime() - new Date(unique[i]).getTime()) / 86400000
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function calcScore(s: DailyScore): number {
  return (
    (s.workout ? 40 : 0) +
    (s.checkin ? 20 : 0) +
    (s.journal ? 20 : 0) +
    (s.meal ? 20 : 0)
  );
}

function calcWeeklyDays(allDates: string[]): { done: number; total: number } {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString("en-CA");
  });
  const activeDays = new Set(
    allDates
      .map((d) => new Date(d).toLocaleDateString("en-CA"))
      .filter((d) => weekDays.includes(d))
  );
  return { done: activeDays.size, total: 7 };
}

function suggestWorkout(interests: string[] | null): { slug: string; name: string } {
  const slugs =
    interests && interests.length > 0
      ? interests.map((i) => INTEREST_TO_SLUG[i]).filter(Boolean)
      : ALL_SLUGS;
  const pool = slugs.length > 0 ? slugs : ALL_SLUGS;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const slug = pool[dayOfYear % pool.length];
  return { slug, name: `${SLUG_LABELS[slug]} Workout` };
}

function todayReset(): { title: string; duration: string } {
  return RESETS[new Date().getDay() % RESETS.length];
}

function todayLeadershipAction(): string {
  const day = Math.floor(Date.now() / 86400000);
  return LEADERSHIP_ACTIONS[day % LEADERSHIP_ACTIONS.length];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState<DailyScore>({
    workout: false,
    checkin: false,
    journal: false,
    meal: false,
  });
  const [weekly, setWeekly] = useState({ done: 0, total: 7 });
  const [workout, setWorkout] = useState<{ slug: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const reset = todayReset();
  const leadAction = todayLeadershipAction();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const [profileRes, workoutsRes, moodsRes, journalsRes, mealsRes] = await Promise.all([
        supabase.from("user_profiles").select("full_name, interests").eq("id", user.id).single(),
        supabase.from("workout_logs").select("created_at").eq("user_id", user.id),
        supabase.from("mood_checkins").select("created_at").eq("user_id", user.id),
        supabase
          .from("journal_entries")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", todayISO),
        supabase
          .from("meal_logs")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", todayISO),
      ]);

      const p = profileRes.data as Profile | null;
      if (p) setProfile(p);
      setWorkout(suggestWorkout(p?.interests ?? null));

      const workoutDates = (workoutsRes.data ?? []).map((r) => r.created_at);
      const moodDates = (moodsRes.data ?? []).map((r) => r.created_at);

      setStreak(calcStreak([...workoutDates, ...moodDates]));
      setWeekly(calcWeeklyDays([...workoutDates, ...moodDates]));

      setScore({
        workout: workoutDates.some((d) => d >= todayISO),
        checkin: moodDates.some((d) => d >= todayISO),
        journal: (journalsRes.data ?? []).length > 0,
        meal: (mealsRes.data ?? []).length > 0,
      });

      setLoading(false);
    }
    load();
  }, []);

  const dailyScore = calcScore(score);

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between max-w-2xl w-full mx-auto mb-10">
        <p
          className="text-xs font-semibold tracking-[0.3em] uppercase"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
        >
          Groundwork
        </p>
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
          style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px" }}
          aria-label="Settings"
        >
          <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </header>

      <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-28">

        {/* Greeting + Streak */}
        <section className="flex flex-col gap-1">
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
          >
            {todayLabel()}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold uppercase leading-tight"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            {greeting()}
            {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2"
              style={{ backgroundColor: "#0D1B2A", border: "1px solid #1E3A5F", borderRadius: "8px" }}
            >
              <span
                className="text-2xl font-bold leading-none"
                style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
              >
                {loading ? "–" : streak}
              </span>
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-inter)", color: "#9A9A9A" }}
              >
                Day Streak
              </span>
            </div>
            <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {loading
                ? ""
                : streak === 0
                ? "Start something today."
                : streak === 1
                ? "Day one. Keep going."
                : `${streak} days straight.`}
            </p>
          </div>
        </section>

        {/* Today's Plan — single card, 3 rows */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Today&apos;s Plan
          </p>
          <div
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <PlanRow
              step="Train"
              accent="#C45B28"
              title={loading ? "Loading…" : (workout?.name ?? "Bodyweight Workout")}
              meta="10 min"
              loading={loading}
            />
            <div style={{ borderTop: "1px solid #252525" }} />
            <PlanRow
              step="Reset"
              accent="#7A5228"
              title={reset.title}
              meta={reset.duration}
              loading={false}
            />
            <div style={{ borderTop: "1px solid #252525" }} />
            <PlanRow
              step="Lead"
              accent="#3A5A3A"
              title={leadAction}
              meta="Leadership"
              loading={false}
            />
          </div>
        </section>

        {/* START YOUR DAY */}
        <Link
          href="/dashboard/today"
          className="flex items-center justify-center w-full transition-all duration-150 hover:opacity-90 active:scale-[0.99]"
          style={{
            backgroundColor: "#C45B28",
            color: "#0A0A0A",
            fontFamily: "var(--font-inter)",
            fontWeight: 700,
            fontSize: "0.875rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            borderRadius: "12px",
            minHeight: "64px",
          }}
        >
          Start Your Day →
        </Link>

        {/* Your Progress */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Your Progress
          </p>

          {/* Score + Streak tiles */}
          <div className="grid grid-cols-2 gap-3">
            {/* Daily score */}
            <div
              className="flex flex-col items-center justify-center py-6 gap-2"
              style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
            >
              <span
                className="text-4xl font-bold leading-none"
                style={{
                  fontFamily: "var(--font-oswald)",
                  color: loading ? "#252525" : dailyScore === 100 ? "#4CAF50" : "#C45B28",
                }}
              >
                {loading ? "–" : dailyScore}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Daily Score / 100
              </span>
              {!loading && (
                <div className="flex gap-2 flex-wrap justify-center mt-1">
                  <ScorePip label="Train" done={score.workout} points={40} />
                  <ScorePip label="Check-in" done={score.checkin} points={20} />
                  <ScorePip label="Journal" done={score.journal} points={20} />
                  <ScorePip label="Meal" done={score.meal} points={20} />
                </div>
              )}
            </div>

            {/* Streak */}
            <div
              className="flex flex-col items-center justify-center py-6 gap-1"
              style={{ backgroundColor: "#0D1B2A", border: "1px solid #1E3A5F", borderRadius: "12px" }}
            >
              <span
                className="text-4xl font-bold leading-none"
                style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
              >
                {loading ? "–" : streak}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Day Streak
              </span>
            </div>
          </div>

          {/* Weekly bar */}
          <div
            className="px-6 py-5 flex flex-col gap-3"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                This Week
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                {loading ? "–/7" : `${weekly.done}/7 days`}
              </span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: "6px", backgroundColor: "#252525" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  backgroundColor: "#C45B28",
                  width: loading ? "0%" : `${(weekly.done / weekly.total) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return (
                  <span
                    key={i}
                    className="text-[9px] uppercase"
                    style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}
                  >
                    {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanRow({
  step,
  accent,
  title,
  meta,
  loading,
}: {
  step: string;
  accent: string;
  title: string;
  meta: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-5 px-6 py-5">
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: accent, minHeight: "2rem" }}
      />
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: accent, fontFamily: "var(--font-inter)" }}
        >
          {step}
        </span>
        {loading ? (
          <div
            className="h-4 w-40 animate-pulse rounded"
            style={{ backgroundColor: "#252525" }}
          />
        ) : (
          <p
            className="text-sm font-semibold leading-snug"
            style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
          >
            {title}
          </p>
        )}
      </div>
      <span
        className="text-xs shrink-0"
        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
      >
        {meta}
      </span>
    </div>
  );
}

function ScorePip({
  label,
  done,
  points,
}: {
  label: string;
  done: boolean;
  points: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: done ? "#C45B28" : "#252525" }}
      />
      <span
        className="text-[9px] uppercase tracking-widest"
        style={{ color: done ? "#9A9A9A" : "#3A3A3A", fontFamily: "var(--font-inter)" }}
      >
        +{points}
      </span>
    </div>
  );
}
