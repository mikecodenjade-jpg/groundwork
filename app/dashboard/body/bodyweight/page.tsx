"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const EXERCISES = [
  { name: "Push-Up", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "15" },
  { name: "Air Squat", muscles: "Quads · Glutes · Hamstrings", sets: 4, reps: "20" },
  { name: "Burpee", muscles: "Full body · Conditioning", sets: 3, reps: "10" },
  { name: "Plank Hold", muscles: "Core · Shoulders · Stability", sets: 3, reps: "45s" },
  { name: "Reverse Lunge", muscles: "Quads · Glutes · Balance", sets: 3, reps: "12 each leg" },
];

const PROGRAMS = [
  {
    title: "30-Day No Equipment Challenge",
    duration: "4 Weeks",
    difficulty: "Beginner",
    desc: "A full-body program built entirely on bodyweight. No gym, no gear, no excuses. Start from zero and build real strength in 30 days.",
  },
  {
    title: "Hotel Room Series",
    duration: "Ongoing",
    difficulty: "Any Level",
    desc: "15-20 minute workouts designed for the space you have — a hotel room, a break room, a parking lot. Built for the guy who travels for work and still wants to stay sharp.",
  },
  {
    title: "Jobsite Strong",
    duration: "6 Weeks",
    difficulty: "Intermediate",
    desc: "Functional movements you can run on a break or after a shift. Designed around the physical demands of construction — durability, not just fitness.",
  },
];

type WorkoutState = "idle" | "active" | "logged";

export default function BodyweightPage() {
  const [workoutState, setWorkoutState] = useState<WorkoutState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (workoutState === "active") {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [workoutState]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function handleComplete() {
    setWorkoutState("logged");
    const durationMinutes = Math.max(1, Math.round(elapsed / 60));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("workout_logs").insert({
        user_id: user.id,
        workout_name: "Bodyweight Foundation",
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
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-12 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/body"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #2A2A2A", color: "#7A7268" }}
            aria-label="Back to Body"
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
              Body
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Bodyweight
            </h1>
          </div>
        </header>

        {/* Today's Workout */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Today&apos;s Workout
          </p>

          <div style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}>
            <div
              className="px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{ borderBottom: "1px solid #1E1E1E" }}
            >
              <div>
                <h2
                  className="text-3xl font-bold uppercase"
                  style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                >
                  Bodyweight Foundation
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm" style={{ color: "#7A7268" }}>30 min</span>
                  <span style={{ color: "#2A2A2A" }}>·</span>
                  <span className="text-sm" style={{ color: "#7A7268" }}>No equipment needed</span>
                </div>
              </div>
              <div
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1 self-start sm:self-auto"
                style={{ color: "#C45B28", border: "1px solid #C45B28", fontFamily: "var(--font-oswald)" }}
              >
                Bodyweight
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: "#1A1A1A" }}>
              {EXERCISES.map((ex, i) => (
                <div key={ex.name} className="px-8 py-5 flex items-start gap-5">
                  <span
                    className="text-xs font-bold mt-0.5 w-5 shrink-0 text-right"
                    style={{ color: "#3A3A3A", fontFamily: "var(--font-oswald)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold" style={{ color: "#E8E2D8" }}>
                      {ex.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#7A7268" }}>{ex.muscles}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-lg font-bold"
                      style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
                    >
                      {ex.sets}&times;{ex.reps}
                    </p>
                    <p className="text-xs" style={{ color: "#5A5248" }}>sets &times; reps</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-8 py-6 flex flex-col gap-4" style={{ borderTop: "1px solid #1E1E1E" }}>
              {workoutState === "idle" && (
                <button
                  onClick={() => { setElapsed(0); setWorkoutState("active"); }}
                  className="w-full py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.99]"
                  style={{ fontFamily: "var(--font-oswald)", backgroundColor: "#C45B28", color: "#0A0A0A" }}
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
                    style={{ fontFamily: "var(--font-oswald)", backgroundColor: "#C45B28", color: "#0A0A0A" }}
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
                    Workout Logged
                  </span>
                  <span className="text-sm" style={{ color: "#5A5248" }}>
                    {formatTime(elapsed)} · {EXERCISES.length} exercises
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Programs */}
        <section>
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
  duration,
  difficulty,
  desc,
}: {
  title: string;
  duration: string;
  difficulty: string;
  desc: string;
}) {
  const [started, setStarted] = useState(false);

  return (
    <div
      className="px-8 py-6 flex flex-col gap-4"
      style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <h3
            className="text-xl font-bold uppercase"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            {title}
          </h3>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
              style={{ color: "#7A7268", border: "1px solid #2A2A2A", fontFamily: "var(--font-oswald)" }}
            >
              {duration}
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
              style={{ color: "#7A7268", border: "1px solid #2A2A2A", fontFamily: "var(--font-oswald)" }}
            >
              {difficulty}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>{desc}</p>

      <button
        onClick={() => setStarted(!started)}
        className="self-start px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
        style={{
          fontFamily: "var(--font-oswald)",
          backgroundColor: started ? "#0E0E0E" : "#C45B28",
          color: started ? "#C45B28" : "#0A0A0A",
          border: started ? "1px solid #C45B28" : "1px solid transparent",
        }}
      >
        {started ? "Program Started" : "Start Program"}
      </button>
    </div>
  );
}
