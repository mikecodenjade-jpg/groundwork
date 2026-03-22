"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string | null;
  role: string | null;
  company: string | null;
  interests: string[] | null;
};

type Stats = {
  totalWorkouts: number;
  totalMoods: number;
  streak: number;
};

type SuggestedWorkout = {
  name: string;
  slug: string;
  duration: number;
  exerciseCount: number;
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

const ALL_SLUGS = Object.values(INTEREST_TO_SLUG);

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

// 15-min workouts always have 3 exercises
const EXERCISE_COUNT_15 = 3;
const DEFAULT_DURATION = 15;

const RESETS = [
  { title: "5-Minute Stress Reset", tag: "Breathing + Grounding", duration: "5 min" },
  { title: "Box Breathing", tag: "Breathwork", duration: "4 min" },
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

function suggestWorkout(interests: string[] | null): SuggestedWorkout {
  const slugs =
    interests && interests.length > 0
      ? interests.map((i) => INTEREST_TO_SLUG[i]).filter(Boolean)
      : ALL_SLUGS;

  const pool = slugs.length > 0 ? slugs : ALL_SLUGS;
  // Deterministic-ish: vary by day of year so it rotates daily
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const slug = pool[dayOfYear % pool.length];

  return {
    slug,
    name: `${SLUG_LABELS[slug]} Workout`,
    duration: DEFAULT_DURATION,
    exerciseCount: EXERCISE_COUNT_15,
  };
}

function todayReset() {
  const day = new Date().getDay(); // 0 = Sun
  return RESETS[day % 2];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [workout, setWorkout] = useState<SuggestedWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, workoutsRes, moodsRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("full_name, role, company, interests")
          .eq("id", user.id)
          .single(),
        supabase
          .from("workout_logs")
          .select("created_at")
          .eq("user_id", user.id),
        supabase
          .from("mood_checkins")
          .select("created_at")
          .eq("user_id", user.id),
      ]);

      const p = profileRes.data as Profile | null;
      if (p) setProfile(p);

      const workoutDates = (workoutsRes.data ?? []).map((r) => r.created_at);
      const moodDates = (moodsRes.data ?? []).map((r) => r.created_at);
      const allDates = [...workoutDates, ...moodDates];

      setStats({
        totalWorkouts: workoutDates.length,
        totalMoods: moodDates.length,
        streak: calcStreak(allDates),
      });

      setWorkout(suggestWorkout(p?.interests ?? null));
      setLoading(false);
    }
    load();
  }, []);

  const reset = todayReset();

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      {/* Top bar */}
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

        {/* Greeting + streak */}
        <section className="flex flex-col gap-1">
          <p className="text-xs tracking-widest uppercase" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {todayLabel()}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold uppercase leading-tight"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            {greeting()}{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
          </h1>

          {/* Streak pill */}
          {stats !== null && (
            <div className="mt-4 flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-4 py-2"
                style={{ backgroundColor: "#0D1B2A", border: "1px solid #1E3A5F", borderRadius: "8px" }}
              >
                <span
                  className="text-xl font-bold leading-none"
                  style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
                >
                  {stats.streak}
                </span>
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-inter)", color: "#9A9A9A" }}
                >
                  {stats.streak === 1 ? "Day Streak" : "Day Streak"}
                </span>
              </div>
              <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                {stats.streak === 0
                  ? "Start something today."
                  : stats.streak === 1
                  ? "Day one. Keep going."
                  : `${stats.streak} days straight.`}
              </p>
            </div>
          )}
        </section>

        {/* ── Action Cards ─────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Today&apos;s Plan
          </p>

          {/* TRAIN */}
          <ActionCard
            label="Train"
            loading={loading}
            accent="#C45B28"
            href={
              workout
                ? `/dashboard/body/${workout.slug}?time=${workout.duration}`
                : "/dashboard/body"
            }
          >
            {workout && (
              <>
                <h2
                  className="text-2xl font-bold uppercase leading-tight"
                  style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                >
                  {workout.name}
                </h2>
                <div className="flex gap-4 mt-1">
                  <Chip>{workout.duration} min</Chip>
                  <Chip>{workout.exerciseCount} exercises</Chip>
                </div>
                <p className="text-xs mt-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Based on your training interests
                </p>
              </>
            )}
          </ActionCard>

          {/* RESET */}
          <ActionCard
            label="Reset"
            loading={false}
            accent="#7A5228"
            href="/dashboard/mind"
          >
            <h2
              className="text-2xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              {reset.title}
            </h2>
            <div className="flex gap-4 mt-1">
              <Chip>{reset.duration}</Chip>
              <Chip>{reset.tag}</Chip>
            </div>
            <p className="text-xs mt-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Mental reset for the jobsite
            </p>
          </ActionCard>

          {/* REFLECT */}
          <ActionCard
            label="Reflect"
            loading={false}
            accent="#3A5A3A"
            href="/dashboard/heart"
          >
            <h2
              className="text-2xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Journal + Gratitude
            </h2>
            <div className="flex gap-4 mt-1">
              <Chip>3 min</Chip>
              <Chip>End of Day</Chip>
            </div>
            <p className="text-xs mt-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Leave the job at the gate
            </p>
          </ActionCard>
        </section>

        {/* ── Progress ─────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Your Progress
          </p>

          <div className="grid grid-cols-3 gap-3">
            {loading || stats === null ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse"
                    style={{ backgroundColor: "#0D1B2A", border: "1px solid #1E3A5F", borderRadius: "12px" }}
                  />
                ))}
              </>
            ) : (
              <>
                <StatCard value={stats.totalWorkouts} label="Workouts" />
                <StatCard value={stats.totalMoods} label="Check-Ins" />
                <StatCard value={stats.streak} label="Day Streak" accent />
              </>
            )}
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
      style={{
        color: "#9A9A9A",
        border: "1px solid #252525",
        fontFamily: "var(--font-inter)",
        borderRadius: "4px",
      }}
    >
      {children}
    </span>
  );
}

function ActionCard({
  label,
  loading,
  accent,
  href,
  children,
}: {
  label: string;
  loading: boolean;
  accent: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col"
      style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}
    >
      {/* Card label bar */}
      <div
        className="px-7 py-2 flex items-center gap-2"
        style={{ borderBottom: "1px solid #252525", backgroundColor: "#161616" }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: accent, fontFamily: "var(--font-inter)" }}
        >
          {label}
        </p>
      </div>

      <div className="px-7 py-6 flex items-end justify-between gap-6">
        {/* Content */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col gap-2">
              <div className="h-7 w-48 animate-pulse" style={{ backgroundColor: "#1A1A1A" }} />
              <div className="h-4 w-32 animate-pulse" style={{ backgroundColor: "#1A1A1A" }} />
            </div>
          ) : (
            children
          )}
        </div>

        {/* Start button */}
        <Link
          href={href}
          className="flex-shrink-0 px-7 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: accent,
            color: "#0A0A0A",
            fontFamily: "var(--font-inter)",
            fontWeight: 600,
            borderRadius: "8px",
            minHeight: "48px",
            display: "flex",
            alignItems: "center",
          }}
        >
          Start
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-6 gap-1"
      style={{ backgroundColor: "#0D1B2A", border: "1px solid #1E3A5F", borderRadius: "12px" }}
    >
      <span
        className="text-3xl font-bold leading-none"
        style={{
          fontFamily: "var(--font-oswald)",
          color: accent ? "#C45B28" : "#E8E2D8",
        }}
      >
        {value}
      </span>
      <span
        className="text-[10px] font-semibold uppercase tracking-widest text-center"
        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
      >
        {label}
      </span>
    </div>
  );
}
