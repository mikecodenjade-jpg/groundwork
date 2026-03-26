"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getProgramBySlug } from "@/lib/programs";
import BottomNav from "@/components/BottomNav";
import DailyCheckinModal from "@/components/DailyCheckinModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string | null;
  interests: string[] | null;
  nutrition_goals: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  } | null;
};

type PillarStatus = {
  train: boolean;
  fuel: boolean;
  mind: boolean;
  lead: boolean;
};

type ActiveProgram = {
  slug: string;
  name: string;
  currentWeek: number;
  totalWeeks: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greetingText(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
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
      (new Date(unique[i - 1]).getTime() - new Date(unique[i]).getTime()) /
        86400000
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function weekDaysDone(allDates: string[]): boolean[] {
  const dateSet = new Set(
    allDates.map((d) => new Date(d).toLocaleDateString("en-CA"))
  );
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return dateSet.has(d.toLocaleDateString("en-CA"));
  });
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────

function Shimmer({
  w,
  h,
  r = 8,
}: {
  w: string | number;
  h: string | number;
  r?: number;
}) {
  return (
    <div
      className="animate-pulse"
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: typeof h === "number" ? `${h}px` : h,
        borderRadius: r,
        background:
          "linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({
  score,
  loading,
}: {
  score: number;
  loading: boolean;
}) {
  const size = 160;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#252525"
          strokeWidth={stroke}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#C45B28"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={loading ? circumference : offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {loading ? (
          <Shimmer w={48} h={36} r={6} />
        ) : (
          <>
            <span
              className="text-4xl font-bold leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              {score}
            </span>
            <span
              className="text-xs mt-0.5"
              style={{ color: "#666", fontFamily: "var(--font-inter)" }}
            >
              /100
            </span>
            <span
              className="text-[9px] mt-1 font-semibold uppercase tracking-widest"
              style={{ color: "#555", fontFamily: "var(--font-inter)" }}
            >
              Daily Score
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Pillar Dots ──────────────────────────────────────────────────────────────

const PILLARS: { key: keyof PillarStatus; label: string; color: string }[] = [
  { key: "train", label: "Train", color: "#C45B28" },
  { key: "fuel", label: "Fuel", color: "#4CAF50" },
  { key: "mind", label: "Mind", color: "#1E3A5F" },
  { key: "lead", label: "Lead", color: "#E8E2D8" },
];

function PillarDots({
  status,
  loading,
}: {
  status: PillarStatus;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      {PILLARS.map(({ key, label, color }) => (
        <div key={key} className="flex flex-col items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full transition-colors duration-500"
            style={{
              backgroundColor:
                loading ? "#252525" : status[key] ? color : "#333",
            }}
          />
          <span
            className="text-[9px] font-medium uppercase tracking-wider"
            style={{
              color: loading ? "#333" : status[key] ? "#9A9A9A" : "#555",
              fontFamily: "var(--font-inter)",
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Today's Plan Row ─────────────────────────────────────────────────────────

function PlanItem({
  accent,
  label,
  detail,
  done,
  href,
  icon,
}: {
  accent: string;
  label: string;
  detail: string;
  done: boolean;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-3 transition-opacity active:opacity-70"
      style={{ textDecoration: "none" }}
    >
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: accent }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{
            color: done ? "#555" : "#9A9A9A",
            fontFamily: "var(--font-inter)",
          }}
        >
          {label}
        </p>
        <p
          className="text-sm font-medium mt-0.5 truncate"
          style={{
            color: done ? "#555" : "#E8E2D8",
            fontFamily: "var(--font-inter)",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {detail}
        </p>
      </div>
      <div
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
        style={{
          backgroundColor: done ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.05)",
          color: done ? "#4CAF50" : "#666",
        }}
      >
        {done ? (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          icon
        )}
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pillars, setPillars] = useState<PillarStatus>({
    train: false,
    fuel: false,
    mind: false,
    lead: false,
  });
  const [fuelCalories, setFuelCalories] = useState(0);
  const [fuelGoal, setFuelGoal] = useState(2000);
  const [streak, setStreak] = useState(0);
  const [streakDays, setStreakDays] = useState<boolean[]>(Array(7).fill(false));
  const [activeProgram, setActiveProgram] = useState<ActiveProgram | null>(
    null
  );

  const dailyScore =
    (pillars.train ? 40 : 0) +
    (pillars.fuel ? 15 : 0) +
    (pillars.mind ? 25 : 0) +
    (pillars.lead ? 20 : 0);

  const load = useCallback(async () => {
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
    const todayStr = todayStart.toISOString().slice(0, 10);

    const [
      profileRes,
      workoutsRes,
      moodsRes,
      mealsRes,
      leadRes,
      enrollmentsRes,
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
        .select("id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("meal_logs")
        .select("id, calories, date, logged_at")
        .eq("user_id", user.id)
        .eq("date", todayStr),
      supabase
        .from("leadership_completions")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", todayISO)
        .limit(1),
      supabase
        .from("program_enrollments")
        .select("program_slug, current_week, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1),
    ]);

    // Profile
    const p = profileRes.data as Profile | null;
    if (p) setProfile(p);

    // Pillar status
    const workoutDates = (workoutsRes.data ?? []).map((r) => r.created_at);
    const moodDates = (moodsRes.data ?? []).map((r) => r.created_at);
    const todayMeals = mealsRes.data ?? [];
    const todayCalories = todayMeals.reduce(
      (sum, m) => sum + (m.calories ?? 0),
      0
    );
    const calGoal = p?.nutrition_goals?.calories ?? 2000;

    setPillars({
      train: workoutDates.some((d) => d >= todayISO),
      fuel: todayCalories >= calGoal * 0.8,
      mind: moodDates.some((d) => d >= todayISO),
      lead: (leadRes.data ?? []).length > 0,
    });
    setFuelCalories(todayCalories);
    setFuelGoal(calGoal);

    // Streak
    const allDates = [...workoutDates, ...moodDates, ...(todayMeals).map((m) => m.logged_at)];
    setStreak(calcStreak(allDates));
    setStreakDays(weekDaysDone(allDates));

    // Active program
    if (enrollmentsRes.data && enrollmentsRes.data.length > 0) {
      const e = enrollmentsRes.data[0];
      const prog = getProgramBySlug(e.program_slug);
      if (prog) {
        const totalWeeks = prog.totalWeeks ?? null;
        if (totalWeeks == null || e.current_week <= totalWeeks) {
          setActiveProgram({
            slug: e.program_slug,
            name: prog.name,
            currentWeek: e.current_week,
            totalWeeks,
          });
        }
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Pull-to-refresh: re-fetch on visibilitychange
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-lg w-full mx-auto px-5 pt-14 pb-28 flex flex-col">
        {/* ─── 1. Header ──────────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-8">
          {loading ? (
            <Shimmer w={180} h={32} r={6} />
          ) : (
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-inter)", color: "#fff" }}
            >
              {greetingText()}
              {firstName ? `, ${firstName}` : ""}
            </h1>
          )}
          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center w-9 h-9"
            style={{ color: "#666" }}
            aria-label="Settings"
          >
            <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </header>

        {/* ─── 2. Daily Score Ring ─────────────────────────────────────── */}
        <section className="flex flex-col items-center mb-8">
          <ScoreRing score={dailyScore} loading={loading} />
          <PillarDots status={pillars} loading={loading} />
        </section>

        {/* ─── 3. Today's Plan ─────────────────────────────────────────── */}
        <section
          className="rounded-xl mb-6 overflow-hidden"
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
          }}
        >
          <div className="px-5 pt-5 pb-1">
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Today&apos;s Plan
            </h2>
          </div>
          <div className="px-5 pb-3 divide-y divide-[#252525]">
            {loading ? (
              <div className="flex flex-col gap-4 py-4">
                <Shimmer w="100%" h={44} />
                <Shimmer w="100%" h={44} />
                <Shimmer w="100%" h={44} />
                <Shimmer w="100%" h={44} />
              </div>
            ) : (
              <>
                <PlanItem
                  accent="#C45B28"
                  label="Train"
                  detail="Upper Body — 30 min"
                  done={pillars.train}
                  href="/dashboard/body"
                  icon={
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 12h14M8 7v10M16 7v10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                />
                <PlanItem
                  accent="#4CAF50"
                  label="Fuel"
                  detail={`${fuelCalories.toLocaleString()} / ${fuelGoal.toLocaleString()} cal`}
                  done={pillars.fuel}
                  href="/dashboard/nutrition"
                  icon={
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 2C8 6 7 9 9 12c-2-1-3-3-2-5C5 9 4 12 6 15c1 2 3 3 6 3s5-1 6-3c2-3 1-6-1-8-1 2-2 3-3 3 1-2 0-4-2-8z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                />
                <PlanItem
                  accent="#1E3A5F"
                  label="Mind"
                  detail={pillars.mind ? "Done" : "Rate your mood (30 sec)"}
                  done={pillars.mind}
                  href="/dashboard/mind"
                  icon={
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 4C8.5 4 6 6.5 6 10c0 2 1 3.5 2.5 4.5V17h7v-2.5C17 13.5 18 12 18 10c0-3.5-2.5-6-6-6z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                />
                <PlanItem
                  accent="#E8E2D8"
                  label="Lead"
                  detail={pillars.lead ? "Done" : "Today: Delegate one task"}
                  done={pillars.lead}
                  href="/dashboard/lead"
                  icon={
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 2L14.5 9H21L15.5 13.5L17.5 20.5L12 16L6.5 20.5L8.5 13.5L3 9H9.5L12 2Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                />
              </>
            )}
          </div>
        </section>

        {/* ─── 4. Active Program ───────────────────────────────────────── */}
        {!loading && activeProgram && (
          <section
            className="rounded-xl mb-6 px-5 py-4"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p
                  className="text-sm font-bold"
                  style={{
                    fontFamily: "var(--font-oswald)",
                    color: "#E8E2D8",
                  }}
                >
                  {activeProgram.name}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "#666", fontFamily: "var(--font-inter)" }}
                >
                  Week {activeProgram.currentWeek}
                  {activeProgram.totalWeeks
                    ? ` of ${activeProgram.totalWeeks}`
                    : ""}
                </p>
              </div>
              <Link
                href={`/dashboard/body/program/${activeProgram.slug}/week/${activeProgram.currentWeek}`}
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: "#C45B28",
                  color: "#fff",
                  fontFamily: "var(--font-inter)",
                  textDecoration: "none",
                }}
              >
                Continue
              </Link>
            </div>
            {activeProgram.totalWeeks && (
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "#252525" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (activeProgram.currentWeek / activeProgram.totalWeeks) *
                        100
                    )}%`,
                    backgroundColor: "#C45B28",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* ─── 5. Streak ──────────────────────────────────────────────── */}
        {!loading && (
          <section className="flex items-center gap-4 mb-2 px-1">
            <p
              className="text-sm font-medium"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              {streak > 0 ? `${streak} -day streak` : "Complete any pillar to start your streak"}
            </p>
            <div className="flex items-center gap-1.5">
              {streakDays.map((active, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: active ? "#C45B28" : "#252525",
                    transition: "background-color 0.3s ease",
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─── Coach FAB ──────────────────────────────────────────────── */}
      <Link
        href="/dashboard/coach"
        className="fixed flex items-center justify-center"
        style={{
          bottom: 84,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: "50%",
          backgroundColor: "#C45B28",
          boxShadow: "0 4px 20px rgba(196,91,40,0.4)",
          color: "#fff",
          zIndex: 30,
        }}
        aria-label="Coach"
      >
        <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
          <path
            d="M4 4h16c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1H8l-4 4V5c0-.55.45-1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <line
            x1="8"
            y1="9"
            x2="16"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="12"
            x2="13"
            y2="12"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </Link>

      {/* ─── Bottom Nav ─────────────────────────────────────────────── */}
      <BottomNav />

      {/* ─── Daily Check-in Modal ───────────────────────────────────── */}
      <DailyCheckinModal />
    </main>
  );
}
