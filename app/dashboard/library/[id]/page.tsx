"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { DIFFICULTY_COLORS, type Exercise } from "@/app/dashboard/library/page";

// ── Types ─────────────────────────────────────────────────────────────────────

type RawExercise = {
  id?: string; _id?: string;
  name?: string; title?: string;
  muscleGroup?: string; primaryMuscleGroup?: string;
  primaryMuscles?: string | string[];
  secondaryMuscles?: string | string[];
  equipment?: string;
  difficulty?: string; level?: string;
  thumbnailUrl?: string; thumbnail?: string; imageUrl?: string;
  videoUrl?: string; video?: string; videoUri?: string;
  instructions?: string[] | string;
  steps?: string[] | string;
  category?: string; type?: string;
};

function toStringArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return v.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
}

function normalise(r: RawExercise): Exercise {
  const primaryMuscle =
    r.muscleGroup ?? r.primaryMuscleGroup ?? toStringArray(r.primaryMuscles)[0] ?? "";
  return {
    id: r.id ?? r._id ?? "",
    name: r.name ?? r.title ?? "Unknown",
    primaryMuscle,
    secondaryMuscles: toStringArray(r.secondaryMuscles),
    equipment: r.equipment ?? "",
    difficulty: r.difficulty ?? r.level ?? "",
    thumbnailUrl: r.thumbnailUrl ?? r.thumbnail ?? r.imageUrl ?? null,
    videoUrl: r.videoUrl ?? r.video ?? r.videoUri ?? null,
    instructions: toStringArray(r.instructions ?? r.steps),
    category: r.category ?? r.type ?? "",
  };
}

function cap(s: string) {
  if (!s) return "N/A";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Video Player ──────────────────────────────────────────────────────────────
// Handles direct MP4/WebM URLs and YouTube/Vimeo embeds.

function VideoPlayer({ url, title }: { url: string; title: string }) {
  const isYouTube = /youtube\.com|youtu\.be/.test(url);
  const isVimeo = /vimeo\.com/.test(url);

  if (isYouTube) {
    const videoId = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] ?? "";
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1`;
    return (
      <div
        className="w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: "16/9", backgroundColor: "#000" }}
      >
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  if (isVimeo) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1] ?? "";
    const embedUrl = `https://player.vimeo.com/video/${videoId}?playsinline=1`;
    return (
      <div
        className="w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: "16/9", backgroundColor: "#000" }}
      >
        <iframe
          src={embedUrl}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // Direct video file (mp4, webm, m3u8, etc.)
  return (
    <div
      className="w-full overflow-hidden rounded-xl"
      style={{ backgroundColor: "#000" }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={url}
        controls
        playsInline
        className="w-full"
        style={{ maxHeight: "320px", display: "block" }}
        poster={undefined}
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
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
      .then((json: RawExercise | { data?: RawExercise; exercise?: RawExercise }) => {
        // Handle wrapped responses: { data: {...} } or { exercise: {...} } or the object itself
        const raw: RawExercise =
          ("data" in json && json.data && typeof json.data === "object" && !Array.isArray(json.data))
            ? json.data
            : ("exercise" in json && json.exercise && typeof json.exercise === "object")
            ? json.exercise
            : (json as RawExercise);
        setExercise(normalise(raw));
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const diffColor = exercise ? (DIFFICULTY_COLORS[exercise.difficulty] ?? "#9A9A9A") : "#9A9A9A";

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
            <div className="w-full animate-pulse rounded-xl" style={{ aspectRatio: "16/9", backgroundColor: "#161616" }} />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
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
            {/* Title + meta badges */}
            <div className="flex flex-col gap-3">
              <h1
                className="text-3xl font-bold uppercase leading-tight"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                {exercise.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {exercise.difficulty && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${diffColor}18`,
                      color: diffColor,
                      border: `1px solid ${diffColor}40`,
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {exercise.difficulty}
                  </span>
                )}
                {exercise.category && (
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
                )}
              </div>
            </div>

            {/* ── Video Player ─────────────────────────────────────── */}
            {exercise.videoUrl && (
              <VideoPlayer url={exercise.videoUrl} title={exercise.name} />
            )}

            {/* Thumbnail fallback if no video but has image */}
            {!exercise.videoUrl && exercise.thumbnailUrl && (
              <div
                className="w-full overflow-hidden rounded-xl"
                style={{ aspectRatio: "16/9", backgroundColor: "#111" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exercise.thumbnailUrl}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* ── Detail grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              {exercise.equipment && (
                <DetailCell label="Equipment" value={cap(exercise.equipment)} />
              )}
              {exercise.difficulty && (
                <DetailCell label="Difficulty" value={cap(exercise.difficulty)} />
              )}
              {exercise.category && (
                <DetailCell label="Category" value={cap(exercise.category)} />
              )}
            </div>

            {/* ── Muscles ──────────────────────────────────────────── */}
            {(exercise.primaryMuscle || exercise.secondaryMuscles.length > 0) && (
              <div
                className="p-4 rounded-xl flex flex-col gap-4"
                style={{ backgroundColor: "#161616", border: "1px solid #252525" }}
              >
                {exercise.primaryMuscle && (
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2.5"
                      style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                    >
                      Primary Muscles
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
                        {cap(exercise.primaryMuscle)}
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
