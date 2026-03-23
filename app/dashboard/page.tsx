"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getProgramBySlug, getWeeks } from "@/lib/programs";
import { todayQuote } from "@/lib/quotes";
import BottomNav from "@/components/BottomNav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string | null;
  interests: string[] | null;
  nutrition_goals: { calories?: number; protein?: number; carbs?: number; fat?: number } | null;
};

type DailyScore = {
  workout: boolean;
  checkin: boolean;
  journal: boolean;
  meal: boolean;
};

type WellnessInsight = {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: number;
  action_label?: string;
  action_link?: string;
};

type SnapshotData = {
  steps: number;
  calories: number;
  caloriesGoal: number;
  waterGlasses: number;
  sleepHours: number;
  sleepMinutes: number;
  sleepQuality: number | null;
  mood: string | null;
};

type Challenge = {
  id: string;
  title: string;
  challenge_type: string;
  target: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description: string | null;
};

type ActivityItem = {
  id: string;
  type: "workout" | "meal" | "mood" | "journal" | "sleep";
  label: string;
  detail: string;
  timestamp: string;
};

type WeeklyTrends = {
  workouts: number[];
  moods: number[];
  sleep: number[];
  calories: number[];
  labels: string[];
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

const MOOD_MAP: Record<string, { emoji: string; color: string; score: number }> = {
  locked_in: { emoji: "\uD83D\uDD25", color: "#4CAF50", score: 5 },
  solid: { emoji: "\uD83D\uDCAA", color: "#8BC34A", score: 4 },
  off: { emoji: "\uD83D\uDE10", color: "#FFC107", score: 3 },
  burned_out: { emoji: "\uD83D\uDE29", color: "#FF9800", score: 2 },
  in_trouble: { emoji: "\uD83D\uDEA8", color: "#F44336", score: 1 },
};

const CHALLENGE_UNITS: Record<string, string> = {
  steps: "steps",
  meditation: "min",
  hydration: "ml",
  workouts: "workouts",
};

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

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function buildWeeklyTrends(
  workouts: { created_at: string }[],
  moods: { mood: string; created_at: string }[],
  sleepLogs: { date: string; duration_minutes: number }[],
  mealLogs: { calories: number; date: string }[]
): WeeklyTrends {
  const labels: string[] = [];
  const workoutCounts: number[] = [];
  const moodScores: number[] = [];
  const sleepHours: number[] = [];
  const calorieSums: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString("en-CA");
    labels.push(d.toLocaleDateString("en-US", { weekday: "narrow" }));

    workoutCounts.push(
      workouts.filter((w) => new Date(w.created_at).toLocaleDateString("en-CA") === dayStr).length
    );

    const dayMoods = moods.filter(
      (m) => new Date(m.created_at).toLocaleDateString("en-CA") === dayStr
    );
    if (dayMoods.length > 0) {
      const avg =
        dayMoods.reduce((sum, m) => sum + (MOOD_MAP[m.mood]?.score ?? 3), 0) / dayMoods.length;
      moodScores.push(avg);
    } else {
      moodScores.push(0);
    }

    const daySleep = sleepLogs.find((s) => s.date === dayStr);
    sleepHours.push(daySleep ? daySleep.duration_minutes / 60 : 0);

    const dayCals = mealLogs
      .filter((m) => m.date === dayStr)
      .reduce((sum, m) => sum + (m.calories ?? 0), 0);
    calorieSums.push(dayCals);
  }

  return {
    workouts: workoutCounts,
    moods: moodScores,
    sleep: sleepHours,
    calories: calorieSums,
    labels,
  };
}

function buildActivityFeed(
  workouts: { id: string; created_at: string }[],
  meals: { id: string; name: string; calories: number; meal_type: string; logged_at: string }[],
  moods: { id: string; mood: string; created_at: string }[],
  journals: { id: string; created_at: string }[],
  sleepLogs: { id: string; date: string; duration_minutes: number; quality_score: number }[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  workouts.forEach((w) =>
    items.push({
      id: `w-${w.id}`,
      type: "workout",
      label: "Workout Logged",
      detail: "Completed a training session",
      timestamp: w.created_at,
    })
  );

  meals.forEach((m) =>
    items.push({
      id: `m-${m.id}`,
      type: "meal",
      label: m.meal_type ? `${m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)}` : "Meal",
      detail: `${m.name ?? "Meal"} - ${m.calories ?? 0} cal`,
      timestamp: m.logged_at,
    })
  );

  moods.forEach((m) =>
    items.push({
      id: `mo-${m.id}`,
      type: "mood",
      label: "Mood Check-in",
      detail: m.mood ? m.mood.replace(/_/g, " ") : "recorded",
      timestamp: m.created_at,
    })
  );

  journals.forEach((j) =>
    items.push({
      id: `j-${j.id}`,
      type: "journal",
      label: "Journal Entry",
      detail: "Wrote a reflection",
      timestamp: j.created_at,
    })
  );

  sleepLogs.forEach((s) => {
    const hrs = Math.floor(s.duration_minutes / 60);
    const mins = s.duration_minutes % 60;
    items.push({
      id: `s-${s.id}`,
      type: "sleep",
      label: "Sleep Logged",
      detail: `${hrs}h ${mins}m - quality ${s.quality_score ?? "?"}`,
      timestamp: s.date + "T08:00:00",
    });
  });

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, 5);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState<DailyScore>({
    workout: false,
    checkin: false,
    journal: false,
    meal: false,
  });
  const [weekly, setWeekly] = useState({ done: 0, total: 7 });
  const [workout, setWorkout] = useState<{ slug: string; name: string } | null>(null);
  const [selectedTime, setSelectedTime] = useState<15 | 30 | 45 | 60 | null>(null);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [activeProgram, setActiveProgram] = useState<{
    slug: string;
    name: string;
    currentWeek: number;
    phaseName: string;
    totalWeeks: number | null;
  } | null>(null);
  const [insights, setInsights] = useState<WellnessInsight[]>([]);
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<
    { challenge: Challenge; myProgress: number }[]
  >([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrends | null>(null);
  const [measurementSummary, setMeasurementSummary] = useState<{
    totalInchLoss: number | null;
    latestTotalInches: number | null;
    latestWeight: number | null;
    firstDate: string | null;
  } | null>(null);

  const reset = todayReset();
  const dailyQuote = todayQuote();
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

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();
      const todayStr = todayStart.toISOString().slice(0, 10);

      const [
        profileRes,
        workoutsRes,
        moodsRes,
        journalsRes,
        mealsRes,
        hydrationRes,
        sleepRes,
        enrollmentsRes,
        participantsRes,
      ] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("full_name, interests, nutrition_goals")
          .eq("id", user.id)
          .single(),
        supabase
          .from("workout_logs")
          .select("id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("mood_checkins")
          .select("id, mood, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("journal_entries")
          .select("id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("meal_logs")
          .select("id, name, calories, meal_type, logged_at, date")
          .eq("user_id", user.id)
          .gte("logged_at", sevenDaysAgo)
          .order("logged_at", { ascending: false })
          .limit(50),
        supabase
          .from("hydration_logs")
          .select("id, amount_ml, logged_at")
          .eq("user_id", user.id)
          .gte("logged_at", todayISO)
          .order("logged_at", { ascending: false }),
        supabase
          .from("sleep_logs")
          .select("id, date, duration_minutes, quality_score")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(7),
        supabase
          .from("program_enrollments")
          .select("program_slug, current_week, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1),
        supabase
          .from("challenge_participants")
          .select("challenge_id, current_value")
          .eq("user_id", user.id),
      ]);

      // ── Profile ──
      const p = profileRes.data as Profile | null;
      if (p) setProfile(p);
      setWorkout(suggestWorkout(p?.interests ?? null));

      // ── Streak & weekly ──
      const workoutDates = (workoutsRes.data ?? []).map((r) => r.created_at);
      const moodDates = (moodsRes.data ?? []).map((r) => r.created_at);
      setStreak(calcStreak([...workoutDates, ...moodDates]));
      setTotalWorkouts((workoutsRes.data ?? []).length);
      setWeekly(calcWeeklyDays([...workoutDates, ...moodDates]));

      // ── Daily score ──
      setScore({
        workout: workoutDates.some((d) => d >= todayISO),
        checkin: moodDates.some((d) => d >= todayISO),
        journal: (journalsRes.data ?? []).some((j) => j.created_at >= todayISO),
        meal: (mealsRes.data ?? []).some((m) => m.logged_at >= todayISO),
      });

      // ── Snapshot ──
      const todayWorkouts = (workoutsRes.data ?? []).filter(
        (w) => w.created_at >= todayISO
      ).length;
      const todayMeals = (mealsRes.data ?? []).filter((m) => m.date === todayStr);
      const todayCalories = todayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
      const caloriesGoal = p?.nutrition_goals?.calories ?? 2400;
      const totalMl = (hydrationRes.data ?? []).reduce(
        (sum, h) => sum + (h.amount_ml ?? 0),
        0
      );
      const waterGlasses = Math.round(totalMl / 29.574);
      const lastSleep = (sleepRes.data ?? [])[0];
      const latestMood = (moodsRes.data ?? [])[0];

      setSnapshot({
        steps: todayWorkouts * 2000,
        calories: todayCalories,
        caloriesGoal,
        waterGlasses,
        sleepHours: lastSleep ? Math.floor(lastSleep.duration_minutes / 60) : 0,
        sleepMinutes: lastSleep ? lastSleep.duration_minutes % 60 : 0,
        sleepQuality: lastSleep?.quality_score ?? null,
        mood: latestMood?.mood ?? null,
      });

      // ── Active program ──
      if (enrollmentsRes.data && enrollmentsRes.data.length > 0) {
        const e = enrollmentsRes.data[0];
        const prog = getProgramBySlug(e.program_slug);
        if (prog) {
          const progTotalWeeks = prog.totalWeeks ?? null;
          if (progTotalWeeks == null || e.current_week <= progTotalWeeks) {
            const weeks = getWeeks(e.program_slug);
            const weekData = weeks.find(w => w.num === e.current_week);
            setActiveProgram({
              slug: e.program_slug,
              name: prog.name,
              currentWeek: e.current_week,
              phaseName: weekData?.phase ?? "",
              totalWeeks: progTotalWeeks,
            });
          }
        }
      }

      // ── Challenges ──
      const participants = participantsRes.data ?? [];
      if (participants.length > 0) {
        const challengeIds = participants.map((cp) => cp.challenge_id);
        const { data: challengeData } = await supabase
          .from("team_challenges")
          .select("*")
          .in("id", challengeIds)
          .eq("is_active", true);

        if (challengeData && challengeData.length > 0) {
          const merged = challengeData.map((c: Challenge) => {
            const cp = participants.find((p) => p.challenge_id === c.id);
            return { challenge: c, myProgress: cp?.current_value ?? 0 };
          });
          setActiveChallenges(merged);
        }
      }

      // ── Activity feed ──
      setActivityFeed(
        buildActivityFeed(
          workoutsRes.data ?? [],
          (mealsRes.data ?? []).map((m) => ({
            id: m.id,
            name: m.name,
            calories: m.calories,
            meal_type: m.meal_type,
            logged_at: m.logged_at,
          })),
          (moodsRes.data ?? []).map((m) => ({
            id: m.id,
            mood: m.mood,
            created_at: m.created_at,
          })),
          journalsRes.data ?? [],
          (sleepRes.data ?? []).map((s) => ({
            id: s.id,
            date: s.date,
            duration_minutes: s.duration_minutes,
            quality_score: s.quality_score,
          }))
        )
      );

      // ── Weekly trends ──
      setWeeklyTrends(
        buildWeeklyTrends(
          workoutsRes.data ?? [],
          (moodsRes.data ?? []).map((m) => ({ mood: m.mood, created_at: m.created_at })),
          (sleepRes.data ?? []).map((s) => ({
            date: s.date,
            duration_minutes: s.duration_minutes,
          })),
          (mealsRes.data ?? []).map((m) => ({ calories: m.calories, date: m.date }))
        )
      );

      // ── Body measurements summary ──
      const [latestMeasRes, firstMeasRes] = await Promise.all([
        supabase
          .from("body_measurements")
          .select("total_inches, weight_lbs, measured_at")
          .eq("user_id", user.id)
          .order("measured_at", { ascending: false })
          .limit(1),
        supabase
          .from("body_measurements")
          .select("total_inches, measured_at")
          .eq("user_id", user.id)
          .order("measured_at", { ascending: true })
          .limit(1),
      ]);
      const latestM = latestMeasRes.data?.[0] ?? null;
      const firstM = firstMeasRes.data?.[0] ?? null;
      if (latestM || firstM) {
        const totalInchLoss =
          firstM?.total_inches != null && latestM?.total_inches != null
            ? firstM.total_inches - latestM.total_inches
            : null;
        setMeasurementSummary({
          totalInchLoss,
          latestTotalInches: latestM?.total_inches ?? null,
          latestWeight: latestM?.weight_lbs ?? null,
          firstDate: firstM?.measured_at ?? null,
        });
      }

      // ── Wellness insights (fire-and-forget) ──
      supabase.functions
        .invoke("wellness-insights", { body: { user_id: user.id } })
        .then(({ data: insightsData }) => {
          if (insightsData?.insights && Array.isArray(insightsData.insights)) {
            const sorted = [...insightsData.insights].sort(
              (a: WellnessInsight, b: WellnessInsight) => a.priority - b.priority
            );
            setInsights(sorted.slice(0, 3));
          }
        })
        .catch(() => {});

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
      {/* ─── 1. Welcome Header ─────────────────────────────────────────────────── */}
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

          {!loading && streak === 0 && dailyScore === 0 ? (
            <>
              <h1
                className="text-4xl sm:text-5xl font-bold uppercase leading-tight"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Welcome to Groundwork
                {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
              </h1>
              <p
                className="text-sm mt-2"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Your first day starts now. Hit the button below to get moving.
              </p>
            </>
          ) : (
            <h1
              className="text-4xl sm:text-5xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              {greeting()}
              {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
            </h1>
          )}

          {/* Streak badge */}
          <div className="mt-4 flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2"
              style={{
                backgroundColor: "#0D1B2A",
                border: "1px solid #1E3A5F",
                borderRadius: "8px",
              }}
            >
              <span
                className="text-2xl font-bold leading-none"
                style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
              >
                {loading ? "\u2013" : streak}
              </span>
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-inter)", color: "#9A9A9A" }}
              >
                Day Streak
              </span>
            </div>
            <p
              className="text-xs"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
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

        {/* ─── Mindset of the Day ──────────────────────────────────────── */}
        <section>
          <div
            className="px-6 py-5 flex flex-col gap-2"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
            }}
          >
            <p
              className="text-[10px] font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Mindset of the Day
            </p>
            <p
              className="text-base font-bold leading-snug"
              style={{ color: "#E8E2D8", fontFamily: "var(--font-oswald)" }}
            >
              &ldquo;{dailyQuote.text}&rdquo;
            </p>
            {dailyQuote.author && (
              <p
                className="text-xs"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                &mdash; {dailyQuote.author}
              </p>
            )}
          </div>
        </section>

        {/* ─── 2. Daily Snapshot Cards ─────────────────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Daily Snapshot
          </p>
          <div
            className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <SnapshotCard
              title="Steps Today"
              value={
                loading
                  ? "\u2013"
                  : snapshot && snapshot.steps > 0
                  ? `~${snapshot.steps.toLocaleString()}`
                  : "\u2014"
              }
              sub="(est.)"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                  <path
                    d="M13 5.5C13 4.12 14.12 3 15.5 3S18 4.12 18 5.5 16.88 8 15.5 8 13 6.88 13 5.5ZM9.8 8.9L7 23H9.1L10.9 15L13 17V23H15V15.5L12.9 13.5L13.5 10.5C14.8 12 16.8 13 19 13V11C17.1 11 15.5 10 14.7 8.6L13.7 7C13.3 6.4 12.7 6 12 6C11.7 6 11.5 6.1 11.2 6.1L6 8.3V13H8V9.6L9.8 8.9Z"
                    fill="currentColor"
                  />
                </svg>
              }
              color="#C45B28"
            />
            <SnapshotCard
              title="Calories"
              value={
                loading
                  ? "\u2013"
                  : `${snapshot?.calories ?? 0} / ${snapshot?.caloriesGoal ?? 2400}`
              }
              sub="cal"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                  <path
                    d="M11 9H9V2H7V9H5V2H3V9C3 11.12 4.66 12.84 6.75 12.97V22H9.25V12.97C11.34 12.84 13 11.12 13 9V2H11V9ZM16 6V14H18.5V22H21V2C18.24 2 16 4.24 16 6Z"
                    fill="currentColor"
                  />
                </svg>
              }
              color="#4CAF50"
            />
            <SnapshotCard
              title="Water"
              value={
                loading
                  ? "\u2013"
                  : `${snapshot?.waterGlasses ?? 0} / 96`
              }
              sub="oz today"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                  <path
                    d="M12 2C6 12 4 15 4 18C4 22 7.58 24 12 24C16.42 24 20 22 20 18C20 15 18 12 12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                  />
                </svg>
              }
              color="#1E6A9A"
            />
            <SnapshotCard
              title="Sleep"
              value={
                loading
                  ? "\u2013"
                  : snapshot && (snapshot.sleepHours > 0 || snapshot.sleepMinutes > 0)
                  ? `${snapshot.sleepHours}h ${snapshot.sleepMinutes}m`
                  : "\u2014"
              }
              sub={
                snapshot?.sleepQuality != null
                  ? `Quality: ${snapshot.sleepQuality}`
                  : ""
              }
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                  <path
                    d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 11.54 20.96 11.08 20.9 10.64C19.92 12.01 18.32 12.9 16.5 12.9C13.46 12.9 11 10.44 11 7.4C11 5.58 11.9 3.98 13.26 3C12.86 3.03 12.43 3 12 3Z"
                    fill="currentColor"
                  />
                </svg>
              }
              color="#2A5A8A"
            />
            <SnapshotCard
              title="Mood"
              value={
                loading
                  ? "\u2013"
                  : snapshot?.mood
                  ? `${MOOD_MAP[snapshot.mood]?.emoji ?? ""} ${snapshot.mood.replace(/_/g, " ")}`
                  : "\u2014"
              }
              sub=""
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle cx="9" cy="10" r="1" fill="currentColor" />
                  <circle cx="15" cy="10" r="1" fill="currentColor" />
                </svg>
              }
              color={snapshot?.mood ? (MOOD_MAP[snapshot.mood]?.color ?? "#9A9A9A") : "#9A9A9A"}
            />
          </div>
        </section>

        {/* ─── 2b. Body Measurements Summary ──────────────────────────────────── */}
        {(measurementSummary || loading) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Body Measurements
              </p>
              <Link
                href="/dashboard/body/measurements"
                className="text-xs"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                View all →
              </Link>
            </div>
            <Link
              href="/dashboard/body/measurements"
              className="flex items-center justify-between px-5 py-4 transition-opacity hover:opacity-80 active:scale-[0.99]"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
              }}
            >
              {loading ? (
                <div className="flex gap-4 w-full">
                  <div className="rounded animate-pulse" style={{ width: 60, height: 40, backgroundColor: "#252525" }} />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="rounded animate-pulse" style={{ width: "60%", height: 14, backgroundColor: "#252525" }} />
                    <div className="rounded animate-pulse" style={{ width: "40%", height: 10, backgroundColor: "#252525" }} />
                  </div>
                </div>
              ) : measurementSummary ? (
                <>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-3xl font-black leading-none"
                      style={{
                        fontFamily: "var(--font-oswald)",
                        color: (measurementSummary.totalInchLoss ?? 0) >= 0 ? "#C45B28" : "#E87070",
                      }}
                    >
                      {measurementSummary.totalInchLoss != null
                        ? `${(measurementSummary.totalInchLoss ?? 0) >= 0 ? "" : "+"}${Math.abs(measurementSummary.totalInchLoss).toFixed(1)}"`
                        : measurementSummary.latestTotalInches != null
                        ? `${measurementSummary.latestTotalInches.toFixed(1)}"`
                        : "—"}
                    </span>
                    <span
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {measurementSummary.totalInchLoss != null
                        ? (measurementSummary.totalInchLoss ?? 0) >= 0
                          ? "total inches lost"
                          : "total inches gained"
                        : "total circumference"}
                    </span>
                    {measurementSummary.firstDate && (
                      <span
                        className="text-xs"
                        style={{ color: "#555555", fontFamily: "var(--font-inter)" }}
                      >
                        since {new Date(measurementSummary.firstDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {measurementSummary.latestWeight != null && (
                      <>
                        <span
                          className="text-xl font-bold leading-none"
                          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                        >
                          {measurementSummary.latestWeight.toFixed(1)}
                        </span>
                        <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>lbs</span>
                      </>
                    )}
                    <span className="text-xs mt-1" style={{ color: "#555555", fontFamily: "var(--font-inter)" }}>
                      tap to track →
                    </span>
                  </div>
                </>
              ) : null}
            </Link>
          </section>
        )}

        {/* ─── How Much Time Do You Have? ─────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-3"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            How Much Time Do You Have?
          </p>
          <div className="flex gap-3">
            {([15, 30, 45, 60] as const).map((mins) => (
              <button
                key={mins}
                onClick={() => setSelectedTime(selectedTime === mins ? null : mins)}
                className="flex-1 transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: selectedTime === mins ? "#C45B28" : "#161616",
                  color: selectedTime === mins ? "#0A0A0A" : "#9A9A9A",
                  border: `1px solid ${selectedTime === mins ? "#C45B28" : "#252525"}`,
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  minHeight: "52px",
                }}
              >
                {mins}m
              </button>
            ))}
          </div>
        </section>

        {/* ─── Today's Blueprint ───────────────────────────────────────── */}
        {selectedTime && (
          <section>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-3"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Today&apos;s Blueprint
            </p>
            <div
              className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {[
                {
                  label: "Work",
                  value: loading ? "Loading\u2026" : (workout?.name ?? "Bodyweight"),
                  meta: `${selectedTime} min`,
                  href: `/dashboard/body`,
                  accent: "#C45B28",
                  bg: "#1A0A00",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                      <path d="M6 4v16M18 4v16M8 12h8M3 8h3M18 8h3M3 16h3M18 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  label: "Fuel",
                  value: "Hit Protein Goal",
                  meta: "Track macros",
                  href: "/dashboard/nutrition",
                  accent: "#22c55e",
                  bg: "#001A0A",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                      <path d="M11 9H9V2H7V9H5V2H3V9C3 11.12 4.66 12.84 6.75 12.97V22H9.25V12.97C11.34 12.84 13 11.12 13 9V2H11V9ZM16 6V14H18.5V22H21V2C18.24 2 16 4.24 16 6Z" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  label: "Mind",
                  value: reset.title,
                  meta: reset.duration,
                  href: "/dashboard/mind",
                  accent: "#8B5CF6",
                  bg: "#1A0A2A",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                      <path d="M12 4C8.5 4 6 6.5 6 10C6 12 7 13.5 8.5 14.5V17H15.5V14.5C17 13.5 18 12 18 10C18 6.5 15.5 4 12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: "Time",
                  value: `${selectedTime} Min Block`,
                  meta: "Scheduled",
                  href: "/dashboard/body",
                  accent: "#1E6A9A",
                  bg: "#001A2A",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ].map(({ label, value, meta, href, accent, bg, icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col gap-3 p-4 transition-all duration-150 hover:opacity-90 active:scale-[0.98] shrink-0"
                  style={{
                    backgroundColor: bg,
                    border: `1px solid ${accent}33`,
                    borderRadius: "12px",
                    minWidth: "140px",
                    width: "140px",
                  }}
                >
                  <div style={{ color: accent }}>{icon}</div>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: accent, fontFamily: "var(--font-inter)" }}
                    >
                      {label}
                    </span>
                    <span
                      className="text-sm font-bold leading-tight"
                      style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                    >
                      {value}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {meta}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── 3. Quick Actions ─────────────────────────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionBtn
              label="Log Meal"
              href="/dashboard/nutrition"
              color="#C45B28"
              bg="#1A0A00"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
                  <path
                    d="M11 9H9V2H7V9H5V2H3V9C3 11.12 4.66 12.84 6.75 12.97V22H9.25V12.97C11.34 12.84 13 11.12 13 9V2H11V9ZM16 6V14H18.5V22H21V2C18.24 2 16 4.24 16 6Z"
                    fill="currentColor"
                  />
                </svg>
              }
            />
            <QuickActionBtn
              label="Log Water"
              href="/dashboard/nutrition"
              color="#1E6A9A"
              bg="#001A2A"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
                  <path
                    d="M12 2C6 12 4 15 4 18C4 22 7.58 24 12 24C16.42 24 20 22 20 18C20 15 18 12 12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                  />
                </svg>
              }
            />
            <QuickActionBtn
              label="Mood Check-in"
              href="/dashboard/mind"
              color="#5A3A7A"
              bg="#1A0A2A"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"
                    fill="currentColor"
                  />
                </svg>
              }
            />
            <QuickActionBtn
              label="Start Meditation"
              href="/dashboard/mind/meditate"
              color="#2A6A6A"
              bg="#001A1A"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
                  <path
                    d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              }
            />
            <QuickActionBtn
              label="Log Workout"
              href="/dashboard/body"
              color="#C45B28"
              bg="#1A0A00"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
                  <path
                    d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L5.57 4.14L4.14 2.71L2.71 4.14L4.14 5.57L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L18.43 19.86L19.86 21.29L21.29 19.86L19.86 18.43L22 16.29L20.57 14.86Z"
                    fill="currentColor"
                  />
                </svg>
              }
            />
            <QuickActionBtn
              label="View Sleep"
              href="/dashboard/body/sleep"
              color="#1E3A5F"
              bg="#0D1B2A"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
                  <path
                    d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 11.54 20.96 11.08 20.9 10.64C19.92 12.01 18.32 12.9 16.5 12.9C13.46 12.9 11 10.44 11 7.4C11 5.58 11.9 3.98 13.26 3C12.86 3.03 12.43 3 12 3Z"
                    fill="currentColor"
                  />
                </svg>
              }
            />
            <QuickActionBtn
              label="Log Measurements"
              href="/dashboard/body/measurements"
              color="#2A6A4A"
              bg="#001A0A"
              icon={
                <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
                  <path d="M3 3h18v2H3zM3 8h12v2H3zM3 13h15v2H3zM3 18h9v2H3z" fill="currentColor" />
                  <path d="M19 14v6M16 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />
          </div>
        </section>

        {/* ─── 4. Continue Program ─────────────────────────────────────────────── */}
        {activeProgram && (
          <Link
            href={`/dashboard/body/programs/${activeProgram.slug}/week/${activeProgram.currentWeek}`}
            className="flex flex-col gap-3 px-6 py-5 transition-opacity hover:opacity-90 active:scale-[0.99]"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #C45B28",
              borderRadius: "12px",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                >
                  Continue Training
                </span>
                <span
                  className="text-base font-bold"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                >
                  {activeProgram.name}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    Week {activeProgram.currentWeek}
                  </span>
                  {activeProgram.phaseName && (
                    <>
                      <span style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)", fontSize: "10px" }}>&bull;</span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                      >
                        {activeProgram.phaseName}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span
                className="text-sm font-semibold uppercase tracking-widest shrink-0"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Go &rsaquo;
              </span>
            </div>
            {activeProgram.totalWeeks != null && (
              <div className="flex flex-col gap-1.5">
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: "4px", backgroundColor: "#252525" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      backgroundColor: "#C45B28",
                      width: `${Math.min(100, (activeProgram.currentWeek / activeProgram.totalWeeks) * 100)}%`,
                    }}
                  />
                </div>
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Week {activeProgram.currentWeek} of {activeProgram.totalWeeks}
                </span>
              </div>
            )}
          </Link>
        )}

        {/* ─── 5. Wellness Insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <section className="flex flex-col gap-4">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Wellness Insights
            </p>
            <div className="flex flex-col gap-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="px-6 py-5 flex flex-col gap-2"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "12px",
                  }}
                >
                  <p
                    className="text-sm font-bold leading-snug"
                    style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                  >
                    {insight.title}
                  </p>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    {insight.body}
                  </p>
                  {insight.action_label && insight.action_link && (
                    <Link
                      href={insight.action_link}
                      className="text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-70 mt-1"
                      style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                    >
                      {insight.action_label} &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 6. Active Challenges ────────────────────────────────────────────── */}
        {activeChallenges.length > 0 && (
          <section className="flex flex-col gap-4">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Active Challenges
            </p>
            <div className="flex flex-col gap-3">
              {activeChallenges.map(({ challenge, myProgress }) => {
                const pct = Math.min(
                  100,
                  challenge.target > 0 ? (myProgress / challenge.target) * 100 : 0
                );
                const unit = CHALLENGE_UNITS[challenge.challenge_type] ?? "";
                return (
                  <Link
                    key={challenge.id}
                    href={`/dashboard/challenges/${challenge.id}`}
                    className="px-6 py-5 flex flex-col gap-3 transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: "#161616",
                      border: "1px solid #252525",
                      borderRadius: "12px",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                        >
                          {challenge.title}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-widest"
                          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                        >
                          {challenge.challenge_type}
                        </span>
                      </div>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                      >
                        {myProgress} / {challenge.target} {unit}
                      </span>
                    </div>
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: "6px", backgroundColor: "#252525" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: "#C45B28",
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── 7. Recent Activity Feed ─────────────────────────────────────────── */}
        {activityFeed.length > 0 && (
          <section className="flex flex-col gap-4">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Recent Activity
            </p>
            <div className="flex flex-col gap-2">
              {activityFeed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "12px",
                  }}
                >
                  <ActivityIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold leading-snug truncate"
                      style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {item.detail}
                    </p>
                  </div>
                  <span
                    className="text-[10px] shrink-0 uppercase tracking-widest"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    {relativeTime(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 8. Weekly Trends ────────────────────────────────────────────────── */}
        {weeklyTrends && (
          <section className="flex flex-col gap-4">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Weekly Trends
            </p>
            <div className="grid grid-cols-2 gap-3">
              <TrendCard
                label="Workouts"
                currentValue={`${weeklyTrends.workouts[6]}`}
                values={weeklyTrends.workouts}
                color="#C45B28"
                unit="/day"
              />
              <TrendCard
                label="Mood"
                currentValue={
                  weeklyTrends.moods[6] > 0 ? weeklyTrends.moods[6].toFixed(1) : "\u2014"
                }
                values={weeklyTrends.moods}
                color="#5A6A9A"
                unit="/5"
              />
              <TrendCard
                label="Sleep"
                currentValue={
                  weeklyTrends.sleep[6] > 0
                    ? `${weeklyTrends.sleep[6].toFixed(1)}h`
                    : "\u2014"
                }
                values={weeklyTrends.sleep}
                color="#2A5A8A"
                unit=""
              />
              <TrendCard
                label="Calories"
                currentValue={
                  weeklyTrends.calories[6] > 0
                    ? weeklyTrends.calories[6].toLocaleString()
                    : "\u2014"
                }
                values={weeklyTrends.calories}
                color="#4A8A4A"
                unit="cal"
              />
            </div>
          </section>
        )}

        {/* ─── 9. Today's Plan ─────────────────────────────────────────────────── */}
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
              title={loading ? "Loading\u2026" : (workout?.name ?? "Bodyweight Workout")}
              meta="30 min"
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
          Start Your Day &rarr;
        </Link>

        {/* ─── Your Progress ───────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Your Progress
          </p>

          {/* 4-stat row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Day Streak", value: loading ? "\u2013" : String(streak), unit: "days", color: "#C45B28" },
              { label: "Workouts", value: loading ? "\u2013" : String(totalWorkouts), unit: "logged", color: "#22c55e" },
              { label: "Weight", value: loading ? "\u2013" : (measurementSummary?.latestWeight != null ? `${measurementSummary.latestWeight.toFixed(0)}` : "\u2014"), unit: "lbs", color: "#E8E2D8" },
              { label: "Energy", value: loading ? "\u2013" : String(dailyScore), unit: "%", color: "#f97316" },
            ].map(({ label, value, unit, color }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center py-4 gap-0.5"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "10px",
                }}
              >
                <span
                  className="text-xl font-bold leading-none"
                  style={{ fontFamily: "var(--font-oswald)", color }}
                >
                  {value}
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-widest text-center"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  {label}
                </span>
                <span
                  className="text-[9px] uppercase tracking-widest"
                  style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}
                >
                  {unit}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/badges"
              className="flex flex-col items-center justify-center py-6 gap-2 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
              }}
            >
              <span
                className="text-4xl font-bold leading-none"
                style={{
                  fontFamily: "var(--font-oswald)",
                  color: loading ? "#252525" : dailyScore === 100 ? "#4CAF50" : "#C45B28",
                }}
              >
                {loading ? "\u2013" : dailyScore}
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
            </Link>

            <Link
              href="/dashboard/badges"
              className="flex flex-col items-center justify-center py-6 gap-1 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#0D1B2A",
                border: "1px solid #1E3A5F",
                borderRadius: "12px",
              }}
            >
              <span
                className="text-4xl font-bold leading-none"
                style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
              >
                {loading ? "\u2013" : streak}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Day Streak
              </span>
            </Link>
          </div>

          <Link
            href="/dashboard/badges"
            className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-70 self-end"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            View All Badges &rsaquo;
          </Link>

          {/* Weekly bar */}
          <div
            className="px-6 py-5 flex flex-col gap-3"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
            }}
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
                {loading ? "\u2013/7" : `${weekly.done}/7 days`}
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

        {/* ─── 10. Crew ────────────────────────────────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-3"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Crew
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/challenges"
              className="flex items-center gap-3 px-4 py-4 transition-all duration-150 hover:opacity-80"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
              }}
            >
              <div
                className="w-9 h-9 shrink-0 flex items-center justify-center"
                style={{
                  backgroundColor: "#1A0A00",
                  border: "1px solid #3A1A00",
                  borderRadius: "8px",
                  color: "#C45B28",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
                  <path
                    d="M12 4L14.5 9H20L15.5 12.5L17.5 18L12 14.5L6.5 18L8.5 12.5L4 9H9.5L12 4Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p
                  className="text-sm font-bold uppercase leading-tight"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                >
                  Challenges
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Team competitions
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/crew"
              className="flex items-center gap-3 px-4 py-4 transition-all duration-150 hover:opacity-80"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
              }}
            >
              <div
                className="w-9 h-9 shrink-0 flex items-center justify-center"
                style={{
                  backgroundColor: "#001A1A",
                  border: "1px solid #003A3A",
                  borderRadius: "8px",
                  color: "#2AB5B5",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
                  <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M3 19C3 16.2 5.7 14 9 14C12.3 14 15 16.2 15 19"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 14C19.2 14 21 15.8 21 18"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <p
                  className="text-sm font-bold uppercase leading-tight"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                >
                  Crew Wall
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Share & connect
                </p>
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* ─── 11. Ask Coach FAB ───────────────────────────────────────────────── */}
      <Link
        href="/dashboard/coach"
        aria-label="Ask Coach"
        className="fixed z-40 flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
        style={{
          bottom: "80px",
          right: "20px",
          width: "52px",
          height: "52px",
          backgroundColor: "#C45B28",
          borderRadius: "50%",
          boxShadow: "0 4px 20px rgba(196, 91, 40, 0.45)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
          <path
            d="M4 4h16c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1H8l-4 4V5c0-.55.45-1 1-1Z"
            stroke="#0A0A0A"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <line
            x1="8"
            y1="9"
            x2="16"
            y2="9"
            stroke="#0A0A0A"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="12"
            x2="13"
            y2="12"
            stroke="#0A0A0A"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </Link>

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
        style={{
          color: done ? "#9A9A9A" : "#3A3A3A",
          fontFamily: "var(--font-inter)",
        }}
      >
        +{points}
      </span>
    </div>
  );
}

function Sparkline({
  values,
  color,
  width = 80,
  height = 32,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pad = 2;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;

  const points = values
    .map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * plotW;
      const y = pad + plotH - ((v - min) / range) * plotH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SnapshotCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="shrink-0 flex flex-col items-center justify-center gap-2 px-4 py-4"
      style={{
        width: "140px",
        minHeight: "120px",
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: "12px",
      }}
    >
      <div style={{ color }}>{icon}</div>
      <span
        className="text-sm font-bold text-center leading-tight"
        style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
      >
        {value}
      </span>
      <span
        className="text-[10px] uppercase tracking-widest text-center"
        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
      >
        {title}
      </span>
      {sub && (
        <span
          className="text-[9px] text-center"
          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function QuickActionBtn({
  label,
  href,
  icon,
  color,
  bg,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-4 transition-all duration-150 hover:opacity-80 active:scale-[0.98]"
      style={{
        backgroundColor: bg,
        border: `1px solid ${color}33`,
        borderRadius: "12px",
        minHeight: "64px",
        color,
      }}
    >
      <div
        className="w-10 h-10 shrink-0 flex items-center justify-center"
        style={{
          backgroundColor: `${color}18`,
          borderRadius: "10px",
        }}
      >
        {icon}
      </div>
      <span
        className="text-sm font-bold leading-tight"
        style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
      >
        {label}
      </span>
    </Link>
  );
}

function TrendCard({
  label,
  currentValue,
  values,
  color,
  unit,
}: {
  label: string;
  currentValue: string;
  values: number[];
  color: string;
  unit: string;
}) {
  return (
    <div
      className="flex flex-col gap-2 px-5 py-4"
      style={{
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: "12px",
      }}
    >
      <span
        className="text-[10px] uppercase tracking-widest font-semibold"
        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
      >
        {label}
      </span>
      <div className="flex items-end justify-between gap-2">
        <span
          className="text-lg font-bold leading-none"
          style={{ color, fontFamily: "var(--font-oswald)" }}
        >
          {currentValue}
          {unit && (
            <span
              className="text-[10px] font-normal ml-0.5"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              {unit}
            </span>
          )}
        </span>
        <Sparkline values={values} color={color} width={80} height={32} />
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const configs: Record<
    ActivityItem["type"],
    { bg: string; color: string; icon: React.ReactNode }
  > = {
    workout: {
      bg: "#1A0A00",
      color: "#C45B28",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
          <path
            d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L5.57 4.14L4.14 2.71L2.71 4.14L4.14 5.57L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L18.43 19.86L19.86 21.29L21.29 19.86L19.86 18.43L22 16.29L20.57 14.86Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    meal: {
      bg: "#0A1A0A",
      color: "#4CAF50",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
          <path
            d="M11 9H9V2H7V9H5V2H3V9C3 11.12 4.66 12.84 6.75 12.97V22H9.25V12.97C11.34 12.84 13 11.12 13 9V2H11V9ZM16 6V14H18.5V22H21V2C18.24 2 16 4.24 16 6Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    mood: {
      bg: "#1A0A2A",
      color: "#5A3A7A",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
        </svg>
      ),
    },
    journal: {
      bg: "#0A0A1A",
      color: "#5A6A9A",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
          <path
            d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    sleep: {
      bg: "#0D1B2A",
      color: "#2A5A8A",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
          <path
            d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 11.54 20.96 11.08 20.9 10.64C19.92 12.01 18.32 12.9 16.5 12.9C13.46 12.9 11 10.44 11 7.4C11 5.58 11.9 3.98 13.26 3C12.86 3.03 12.43 3 12 3Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
  };

  const cfg = configs[type];
  return (
    <div
      className="w-9 h-9 shrink-0 flex items-center justify-center"
      style={{
        backgroundColor: cfg.bg,
        borderRadius: "8px",
        color: cfg.color,
      }}
    >
      {cfg.icon}
    </div>
  );
}
