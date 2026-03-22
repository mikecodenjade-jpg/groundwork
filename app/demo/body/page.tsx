"use client";

import Link from "next/link";
import { useState } from "react";
import DemoBanner from "@/components/DemoBanner";

const TIME_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
];

const CATEGORIES = [
  { slug: "running", title: "Running", desc: "Endurance, speed work, and trail conditioning." },
  { slug: "weightlifting", title: "Weightlifting", desc: "Strength, powerlifting, and Olympic lifts." },
  { slug: "bodybuilding", title: "Bodybuilding", desc: "Hypertrophy, aesthetics, and muscle-building splits." },
  { slug: "hybrid-functional", title: "Hybrid / Functional", desc: "CrossFit-style circuits, HIIT, and mixed conditioning." },
  { slug: "calisthenics", title: "Calisthenics", desc: "Bodyweight progressions, skills, and relative strength." },
  { slug: "mobility-recovery", title: "Mobility & Recovery", desc: "Stretching, yoga flows, and foam rolling protocols." },
  { slug: "bodyweight", title: "Bodyweight", desc: "No equipment needed. Train anywhere — hotel, jobsite, home." },
  { slug: "rucking", title: "Rucking", desc: "Weighted walks and military-style endurance training." },
];

// Sample workout for the preview modal
const SAMPLE_WORKOUT = {
  exercises: [
    { name: "Push-Up", sets: 4, reps: "15 reps", muscles: "Chest · Triceps · Shoulders" },
    { name: "Air Squat", sets: 4, reps: "20 reps", muscles: "Quads · Glutes · Hamstrings" },
    { name: "Plank Hold", sets: 3, reps: "45 sec", muscles: "Core · Shoulders" },
    { name: "Reverse Lunge", sets: 3, reps: "12 each leg", muscles: "Glutes · Quads" },
    { name: "Burpee", sets: 3, reps: "10 reps", muscles: "Full Body" },
  ],
  restNote: "60 sec rest between sets",
};

export default function DemoBodyPage() {
  const [selectedTime, setSelectedTime] = useState<number | null>(30);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  const previewCat = CATEGORIES.find((c) => c.slug === previewSlug);

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <DemoBanner />

      <div className="px-6 py-10">
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-16">

          {/* Header */}
          <header className="flex items-center gap-5">
            <Link
              href="/demo"
              className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
              style={{ border: "1px solid #252525", borderRadius: "8px", color: "#9A9A9A" }}
              aria-label="Back to demo dashboard"
            >
              <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
                <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
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

          {/* Time selector */}
          <section>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              How much time do you have?
            </p>
            <div className="flex flex-wrap gap-3">
              {TIME_OPTIONS.map(({ label, value }) => {
                const active = selectedTime === value;
                return (
                  <button
                    key={value}
                    onClick={() => setSelectedTime(active ? null : value)}
                    className="px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontWeight: 600,
                      backgroundColor: active ? "#C45B28" : "#161616",
                      color: active ? "#0A0A0A" : "#E8E2D8",
                      border: `1px solid ${active ? "#C45B28" : "#252525"}`,
                      borderRadius: "8px",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <div>
            <h2
              className="text-2xl font-bold uppercase mb-1"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              Choose Your Discipline.
            </h2>
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Pick the training style that fits where you are today.
            </p>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => (
              <DemoCategoryCard
                key={cat.slug}
                {...cat}
                onClick={() => setPreviewSlug(cat.slug)}
              />
            ))}
          </div>

          {/* Workout preview modal */}
          {previewSlug && previewCat && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
              style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
              onClick={() => setPreviewSlug(null)}
            >
              <div
                className="w-full max-w-lg flex flex-col gap-6 px-8 py-8 relative"
                style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                      style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                    >
                      Sample Workout · {selectedTime ?? 30} min
                    </p>
                    <h3
                      className="text-2xl font-bold uppercase"
                      style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                    >
                      {previewCat.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setPreviewSlug(null)}
                    className="text-lg leading-none transition-opacity hover:opacity-60"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {SAMPLE_WORKOUT.exercises.slice(0, selectedTime === 15 ? 3 : selectedTime === 60 ? 5 : 4).map((ex) => (
                    <div
                      key={ex.name}
                      className="px-5 py-4 flex items-center justify-between"
                      style={{ backgroundColor: "#111111", border: "1px solid #252525", borderRadius: "8px" }}
                    >
                      <div>
                        <p className="text-sm font-bold uppercase" style={{ fontFamily: "var(--font-inter)", fontWeight: 600, color: "#E8E2D8" }}>
                          {ex.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{ex.muscles}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                          {ex.sets} × {ex.reps}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{SAMPLE_WORKOUT.restNote}</p>

                <Link
                  href="/login"
                  className="w-full py-4 text-sm font-bold uppercase tracking-widest text-center transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "#C45B28",
                    color: "#0A0A0A",
                    borderRadius: "8px",
                    fontFamily: "var(--font-inter)",
                    fontWeight: 600,
                    minHeight: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Sign Up to Start This Workout
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

function DemoCategoryCard({
  title,
  desc,
  onClick,
}: {
  slug: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 px-7 py-6 text-left transition-all duration-150 active:scale-[0.98]"
      style={{
        backgroundColor: "#161616",
        border: `1px solid ${hovered ? "#C45B28" : "#252525"}`,
        borderRadius: "12px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h3
        className="text-xl font-bold uppercase tracking-wide"
        style={{ fontFamily: "var(--font-inter)", fontWeight: 600, color: "#E8E2D8" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
        {desc}
      </p>
      <span
        className="text-xs font-semibold uppercase tracking-widest mt-1 self-start"
        style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
      >
        Preview Workout &rsaquo;
      </span>
    </button>
  );
}
