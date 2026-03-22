"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const EXERCISES = [
  {
    name: "Push-Up to T-Rotation",
    muscles: "Chest · Shoulders · Obliques",
    sets: 4,
    reps: "12",
  },
  {
    name: "Pike Press",
    muscles: "Shoulders · Triceps · Upper Back",
    sets: 3,
    reps: "12",
  },
  {
    name: "Dips",
    muscles: "Triceps · Chest · Shoulders",
    sets: 3,
    reps: "10",
    note: "Use a chair or bench",
  },
  {
    name: "Plank to Shoulder Tap",
    muscles: "Core · Shoulders · Stability",
    sets: 3,
    reps: "45s",
  },
];

const PROGRAMS = [
  {
    title: "16-Week Foundation",
    description: "Build base strength and durability from the ground up.",
    weeks: 16,
    currentWeek: 5,
    active: true,
  },
  {
    title: "8-Week Kickstart",
    description: "A fast-track program for leaders short on time.",
    weeks: 8,
    currentWeek: 0,
    active: false,
  },
];

type WorkoutState = "idle" | "active" | "logged";

export default function BodyPage() {
  const [workoutState, setWorkoutState] = useState<WorkoutState>("idle");
  const [elapsed, setElapsed] = useState(0); // seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (workoutState === "active") {
      intervalRef.current = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [workoutState]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function handleComplete() {
    setWorkoutState("logged");
    const durationMinutes = Math.max(1, Math.round(elapsed / 60));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("workout_logs").insert({
        user_id: user.id,
        workout_name: "Upper Body Grind",
        exercises_completed: EXERCISES.length,
        duration_minutes: durationMinutes,
      });
    }
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
            style={{ border: "1px solid #2A2A2A", color: "#7A7268" }}
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
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
            >
              Pillar
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Body
            </h1>
          </div>
        </header>

        {/* Today's Workout card */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Today&apos;s Workout
          </p>

          <div style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}>
            {/* Card header */}
            <div
              className="px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{ borderBottom: "1px solid #1E1E1E" }}
            >
              <div>
                <h2
                  className="text-3xl font-bold uppercase"
                  style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                >
                  Upper Body Grind
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm" style={{ color: "#7A7268" }}>
                    30 min
                  </span>
                  <span style={{ color: "#2A2A2A" }}>·</span>
                  <span className="text-sm" style={{ color: "#7A7268" }}>
                    No equipment needed
                  </span>
                </div>
              </div>
              <div
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1 self-start sm:self-auto"
                style={{
                  color: "#C45B28",
                  border: "1px solid #C45B28",
                  fontFamily: "var(--font-oswald)",
                }}
              >
                Bodyweight
              </div>
            </div>

            {/* Exercise list */}
            <div className="divide-y" style={{ borderColor: "#1A1A1A" }}>
              {EXERCISES.map((ex, i) => (
                <div
                  key={ex.name}
                  className="px-8 py-5 flex items-start gap-5"
                >
                  {/* Index */}
                  <span
                    className="text-xs font-bold mt-0.5 w-5 shrink-0 text-right"
                    style={{ color: "#3A3A3A", fontFamily: "var(--font-oswald)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Name + muscles */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-base font-semibold"
                      style={{ color: "#E8E2D8" }}
                    >
                      {ex.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#7A7268" }}>
                      {ex.muscles}
                    </p>
                    {ex.note && (
                      <p className="text-xs mt-1 italic" style={{ color: "#5A5248" }}>
                        {ex.note}
                      </p>
                    )}
                  </div>

                  {/* Sets × reps */}
                  <div className="text-right shrink-0">
                    <p
                      className="text-lg font-bold"
                      style={{
                        fontFamily: "var(--font-oswald)",
                        color: "#C45B28",
                      }}
                    >
                      {ex.sets}×{ex.reps}
                    </p>
                    <p className="text-xs" style={{ color: "#5A5248" }}>
                      sets × reps
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Workout footer */}
            <div className="px-8 py-6 flex flex-col gap-4" style={{ borderTop: "1px solid #1E1E1E" }}>
              {workoutState === "idle" && (
                <button
                  onClick={() => { setElapsed(0); setWorkoutState("active"); }}
                  className="w-full py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.99]"
                  style={{
                    fontFamily: "var(--font-oswald)",
                    backgroundColor: "#C45B28",
                    color: "#0A0A0A",
                  }}
                >
                  Start Workout
                </button>
              )}

              {workoutState === "active" && (
                <>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "#7A7268", fontFamily: "var(--font-oswald)" }}
                    >
                      Elapsed
                    </span>
                    <span
                      className="text-4xl font-bold tabular-nums"
                      style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
                    >
                      {formatTime(elapsed)}
                    </span>
                  </div>
                  <button
                    onClick={handleComplete}
                    className="w-full py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.99]"
                    style={{
                      fontFamily: "var(--font-oswald)",
                      backgroundColor: "#C45B28",
                      color: "#0A0A0A",
                    }}
                  >
                    Complete Workout
                  </button>
                </>
              )}

              {workoutState === "logged" && (
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#4CAF50", fontFamily: "var(--font-oswald)" }}
                  >
                    ✓ Workout Logged
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "#5A5248" }}
                  >
                    {formatTime(elapsed)} · {EXERCISES.length} exercises
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Programs */}
        <section className="pb-28">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Programs
          </p>
          <div className="flex flex-col gap-4">
            {PROGRAMS.map((program) => (
              <ProgramCard key={program.title} {...program} />
            ))}
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}

function ProgramCard({
  title,
  description,
  weeks,
  currentWeek,
  active,
}: {
  title: string;
  description: string;
  weeks: number;
  currentWeek: number;
  active: boolean;
}) {
  const progress = active ? Math.round((currentWeek / weeks) * 100) : 0;

  return (
    <button
      className="text-left px-8 py-6 flex flex-col gap-4 transition-all duration-150 active:scale-[0.99] w-full"
      style={{
        backgroundColor: active ? "#131313" : "#0E0E0E",
        border: `1px solid ${active ? "#C45B28" : "#1E1E1E"}`,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.borderColor = "#3A3A3A";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.borderColor = "#1E1E1E";
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3
              className="text-xl font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              {title}
            </h3>
            {active && (
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
                style={{
                  backgroundColor: "#1E0E06",
                  color: "#C45B28",
                  fontFamily: "var(--font-oswald)",
                }}
              >
                Current
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: "#7A7268" }}>
            {description}
          </p>
        </div>
        <p
          className="text-sm font-semibold shrink-0"
          style={{ color: "#3A3A3A", fontFamily: "var(--font-oswald)" }}
        >
          {weeks}W
        </p>
      </div>

      {active && (
        <div>
          <div className="flex justify-between text-xs mb-2" style={{ color: "#5A5248" }}>
            <span>Week {currentWeek} of {weeks}</span>
            <span>{progress}%</span>
          </div>
          <div
            className="w-full h-1"
            style={{ backgroundColor: "#1E1E1E" }}
          >
            <div
              className="h-1 transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: "#C45B28" }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
