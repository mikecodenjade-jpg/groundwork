"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { EXERCISES, type Exercise } from "@/lib/exercises";

const REMOTE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

const PAGE_SIZE = 20;

const MUSCLE_FILTERS: { label: string; muscles?: string[]; category?: string }[] = [
  { label: "All" },
  { label: "Chest", muscles: ["chest"] },
  { label: "Back", muscles: ["lats", "middle back", "lower back", "traps"] },
  { label: "Shoulders", muscles: ["shoulders"] },
  { label: "Biceps", muscles: ["biceps"] },
  { label: "Triceps", muscles: ["triceps"] },
  {
    label: "Legs",
    muscles: ["quadriceps", "hamstrings", "calves", "abductors", "adductors"],
  },
  { label: "Core", muscles: ["abdominals"] },
  { label: "Glutes", muscles: ["glutes"] },
  { label: "Cardio", category: "cardio" },
];

const EQUIPMENT_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Bodyweight", value: "body only" },
  { label: "Dumbbell", value: "dumbbell" },
  { label: "Barbell", value: "barbell" },
  { label: "Cable", value: "cable" },
  { label: "Machine", value: "machine" },
  { label: "Kettlebell", value: "kettlebells" },
  { label: "Band", value: "bands" },
  { label: "None", value: "none" },
];

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#4CAF50",
  intermediate: "#FF9800",
  expert: "#F44336",
};

function cap(s: string) {
  if (!s) return "N/A";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function LibraryPage() {
  // Start immediately with the local dataset — no loading state
  const [exercises, setExercises] = useState<Exercise[]>(EXERCISES);
  const [remoteStatus, setRemoteStatus] = useState<"idle" | "loading" | "ok" | "failed">("idle");
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("All");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Try to enrich with the full remote database in the background
  useEffect(() => {
    setRemoteStatus("loading");
    fetch(REMOTE_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Exercise[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setExercises(data);
          setRemoteStatus("ok");
        } else {
          setRemoteStatus("failed");
        }
      })
      .catch(() => {
        setRemoteStatus("failed");
      });
  }, []);

  const filtered = useMemo(() => {
    let result = exercises;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }

    const chip = MUSCLE_FILTERS.find((f) => f.label === muscleFilter);
    if (chip && muscleFilter !== "All") {
      if (chip.category) {
        result = result.filter((e) => e.category === chip.category);
      } else if (chip.muscles) {
        const ms = chip.muscles;
        result = result.filter((e) =>
          e.primaryMuscles.some((pm) => ms.includes(pm))
        );
      }
    }

    if (equipmentFilter !== "all") {
      result = result.filter((e) => e.equipment === equipmentFilter);
    }

    return result;
  }, [exercises, search, muscleFilter, equipmentFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, muscleFilter, equipmentFilter]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <main
      className="min-h-screen flex flex-col px-4 py-8"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-5 pb-28">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "6px" }}
            aria-label="Back to dashboard"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Training
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Exercise Library
            </h1>
          </div>
          <div className="ml-auto text-right flex-shrink-0">
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
            >
              {filtered.length}
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-widest block"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              results
            </span>
          </div>
        </header>

        {/* ── Search ─────────────────────────────────────────────────── */}
        <div className="relative">
          <svg
            viewBox="0 0 20 20" fill="none" width={15} height={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#555" }}
          >
            <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search exercises…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "8px",
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
            }}
          />
        </div>

        {/* ── Muscle Chips ───────────────────────────────────────────── */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
            {MUSCLE_FILTERS.map((f) => {
              const active = muscleFilter === f.label;
              return (
                <button
                  key={f.label}
                  onClick={() => setMuscleFilter(f.label)}
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
                  style={{
                    borderRadius: "99px",
                    fontFamily: "var(--font-inter)",
                    backgroundColor: active ? "#C45B28" : "#161616",
                    color: active ? "#FFF" : "#9A9A9A",
                    border: `1px solid ${active ? "#C45B28" : "#2A2A2A"}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Equipment Chips ────────────────────────────────────────── */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
            {EQUIPMENT_FILTERS.map((f) => {
              const active = equipmentFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setEquipmentFilter(f.value)}
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
                  style={{
                    borderRadius: "99px",
                    fontFamily: "var(--font-inter)",
                    backgroundColor: active ? "rgba(91,168,196,0.15)" : "#161616",
                    color: active ? "#5BA8C4" : "#9A9A9A",
                    border: `1px solid ${active ? "#5BA8C4" : "#2A2A2A"}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Remote fetch status banner ─────────────────────────────── */}
        {remoteStatus === "loading" && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              color: "#666",
              fontFamily: "var(--font-inter)",
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
              style={{ backgroundColor: "#C45B28" }}
            />
            Loading full exercise database…
          </div>
        )}
        {remoteStatus === "ok" && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: "#0D1F0D",
              border: "1px solid #1C3A1C",
              color: "#4CAF50",
              fontFamily: "var(--font-inter)",
            }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#4CAF50" }} />
            Full database loaded — {exercises.length} exercises
          </div>
        )}
        {remoteStatus === "failed" && (
          <div
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #2A2A2A",
              color: "#666",
              fontFamily: "var(--font-inter)",
            }}
          >
            <span>Showing built-in library ({EXERCISES.length} exercises)</span>
            <button
              onClick={() => {
                setRemoteStatus("loading");
                fetch(REMOTE_URL)
                  .then((r) => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                  })
                  .then((data: Exercise[]) => {
                    if (Array.isArray(data) && data.length > 0) {
                      setExercises(data);
                      setRemoteStatus("ok");
                    } else {
                      setRemoteStatus("failed");
                    }
                  })
                  .catch(() => setRemoteStatus("failed"));
              }}
              className="font-semibold uppercase tracking-wider transition-opacity hover:opacity-70"
              style={{ color: "#C45B28" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Exercise Grid ──────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-inter)" }}>
              No exercises match your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {visible.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>

            {visibleCount < filtered.length && (
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="w-full py-3 text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "8px",
                  color: "#C45B28",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Load More — {filtered.length - visibleCount} remaining
              </button>
            )}
          </>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

// ── Exercise Card ──────────────────────────────────────────────────────────────

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const levelColor = LEVEL_COLORS[exercise.level] ?? "#9A9A9A";
  const primaryMuscle = exercise.primaryMuscles[0] ?? "General";

  return (
    <Link
      href={`/dashboard/library/${encodeURIComponent(exercise.id)}`}
      className="flex flex-col gap-2.5 p-4 transition-all duration-150"
      style={{
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: "12px",
      }}
    >
      {/* Muscle tag */}
      <span
        className="text-[10px] font-bold uppercase tracking-wider self-start px-2 py-0.5"
        style={{
          borderRadius: "99px",
          backgroundColor: "rgba(196,91,40,0.13)",
          color: "#C45B28",
          fontFamily: "var(--font-inter)",
        }}
      >
        {cap(primaryMuscle)}
      </span>

      {/* Name */}
      <span
        className="text-sm font-semibold leading-tight"
        style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
      >
        {exercise.name}
      </span>

      {/* Equipment */}
      <span
        className="text-xs"
        style={{ color: "#555", fontFamily: "var(--font-inter)" }}
      >
        {cap(exercise.equipment)}
      </span>

      {/* Level */}
      <div className="flex items-center gap-1.5 mt-auto pt-1">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: levelColor }}
        />
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: levelColor, fontFamily: "var(--font-inter)" }}
        >
          {exercise.level}
        </span>
      </div>
    </Link>
  );
}
