"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import {
  ACTIVITIES,
  type Activity,
  type AgeRange,
  type EnergyLevel,
} from "@/lib/play-activities";

// ── Constants ─────────────────────────────────────────────────────────────────

const ENERGY_OPTIONS: { label: string; sub: string; value: EnergyLevel }[] = [
  { label: "Running on Fumes", sub: "Sitting is a sport right now", value: "low" },
  { label: "Got a Little Left", sub: "Low gear, still moving", value: "medium" },
  { label: "Actually Feel Good", sub: "Let's make something happen", value: "high" },
];

const TIME_OPTIONS: { label: string; value: 15 | 30 | 60 }[] = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
];

const AGE_OPTIONS: { label: string; sub: string; value: AgeRange }[] = [
  { label: "0–2", sub: "Baby / Toddler", value: "baby" },
  { label: "3–5", sub: "Preschool", value: "preschool" },
  { label: "6–8", sub: "Elementary", value: "elementary" },
  { label: "9–12", sub: "Tween", value: "tween" },
  { label: "13+", sub: "Teen", value: "teen" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMatching(
  energy: EnergyLevel,
  time: 15 | 30 | 60,
  ages: AgeRange[]
): Activity[] {
  return ACTIVITIES.filter((a) => {
    if (a.energyLevel !== energy) return false;
    if (a.minTime > time) return false;
    if (ages.length > 0 && !ages.some((age) => a.ageRanges.includes(age))) return false;
    return true;
  });
}

function pickThree(pool: Activity[], exclude: string[]): Activity[] {
  const candidates = pool.filter((a) => !exclude.includes(a.id));
  if (candidates.length === 0) return pickThree(pool, []); // reset if pool exhausted
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TonightsPlayPage() {
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [time, setTime] = useState<15 | 30 | 60 | null>(null);
  const [ages, setAges] = useState<AgeRange[]>([]);
  const [displayed, setDisplayed] = useState<Activity[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [shownIds, setShownIds] = useState<string[]>([]);

  const resultsRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(() => {
    if (!energy || !time) return [];
    return getMatching(energy, time, ages);
  }, [energy, time, ages]);

  function toggleAge(age: AgeRange) {
    setAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    );
    // Reset results when age selection changes
    setDisplayed([]);
    setSavedIds(new Set());
    setShownIds([]);
  }

  function handleFind() {
    if (!energy || !time) return;
    const three = pickThree(pool, []);
    setDisplayed(three);
    setSavedIds(new Set());
    setShownIds(three.map((a) => a.id));
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleShuffle() {
    const three = pickThree(pool, shownIds);
    setDisplayed(three);
    setSavedIds(new Set());
    setShownIds((prev) => [...prev, ...three.map((a) => a.id)]);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  const handleDidIt = useCallback(
    async (activity: Activity) => {
      if (savingId) return;
      setSavingId(activity.id);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("family_activities").insert({
          user_id: user.id,
          activity_name: activity.name,
          energy_level: energy,
          time_slot: time?.toString(),
        });
      }

      setSavedIds((prev) => new Set([...prev, activity.id]));
      setSavingId(null);
    },
    [savingId, energy, time]
  );

  const canFind = Boolean(energy && time);

  const s = {
    accent: { color: "#C45B28", fontFamily: "var(--font-inter)" } as React.CSSProperties,
    body: { color: "#E8E2D8", fontFamily: "var(--font-inter)" } as React.CSSProperties,
    muted: { color: "#9A9A9A", fontFamily: "var(--font-inter)" } as React.CSSProperties,
  };

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex items-start gap-5">
          <Link
            href="/dashboard/heart"
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 mt-1 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "4px" }}
            aria-label="Back to Heart"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5" style={s.accent}>
              Heart
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none mb-2"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Tonight&apos;s Play
            </h1>
            <p className="text-sm leading-relaxed" style={s.muted}>
              You&apos;re home. You&apos;re tired. Here&apos;s what to do with your kids tonight.
            </p>
          </div>
        </header>

        {/* ── Q1: Energy ──────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1" style={s.accent}>
              Question 1
            </p>
            <p className="text-lg font-bold" style={s.body}>
              How much energy do you have?
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {ENERGY_OPTIONS.map((opt) => {
              const active = energy === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setEnergy(opt.value);
                    setDisplayed([]);
                    setSavedIds(new Set());
                    setShownIds([]);
                  }}
                  className="w-full text-left px-5 py-4 transition-all duration-150"
                  style={{
                    backgroundColor: active ? "#1A0A00" : "#161616",
                    border: `1px solid ${active ? "#C45B28" : "#252525"}`,
                    borderRadius: "10px",
                  }}
                >
                  <p
                    className="text-sm font-bold"
                    style={{ color: active ? "#C45B28" : "#E8E2D8", fontFamily: "var(--font-inter)" }}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#666", fontFamily: "var(--font-inter)" }}>
                    {opt.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Q2: Time ────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1" style={s.accent}>
              Question 2
            </p>
            <p className="text-lg font-bold" style={s.body}>
              How much time?
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {TIME_OPTIONS.map((opt) => {
              const active = time === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTime(opt.value);
                    setDisplayed([]);
                    setSavedIds(new Set());
                    setShownIds([]);
                  }}
                  className="py-4 text-sm font-bold uppercase tracking-wider transition-all duration-150"
                  style={{
                    backgroundColor: active ? "#1A0A00" : "#161616",
                    border: `1px solid ${active ? "#C45B28" : "#252525"}`,
                    borderRadius: "10px",
                    color: active ? "#C45B28" : "#9A9A9A",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Q3: Kid Ages ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1" style={s.accent}>
              Question 3
            </p>
            <p className="text-lg font-bold" style={s.body}>
              How old are your kids?
            </p>
            <p className="text-xs mt-1" style={s.muted}>
              Pick all that apply. Skip this to see everything.
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {AGE_OPTIONS.map((opt) => {
              const active = ages.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleAge(opt.value)}
                  className="flex flex-col items-center py-3 px-1 transition-all duration-150"
                  style={{
                    backgroundColor: active ? "#1A0A00" : "#161616",
                    border: `1px solid ${active ? "#C45B28" : "#252525"}`,
                    borderRadius: "10px",
                  }}
                >
                  <span
                    className="text-sm font-bold leading-tight"
                    style={{ color: active ? "#C45B28" : "#E8E2D8", fontFamily: "var(--font-inter)" }}
                  >
                    {opt.label}
                  </span>
                  <span
                    className="text-[9px] mt-0.5 text-center leading-tight"
                    style={{ color: "#555", fontFamily: "var(--font-inter)" }}
                  >
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Find Activities Button ────────────────────────────────────── */}
        {canFind && displayed.length === 0 && (
          <button
            onClick={handleFind}
            className="w-full py-4 font-bold uppercase tracking-wider text-sm transition-all duration-150"
            style={{
              backgroundColor: "#C45B28",
              color: "#FFF",
              borderRadius: "10px",
              fontFamily: "var(--font-inter)",
            }}
          >
            Find Activities
          </button>
        )}

        {!canFind && (
          <p
            className="text-center text-sm"
            style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}
          >
            Answer the first two questions and we&apos;ll pick activities for you.
          </p>
        )}

        {/* ── Activity Cards ────────────────────────────────────────────── */}
        {displayed.length > 0 && (
          <div ref={resultsRef} className="flex flex-col gap-6">

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px" style={{ backgroundColor: "#252525" }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={s.accent}>
                Tonight&apos;s Options
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#252525" }} />
            </div>

            {displayed.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                saved={savedIds.has(activity.id)}
                saving={savingId === activity.id}
                onDidIt={() => handleDidIt(activity)}
              />
            ))}

            {/* Shuffle button */}
            <button
              onClick={handleShuffle}
              className="w-full py-3 text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-70"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #252525",
                borderRadius: "10px",
                color: "#9A9A9A",
                fontFamily: "var(--font-inter)",
              }}
            >
              Shuffle — Show 3 More
            </button>
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

// ── Activity Card ──────────────────────────────────────────────────────────────

type ActivityCardProps = {
  activity: Activity;
  saved: boolean;
  saving: boolean;
  onDidIt: () => void;
};

function ActivityCard({ activity, saved, saving, onDidIt }: ActivityCardProps) {
  const s = {
    accent: { color: "#C45B28", fontFamily: "var(--font-inter)" } as React.CSSProperties,
  };

  const locationLabel =
    activity.location === "indoor"
      ? "Indoor"
      : activity.location === "outdoor"
      ? "Outdoor"
      : "Indoor or Outdoor";

  return (
    <div
      className="flex flex-col gap-5 p-6"
      style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "14px" }}
    >
      {/* Activity name + meta */}
      <div className="flex flex-col gap-2">
        <h2
          className="text-2xl font-bold uppercase leading-tight"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          {activity.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          <MetaTag label="Needs" value={activity.itemsNeeded} />
          <MetaTag label="Where" value={locationLabel} />
        </div>
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={s.accent}>
          How to do it
        </p>
        <ol className="flex flex-col gap-3">
          {activity.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                style={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  color: "#C45B28",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed flex-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-inter)" }}>
                {step}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Why This Matters */}
      <div
        className="flex gap-4 px-4 py-4 rounded-xl"
        style={{ backgroundColor: "#0A0A0A", border: "1px solid #1E1E1E" }}
      >
        <div className="w-0.5 flex-shrink-0 self-stretch rounded-full" style={{ backgroundColor: "#C45B28" }} />
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={s.accent}>
            Why This Matters
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {activity.whyItMatters}
          </p>
        </div>
      </div>

      {/* I Did It */}
      {!saved ? (
        <button
          onClick={onDidIt}
          disabled={saving}
          className="w-full py-4 font-bold uppercase tracking-wider text-sm transition-all duration-150 disabled:opacity-50"
          style={{
            backgroundColor: "#C45B28",
            color: "#FFF",
            borderRadius: "10px",
            fontFamily: "var(--font-inter)",
          }}
        >
          {saving ? "Saving…" : "I Did It"}
        </button>
      ) : (
        <div
          className="w-full py-4 flex flex-col items-center gap-1 rounded-xl"
          style={{ backgroundColor: "#0D1F0D", border: "1px solid #1C3A1C" }}
        >
          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}
          >
            ✓ Logged
          </p>
          <p
            className="text-xs"
            style={{ color: "#4CAF50", fontFamily: "var(--font-inter)", opacity: 0.8 }}
          >
            Your kids will remember tonight.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Meta Tag ──────────────────────────────────────────────────────────────────

function MetaTag({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ backgroundColor: "#0A0A0A", border: "1px solid #252525" }}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "#555", fontFamily: "var(--font-inter)" }}
      >
        {label}:
      </span>
      <span
        className="text-[11px] font-medium"
        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
      >
        {value}
      </span>
    </div>
  );
}
