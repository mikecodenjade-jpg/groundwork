"use client";

import Link from "next/link";
import { use, useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Content data ────────────────────────────────────────────────────────────

type Exercise = {
  name: string;
  muscles: string;
  sets: number;
  reps: string;
  note?: string;
};

type Program = {
  title: string;
  description: string;
  weeks: number;
};

type CategoryData = {
  title: string;
  workoutTitle: string;
  duration: string;
  equipment: string;
  exercises: Exercise[];
  programs: Program[];
};

const CATEGORY_DATA: Record<string, CategoryData> = {
  running: {
    title: "Running",
    workoutTitle: "Speed & Base Builder",
    duration: "40 min",
    equipment: "Shoes and open road",
    exercises: [
      { name: "Easy Warm-Up Jog", muscles: "Full body activation", sets: 1, reps: "10 min", note: "Conversational pace" },
      { name: "Stride Intervals", muscles: "Quads · Glutes · Calves", sets: 6, reps: "30s on / 90s off", note: "80% effort" },
      { name: "Tempo Run", muscles: "Cardiovascular · Legs", sets: 1, reps: "15 min", note: "Comfortably hard pace" },
      { name: "Hill Repeats", muscles: "Glutes · Hamstrings · Calves", sets: 4, reps: "60s uphill" },
      { name: "Cool-Down Walk", muscles: "Full body", sets: 1, reps: "5 min" },
    ],
    programs: [
      { title: "12-Week Base Build", description: "Build aerobic capacity from the ground up — zero to 30+ miles per week.", weeks: 12 },
      { title: "8-Week Speed Focus", description: "Increase your VO2 max and race pace with structured interval training.", weeks: 8 },
    ],
  },
  weightlifting: {
    title: "Weightlifting",
    workoutTitle: "Heavy Pull Day",
    duration: "50 min",
    equipment: "Barbell, rack, plates",
    exercises: [
      { name: "Deadlift", muscles: "Posterior chain · Traps · Core", sets: 4, reps: "5", note: "Work up to a heavy set of 5" },
      { name: "Barbell Row", muscles: "Lats · Rhomboids · Biceps", sets: 4, reps: "6" },
      { name: "Romanian Deadlift", muscles: "Hamstrings · Glutes · Lower back", sets: 3, reps: "8" },
      { name: "Pull-Ups", muscles: "Lats · Biceps · Rear delts", sets: 4, reps: "Max" },
      { name: "Face Pulls", muscles: "Rear delts · Rotator cuff", sets: 3, reps: "15" },
    ],
    programs: [
      { title: "16-Week Powerlifting Foundation", description: "Build a strong base in squat, bench, and deadlift using linear progression.", weeks: 16 },
      { title: "8-Week Strength Peaking", description: "Peak your strength for a max effort test or competition.", weeks: 8 },
    ],
  },
  bodybuilding: {
    title: "Bodybuilding",
    workoutTitle: "Chest & Triceps Hypertrophy",
    duration: "55 min",
    equipment: "Dumbbells, cables, bench",
    exercises: [
      { name: "Incline Dumbbell Press", muscles: "Upper chest · Anterior delt", sets: 4, reps: "10-12" },
      { name: "Cable Fly", muscles: "Chest · Serratus", sets: 3, reps: "15", note: "Full stretch at bottom" },
      { name: "Flat Bench Press", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "8-10" },
      { name: "Overhead Tricep Extension", muscles: "Long head tricep", sets: 3, reps: "12" },
      { name: "Tricep Pushdown", muscles: "Lateral & medial tricep head", sets: 3, reps: "15-20" },
    ],
    programs: [
      { title: "12-Week Hypertrophy Split", description: "A push/pull/legs program designed to maximize muscle growth.", weeks: 12 },
      { title: "16-Week Physique Build", description: "Full body recomposition with progressive overload and nutrition focus.", weeks: 16 },
    ],
  },
  "hybrid-functional": {
    title: "Hybrid / Functional",
    workoutTitle: "Full-Body Circuit",
    duration: "35 min",
    equipment: "Minimal — box, pull-up bar optional",
    exercises: [
      { name: "Kettlebell Swing", muscles: "Posterior chain · Core", sets: 4, reps: "20", note: "Hip hinge, not squat" },
      { name: "Burpee to Box Jump", muscles: "Full body · Power", sets: 4, reps: "8" },
      { name: "Dumbbell Thruster", muscles: "Legs · Shoulders · Core", sets: 3, reps: "12" },
      { name: "Farmer Carry", muscles: "Grip · Traps · Core · Legs", sets: 3, reps: "40 meters" },
      { name: "Battle Ropes", muscles: "Shoulders · Core · Conditioning", sets: 4, reps: "30s" },
    ],
    programs: [
      { title: "8-Week Conditioning Block", description: "Build work capacity and GPP with daily mixed-modal training.", weeks: 8 },
      { title: "12-Week Hybrid Athlete", description: "Combine strength training with aerobic conditioning for total fitness.", weeks: 12 },
    ],
  },
  calisthenics: {
    title: "Calisthenics",
    workoutTitle: "Upper Body Grind",
    duration: "40 min",
    equipment: "Pull-up bar, parallel bars",
    exercises: [
      { name: "Pull-Up", muscles: "Lats · Biceps · Rear delts", sets: 5, reps: "Max", note: "Full range of motion" },
      { name: "Pike Press", muscles: "Shoulders · Triceps", sets: 4, reps: "10" },
      { name: "Dips", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "12", note: "Chair or parallel bars" },
      { name: "Push-Up to T-Rotation", muscles: "Chest · Shoulders · Obliques", sets: 4, reps: "10 each side" },
      { name: "Plank to Shoulder Tap", muscles: "Core · Stability", sets: 3, reps: "45s" },
    ],
    programs: [
      { title: "10-Week Pull-Up Progression", description: "Go from 0 to 15+ pull-ups with structured negatives and volume work.", weeks: 10 },
      { title: "12-Week Skill Unlock", description: "Build toward muscle-ups, L-sits, and handstand progressions.", weeks: 12 },
    ],
  },
  "mobility-recovery": {
    title: "Mobility & Recovery",
    workoutTitle: "Full-Body Reset",
    duration: "30 min",
    equipment: "Mat, foam roller",
    exercises: [
      { name: "Foam Roll — Thoracic Spine", muscles: "Upper back · Erectors", sets: 1, reps: "90s", note: "Pause on tight spots" },
      { name: "90/90 Hip Stretch", muscles: "Hip flexors · External rotators", sets: 3, reps: "60s each side" },
      { name: "World's Greatest Stretch", muscles: "Hips · Thoracic · Hamstrings", sets: 3, reps: "5 each side" },
      { name: "Dead Hang", muscles: "Shoulders · Lats · Grip", sets: 3, reps: "30-45s", note: "Full passive hang" },
      { name: "Diaphragmatic Breathing", muscles: "Nervous system reset", sets: 1, reps: "5 min", note: "4-count inhale, 8-count exhale" },
    ],
    programs: [
      { title: "4-Week Daily Mobility", description: "A daily 20-minute protocol to restore range of motion and reduce pain.", weeks: 4 },
      { title: "8-Week Recovery Focus", description: "Structured deload and tissue work for athletes coming off hard blocks.", weeks: 8 },
    ],
  },
  rucking: {
    title: "Rucking",
    workoutTitle: "Weighted Endurance Walk",
    duration: "60 min",
    equipment: "Rucksack — 20-35 lbs recommended",
    exercises: [
      { name: "Ruck March", muscles: "Legs · Core · Cardiovascular", sets: 1, reps: "4 miles", note: "15-18 min/mile pace" },
      { name: "Weighted Step-Ups", muscles: "Glutes · Quads · Balance", sets: 3, reps: "12 each leg", note: "Use a bench or curb" },
      { name: "Bodyweight Squat", muscles: "Quads · Glutes · Hamstrings", sets: 3, reps: "20" },
      { name: "Overhead Ruck Press", muscles: "Shoulders · Triceps · Core", sets: 3, reps: "15", note: "Press the ruck overhead" },
      { name: "Calf Raises", muscles: "Calves · Ankle stability", sets: 3, reps: "25" },
    ],
    programs: [
      { title: "8-Week Ruck Base", description: "Build the capacity to ruck 4+ miles with 35 lbs without breaking down.", weeks: 8 },
      { title: "12-Week GoRuck Prep", description: "Full preparation for a GoRuck or military-style endurance event.", weeks: 12 },
    ],
  },
  "combat-martial-arts": {
    title: "Combat / Martial Arts",
    workoutTitle: "Boxing Conditioning",
    duration: "45 min",
    equipment: "Bag, wraps, timer",
    exercises: [
      { name: "Jump Rope", muscles: "Calves · Coordination · Cardio", sets: 3, reps: "3 min", note: "1 min rest between rounds" },
      { name: "Heavy Bag — Combination Work", muscles: "Shoulders · Core · Cardio", sets: 6, reps: "3 min rounds", note: "Rest 60s between rounds" },
      { name: "Shadow Boxing", muscles: "Shoulders · Core · Footwork", sets: 3, reps: "3 min" },
      { name: "Sprawl to Base", muscles: "Hips · Core · Explosiveness", sets: 4, reps: "10" },
      { name: "Plank Hold", muscles: "Core · Shoulder stability", sets: 3, reps: "60s" },
    ],
    programs: [
      { title: "8-Week Fighter Conditioning", description: "Build the gas tank and work capacity needed for 3-5 round fights.", weeks: 8 },
      { title: "12-Week Boxing Foundation", description: "Technique, conditioning, and strength for beginner to intermediate fighters.", weeks: 12 },
    ],
  },
};

const FALLBACK: CategoryData = {
  title: "Workout",
  workoutTitle: "General Fitness",
  duration: "30 min",
  equipment: "Minimal",
  exercises: [
    { name: "Push-Up", muscles: "Chest · Triceps · Shoulders", sets: 3, reps: "15" },
    { name: "Squat", muscles: "Quads · Glutes · Hamstrings", sets: 3, reps: "20" },
    { name: "Plank", muscles: "Core", sets: 3, reps: "45s" },
    { name: "Jumping Jacks", muscles: "Full body", sets: 3, reps: "30" },
  ],
  programs: [
    { title: "8-Week General Fitness", description: "Build a foundation of strength and conditioning.", weeks: 8 },
    { title: "12-Week Total Body", description: "Full-body training for health and longevity.", weeks: 12 },
  ],
};

// ─── Timer logic ─────────────────────────────────────────────────────────────

type WorkoutState = "idle" | "active" | "logged";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = use(params);
  const data = CATEGORY_DATA[category] ?? FALLBACK;

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
        workout_name: data.workoutTitle,
        exercises_completed: data.exercises.length,
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
              {data.title}
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
                  {data.workoutTitle}
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm" style={{ color: "#7A7268" }}>{data.duration}</span>
                  <span style={{ color: "#2A2A2A" }}>·</span>
                  <span className="text-sm" style={{ color: "#7A7268" }}>{data.equipment}</span>
                </div>
              </div>
              <div
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1 self-start sm:self-auto"
                style={{ color: "#C45B28", border: "1px solid #C45B28", fontFamily: "var(--font-oswald)" }}
              >
                {data.title}
              </div>
            </div>

            {/* Exercise list */}
            <div className="divide-y" style={{ borderColor: "#1A1A1A" }}>
              {data.exercises.map((ex, i) => (
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
                    <p className="text-xs mt-0.5" style={{ color: "#7A7268" }}>
                      {ex.muscles}
                    </p>
                    {ex.note && (
                      <p className="text-xs mt-1 italic" style={{ color: "#5A5248" }}>
                        {ex.note}
                      </p>
                    )}
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

            {/* Workout footer */}
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
                    {formatTime(elapsed)} · {data.exercises.length} exercises
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
            {data.programs.map((program, i) => (
              <div
                key={program.title}
                className="px-8 py-6 flex flex-col gap-3"
                style={{
                  backgroundColor: i === 0 ? "#131313" : "#0E0E0E",
                  border: `1px solid ${i === 0 ? "#C45B28" : "#1E1E1E"}`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3
                      className="text-xl font-bold uppercase"
                      style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                    >
                      {program.title}
                    </h3>
                    {i === 0 && (
                      <span
                        className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
                        style={{ backgroundColor: "#1E0E06", color: "#C45B28", fontFamily: "var(--font-oswald)" }}
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                  <span
                    className="text-sm font-semibold shrink-0"
                    style={{ color: "#3A3A3A", fontFamily: "var(--font-oswald)" }}
                  >
                    {program.weeks}W
                  </span>
                </div>
                <p className="text-sm" style={{ color: "#7A7268" }}>{program.description}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}
