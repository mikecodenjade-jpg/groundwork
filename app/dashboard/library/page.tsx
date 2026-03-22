"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Exercise = {
  exerciseId: string;
  name: string;
  bodyPart: string;
  target: string;
  secondaryMuscles: string[];
  equipment: string;
  gifUrl: string | null;
  instructions: string[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const API = "https://oss.exercisedb.dev/api/v1";
const PAGE_SIZE = 20;

const BODY_PART_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Back", value: "back" },
  { label: "Cardio", value: "cardio" },
  { label: "Chest", value: "chest" },
  { label: "Lower Arms", value: "lower arms" },
  { label: "Lower Legs", value: "lower legs" },
  { label: "Neck", value: "neck" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Upper Arms", value: "upper arms" },
  { label: "Upper Legs", value: "upper legs" },
  { label: "Waist", value: "waist" },
];

const EQUIPMENT_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Body Weight", value: "body weight" },
  { label: "Dumbbell", value: "dumbbell" },
  { label: "Barbell", value: "barbell" },
  { label: "Cable", value: "cable" },
  { label: "Kettlebell", value: "kettlebell" },
  { label: "Band", value: "band" },
  { label: "Machine", value: "leverage machine" },
  { label: "Smith Machine", value: "smith machine" },
];

function cap(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Normalise API response ────────────────────────────────────────────────────

function normalise(r: Record<string, unknown>): Exercise {
  return {
    exerciseId: String(r.exerciseId ?? r.id ?? ""),
    name: String(r.name ?? "Unknown"),
    bodyPart: String(r.bodyPart ?? ""),
    target: String(r.target ?? ""),
    secondaryMuscles: Array.isArray(r.secondaryMuscles) ? r.secondaryMuscles.map(String) : [],
    equipment: String(r.equipment ?? ""),
    gifUrl: r.gifUrl ? String(r.gifUrl) : null,
    instructions: Array.isArray(r.instructions) ? r.instructions.map(String) : [],
  };
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchList(bodyPart: string, equipment: string, offset: number): Promise<Exercise[]> {
  const url = new URL(`${API}/exercises`);
  if (bodyPart) url.searchParams.set("bodyPart", bodyPart);
  if (equipment) url.searchParams.set("equipment", equipment);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  const raw: Record<string, unknown>[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
  return raw.map(normalise);
}

async function fetchSearch(query: string, offset: number): Promise<Exercise[]> {
  const url = new URL(`${API}/exercises/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  const raw: Record<string, unknown>[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
  return raw.map(normalise);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [search, setSearch] = useState("");
  const [bodyPartFilter, setBodyPartFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Fetch exercises
  const load = useCallback(async (currentOffset: number, append: boolean) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const data = debouncedSearch
        ? await fetchSearch(debouncedSearch, currentOffset)
        : await fetchList(bodyPartFilter, equipmentFilter, currentOffset);

      setExercises((prev) => append ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load exercises");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, bodyPartFilter, equipmentFilter]);

  // Reset when filters/search change
  useEffect(() => {
    setOffset(0);
    load(0, false);
  }, [debouncedSearch, bodyPartFilter, equipmentFilter, load]);

  // Load more
  const handleLoadMore = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    load(next, true);
  };

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
          {!loading && exercises.length > 0 && (
            <div className="ml-auto text-right flex-shrink-0">
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
              >
                {exercises.length}{hasMore ? "+" : ""}
              </span>
              <span
                className="text-xs font-semibold uppercase tracking-widest block"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                results
              </span>
            </div>
          )}
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
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "#555" }}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 20 20" fill="none" width={14} height={14}>
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Body Part Chips ─────────────────────────────────────────── */}
        <FilterRow
          filters={BODY_PART_FILTERS}
          active={bodyPartFilter}
          onSelect={(v) => { setBodyPartFilter(v); if (v) setEquipmentFilter(""); }}
          activeStyle={{ backgroundColor: "#C45B28", color: "#FFF", border: "1px solid #C45B28" }}
        />

        {/* ── Equipment Chips ────────────────────────────────────────── */}
        <FilterRow
          filters={EQUIPMENT_FILTERS}
          active={equipmentFilter}
          onSelect={(v) => { setEquipmentFilter(v); if (v) setBodyPartFilter(""); }}
          activeStyle={{ backgroundColor: "rgba(91,168,196,0.15)", color: "#5BA8C4", border: "1px solid #5BA8C4" }}
        />

        {/* ── Loading skeleton ───────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl"
                style={{ height: "220px", backgroundColor: "#161616", border: "1px solid #1E1E1E" }}
              />
            ))}
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────── */}
        {!loading && error && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#1A0A0A", border: "1px solid #3A1A1A" }}
          >
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {error}
            </p>
            <button
              onClick={() => { setOffset(0); load(0, false); }}
              className="text-xs font-semibold uppercase tracking-wider flex-shrink-0 transition-opacity hover:opacity-70"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────────────── */}
        {!loading && !error && exercises.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-inter)" }}>
              No exercises match your filters.
            </p>
          </div>
        )}

        {/* ── Exercise grid ──────────────────────────────────────────── */}
        {!loading && exercises.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {exercises.map((ex) => (
              <ExerciseCard key={ex.exerciseId} exercise={ex} />
            ))}
          </div>
        )}

        {/* ── Load More ──────────────────────────────────────────────── */}
        {!loading && hasMore && exercises.length > 0 && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "8px",
              color: "#C45B28",
              fontFamily: "var(--font-inter)",
            }}
          >
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

// ── Filter Row ────────────────────────────────────────────────────────────────

function FilterRow({
  filters,
  active,
  onSelect,
  activeStyle,
}: {
  filters: { label: string; value: string }[];
  active: string;
  onSelect: (v: string) => void;
  activeStyle: React.CSSProperties;
}) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
        {filters.map((f) => {
          const isActive = active === f.value;
          return (
            <button
              key={f.value}
              onClick={() => onSelect(f.value)}
              className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
              style={{
                borderRadius: "99px",
                fontFamily: "var(--font-inter)",
                whiteSpace: "nowrap",
                ...(isActive
                  ? activeStyle
                  : { backgroundColor: "#161616", color: "#9A9A9A", border: "1px solid #2A2A2A" }),
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Exercise Card ─────────────────────────────────────────────────────────────

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/dashboard/library/${encodeURIComponent(exercise.exerciseId)}`}
      className="flex flex-col transition-all duration-150 overflow-hidden"
      style={{
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: "12px",
      }}
    >
      {/* GIF Thumbnail */}
      <div
        className="w-full flex-shrink-0 relative overflow-hidden"
        style={{ aspectRatio: "1/1", backgroundColor: "#111" }}
      >
        {exercise.gifUrl && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" width={28} height={28} style={{ color: "#2A2A2A" }}>
              <line x1="7" y1="16" x2="25" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="4" y="12" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <rect x="25" y="12" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        {/* Body part tag */}
        {exercise.bodyPart && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider self-start px-2 py-0.5"
            style={{
              borderRadius: "99px",
              backgroundColor: "rgba(196,91,40,0.13)",
              color: "#C45B28",
              fontFamily: "var(--font-inter)",
            }}
          >
            {cap(exercise.bodyPart)}
          </span>
        )}

        {/* Name */}
        <span
          className="text-sm font-semibold leading-tight"
          style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
        >
          {exercise.name}
        </span>

        {/* Equipment */}
        {exercise.equipment && (
          <span className="text-xs" style={{ color: "#555", fontFamily: "var(--font-inter)" }}>
            {cap(exercise.equipment)}
          </span>
        )}
      </div>
    </Link>
  );
}
