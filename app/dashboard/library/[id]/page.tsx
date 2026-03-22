"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { EXERCISES, type Exercise } from "@/lib/exercises";

const REMOTE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#4CAF50",
  intermediate: "#FF9800",
  expert: "#F44336",
};

function cap(s: string) {
  if (!s) return "N/A";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params?.id ?? "");

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Check local data immediately
    const local = EXERCISES.find((e) => e.id === id);
    if (local) {
      setExercise(local);
      setLoading(false);
      // Still try remote in background to get images
      fetch(REMOTE_URL)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: Exercise[] | null) => {
          if (!data) return;
          const remote = data.find((e) => e.id === id);
          if (remote) setExercise(remote);
        })
        .catch(() => {});
      return;
    }

    // Not in local db — try remote (e.g. user arrived via deep link from full remote db)
    fetch(REMOTE_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Exercise[]) => {
        const found = data.find((e) => e.id === id);
        if (!found) throw new Error("Exercise not found");
        setExercise(found);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const levelColor = exercise ? (LEVEL_COLORS[exercise.level] ?? "#9A9A9A") : "#9A9A9A";

  return (
    <main
      className="min-h-screen flex flex-col px-4 py-8"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-6 pb-28">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="flex items-center gap-4">
          <Link
            href="/dashboard/library"
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "6px" }}
            aria-label="Back to library"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Exercise Library
          </p>
        </header>

        {/* ── Loading Skeleton ───────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col gap-4">
            <div className="h-10 w-3/4 animate-pulse rounded-lg" style={{ backgroundColor: "#161616" }} />
            <div className="h-48 animate-pulse rounded-xl" style={{ backgroundColor: "#161616" }} />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "#161616" }} />
              <div className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "#161616" }} />
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded" style={{ backgroundColor: "#161616", width: `${85 - i * 8}%` }} />
            ))}
          </div>
        )}

        {/* ── Not found ─────────────────────────────────────────────── */}
        {!loading && !exercise && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Exercise not found.{" "}
              <Link href="/dashboard/library" style={{ color: "#C45B28" }}>
                Back to library
              </Link>
            </p>
          </div>
        )}

        {/* ── Exercise Detail ────────────────────────────────────────── */}
        {exercise && !loading && (
          <>
            {/* Title + badges */}
            <div className="flex flex-col gap-3">
              <h1
                className="text-3xl font-bold uppercase leading-tight"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                {exercise.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${levelColor}18`,
                    color: levelColor,
                    border: `1px solid ${levelColor}40`,
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {exercise.level}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(196,91,40,0.12)",
                    color: "#C45B28",
                    border: "1px solid rgba(196,91,40,0.3)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {exercise.category}
                </span>
              </div>
            </div>

            {/* Images */}
            {exercise.images.length > 0 && (
              <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
                {exercise.images.map((img, idx) => {
                  if (imgErrors.has(img)) return null;
                  const src = `${IMAGE_BASE}/${exercise.id}/images/${img}`;
                  return (
                    <div
                      key={idx}
                      className="flex-shrink-0 overflow-hidden rounded-xl"
                      style={{
                        width: "220px",
                        height: "160px",
                        backgroundColor: "#161616",
                        border: "1px solid #252525",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${exercise.name} step ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={() =>
                          setImgErrors((prev) => new Set([...prev, img]))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3">
              <DetailCell label="Equipment" value={cap(exercise.equipment)} />
              {exercise.force && (
                <DetailCell label="Force" value={cap(exercise.force)} />
              )}
              {exercise.mechanic && (
                <DetailCell label="Mechanic" value={cap(exercise.mechanic)} />
              )}
            </div>

            {/* Muscles */}
            <div
              className="p-4 rounded-xl flex flex-col gap-4"
              style={{ backgroundColor: "#161616", border: "1px solid #252525" }}
            >
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2.5"
                  style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                >
                  Primary Muscles
                </p>
                <div className="flex flex-wrap gap-2">
                  {exercise.primaryMuscles.map((m) => (
                    <span
                      key={m}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: "rgba(196,91,40,0.12)",
                        color: "#C45B28",
                        border: "1px solid rgba(196,91,40,0.25)",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {cap(m)}
                    </span>
                  ))}
                </div>
              </div>

              {exercise.secondaryMuscles.length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2.5"
                    style={{ color: "#555", fontFamily: "var(--font-inter)" }}
                  >
                    Secondary Muscles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.secondaryMuscles.map((m) => (
                      <span
                        key={m}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: "#1C1C1C",
                          color: "#9A9A9A",
                          border: "1px solid #2A2A2A",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {cap(m)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            {exercise.instructions.length > 0 && (
              <div className="flex flex-col gap-4">
                <p
                  className="text-xs font-semibold uppercase tracking-[0.25em]"
                  style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                >
                  Instructions
                </p>
                <ol className="flex flex-col gap-4">
                  {exercise.instructions.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                        style={{
                          backgroundColor: "#1A1A1A",
                          color: "#C45B28",
                          border: "1px solid #2A2A2A",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <p
                        className="text-sm leading-relaxed flex-1"
                        style={{ color: "#BDBDBD", fontFamily: "var(--font-inter)" }}
                      >
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Add to Workout */}
            <button
              onClick={() => setAdded(true)}
              className="w-full py-4 font-bold uppercase tracking-wider text-sm transition-all duration-200"
              style={{
                borderRadius: "10px",
                fontFamily: "var(--font-inter)",
                backgroundColor: added ? "#0D1F0D" : "#C45B28",
                color: added ? "#4CAF50" : "#FFF",
                border: added ? "1px solid #1C3A1C" : "1px solid transparent",
              }}
            >
              {added ? "✓  Added to Workout" : "Add to Workout"}
            </button>
          </>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

// ── Detail Cell ───────────────────────────────────────────────────────────────

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{ backgroundColor: "#161616", border: "1px solid #252525" }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-1"
        style={{ color: "#555", fontFamily: "var(--font-inter)" }}
      >
        {label}
      </p>
      <p
        className="text-sm font-semibold"
        style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
      >
        {value}
      </p>
    </div>
  );
}
