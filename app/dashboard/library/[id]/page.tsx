"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { type Exercise } from "@/app/dashboard/library/page";

// ── Raw response type ─────────────────────────────────────────────────────────

type RawExercise = {
  id?: string;
  name?: string;
  bodyPart?: string;
  target?: string;
  secondaryMuscles?: string[];
  equipment?: string;
  gifUrl?: string;
  instructions?: string[];
};

function normalise(r: RawExercise): Exercise {
  return {
    id: r.id ?? "",
    name: r.name ?? "Unknown",
    bodyPart: r.bodyPart ?? "",
    target: r.target ?? "",
    secondaryMuscles: Array.isArray(r.secondaryMuscles) ? r.secondaryMuscles : [],
    equipment: r.equipment ?? "",
    gifUrl: r.gifUrl ?? null,
    instructions: Array.isArray(r.instructions) ? r.instructions : [],
  };
}

function cap(s: string) {
  if (!s) return "N/A";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params?.id ?? "");

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/exercises/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((json: RawExercise) => {
        setExercise(normalise(json));
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

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

        {/* ── Skeleton ───────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col gap-4">
            <div className="h-9 w-3/4 animate-pulse rounded-lg" style={{ backgroundColor: "#161616" }} />
            <div className="w-full animate-pulse rounded-xl" style={{ aspectRatio: "1/1", backgroundColor: "#161616" }} />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "#161616" }} />
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded" style={{ backgroundColor: "#161616", width: `${90 - i * 10}%` }} />
            ))}
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-sm mb-3" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {error}
            </p>
            <Link
              href="/dashboard/library"
              className="text-sm font-semibold"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              ← Back to library
            </Link>
          </div>
        )}

        {/* ── Not found ──────────────────────────────────────────────── */}
        {!loading && !error && !exercise && (
          <div className="text-center py-16">
            <p className="text-sm mb-3" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Exercise not found.
            </p>
            <Link
              href="/dashboard/library"
              className="text-sm font-semibold"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              ← Back to library
            </Link>
          </div>
        )}

        {/* ── Exercise detail ────────────────────────────────────────── */}
        {!loading && exercise && (
          <>
            {/* Title */}
            <h1
              className="text-3xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              {exercise.name}
            </h1>

            {/* ── Animated GIF ─────────────────────────────────────── */}
            {exercise.gifUrl && (
              <div
                className="w-full overflow-hidden rounded-xl"
                style={{ backgroundColor: "#111" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  className="w-full"
                  style={{ display: "block", maxHeight: "420px", objectFit: "contain" }}
                />
              </div>
            )}

            {/* ── Detail grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              {exercise.bodyPart && (
                <DetailCell label="Body Part" value={cap(exercise.bodyPart)} />
              )}
              {exercise.target && (
                <DetailCell label="Target Muscle" value={cap(exercise.target)} />
              )}
              {exercise.equipment && (
                <DetailCell label="Equipment" value={cap(exercise.equipment)} />
              )}
            </div>

            {/* ── Muscles ──────────────────────────────────────────── */}
            {(exercise.target || exercise.secondaryMuscles.length > 0) && (
              <div
                className="p-4 rounded-xl flex flex-col gap-4"
                style={{ backgroundColor: "#161616", border: "1px solid #252525" }}
              >
                {exercise.target && (
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2.5"
                      style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                    >
                      Target Muscle
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: "rgba(196,91,40,0.12)",
                          color: "#C45B28",
                          border: "1px solid rgba(196,91,40,0.25)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {cap(exercise.target)}
                      </span>
                    </div>
                  </div>
                )}

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
            )}

            {/* ── Instructions ─────────────────────────────────────── */}
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

            {/* ── Add to Workout ────────────────────────────────────── */}
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
