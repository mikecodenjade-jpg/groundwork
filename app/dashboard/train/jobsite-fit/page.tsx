"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { WORKOUTS, type Workout } from "./workouts";

const DIFFICULTY_COLOR: Record<Workout["difficulty"], string> = {
  Easy: "#22c55e",
  Medium: "#f97316",
  Hard: "#ef4444",
};

function formatDuration(min: number) {
  return min < 60 ? `${min} min` : `${min / 60} hr`;
}

export default function JobsiteFitPage() {
  const router = useRouter();
  const [completions, setCompletions] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gw-cache:jobsite-fit-completions");
      if (raw) setCompletions(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col pb-28"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-6 px-6 py-10">

        {/* Header */}
        <header className="flex items-center gap-5">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60 flex-shrink-0"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "4px", background: "none" }}
            aria-label="Back"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Train
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Jobsite Fit
            </h1>
          </div>
        </header>

        {/* Intro */}
        <div
          className="px-5 py-4"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            5–15 minute bodyweight workouts designed for your schedule. No equipment needed.
            Audio cues guide you through every exercise — just press play.
          </p>
        </div>

        {/* Workout cards */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            6 Workouts
          </p>
          <div className="flex flex-col gap-3">
            {WORKOUTS.map((workout) => {
              const done = Boolean(completions[workout.id]);
              return (
                <Link
                  key={workout.id}
                  href={`/dashboard/train/jobsite-fit/${workout.id}`}
                  className="block card-hover"
                  style={{
                    backgroundColor: "#161616",
                    border: `1px solid ${done ? "#1a3a1a" : "#252525"}`,
                    borderRadius: "12px",
                    textDecoration: "none",
                  }}
                >
                  <div className="px-6 py-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2
                        className="text-base font-bold uppercase leading-tight"
                        style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                      >
                        {workout.title}
                      </h2>
                      {done && (
                        <span
                          className="flex items-center gap-1 text-xs font-semibold flex-shrink-0"
                          style={{ color: "#22c55e", fontFamily: "var(--font-inter)" }}
                        >
                          <svg viewBox="0 0 16 16" fill="none" width={14} height={14}>
                            <circle cx="8" cy="8" r="7" fill="#22c55e" fillOpacity="0.15" />
                            <path d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Done
                        </span>
                      )}
                    </div>

                    {/* Pills */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                      >
                        {formatDuration(workout.duration)}
                      </span>
                      <span style={{ color: "#333" }}>·</span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: DIFFICULTY_COLOR[workout.difficulty], fontFamily: "var(--font-inter)" }}
                      >
                        {workout.difficulty}
                      </span>
                      <span style={{ color: "#333" }}>·</span>
                      <span
                        className="text-xs"
                        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                      >
                        {workout.targetArea}
                      </span>
                    </div>

                    {/* Description + arrow */}
                    <div className="flex items-end justify-between gap-3">
                      <p
                        className="text-sm leading-relaxed flex-1"
                        style={{ color: "#6B6B6B", fontFamily: "var(--font-inter)" }}
                      >
                        {workout.description}
                      </p>
                      <span
                        className="flex-shrink-0 text-lg"
                        style={{ color: "#C45B28" }}
                        aria-hidden
                      >
                        ›
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Footer note */}
        <p
          className="text-xs text-center pb-2"
          style={{ color: "#444", fontFamily: "var(--font-inter)" }}
        >
          Audio requires device volume on. Completions saved locally.
        </p>

      </div>

      <BottomNav />
    </main>
  );
}
