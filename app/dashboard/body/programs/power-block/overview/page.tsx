"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import Breadcrumb from "@/components/Breadcrumb";

// ─── Block definitions ────────────────────────────────────────────────────────

const BLOCKS = [
  {
    num: 1, weekRange: "Weeks 1–4", topSet: "1×5", backdown: "3×5",
    rpe: "RPE 6–6.5", label: "Volume Base", color: "#22c55e", bg: "#031208",
    desc: "Build the foundation. Light enough to own the movement, heavy enough to matter.",
  },
  {
    num: 2, weekRange: "Weeks 5–8", topSet: "1×4", backdown: "3×6",
    rpe: "RPE 7", label: "Strength Build", color: "#3b82f6", bg: "#020a18",
    desc: "Weights go up. Reps come down. Your body starts to remember what heavy feels like.",
  },
  {
    num: 3, weekRange: "Weeks 9–12", topSet: "1×3", backdown: "3×7",
    rpe: "RPE 7.5–8", label: "Intensity", color: "#f97316", bg: "#180800",
    desc: "This is the block where you earn it. Push the top set, accumulate volume on the backdown.",
  },
  {
    num: 4, weekRange: "Weeks 13–14", topSet: "1×2", backdown: "3×8",
    rpe: "RPE 8.5", label: "Peak Load", color: "#14b8a6", bg: "#030f0c",
    desc: "Two heavy doubles. Nervous system is primed. You are two weeks from a PR.",
  },
  {
    num: 5, weekRange: "Weeks 15–16", topSet: "1 Single", backdown: "3×5",
    rpe: "RPE 9", label: "Max Out", color: "#a855f7", bg: "#0f0318",
    desc: "One rep. Everything you've built points here. Hit your number.",
  },
];

// ─── Training days ────────────────────────────────────────────────────────────

const TRAINING_DAYS = [
  {
    key: "mon", label: "Monday", focus: "Squat / Lower",
    exercises: [
      { name: "Squat", label: "PRIMARY LIFT", sets: "1×5 → 1×1", note: "Varies by block" },
      { name: "Squat Backdown", label: "BACKDOWN", sets: "3×5 → 3×8", note: "Varies by block" },
      { name: "Romanian Deadlift", label: "ACCESSORY", sets: "4×8" },
      { name: "Hip Thrust", label: "ACCESSORY", sets: "4×10" },
      { name: "Core / Abs", label: "CORE", sets: "4×15" },
    ],
  },
  {
    key: "tue", label: "Tuesday", focus: "Press / Upper",
    exercises: [
      { name: "Overhead Press", label: "PRIMARY LIFT", sets: "1×5 → 1×1", note: "Varies by block" },
      { name: "OHP Backdown", label: "BACKDOWN", sets: "3×5 → 3×8", note: "Varies by block" },
      { name: "Pull-Ups", label: "ACCESSORY", sets: "4×10" },
      { name: "DB / BB Row", label: "ACCESSORY", sets: "5×10" },
      { name: "Rear Delt Raise", label: "ACCESSORY", sets: "4×12–15" },
      { name: "Curls", label: "ACCESSORY", sets: "~60 reps" },
    ],
  },
  {
    key: "wed", label: "Wednesday", focus: "Bench / Upper",
    exercises: [
      { name: "Bench Press", label: "PRIMARY LIFT", sets: "1×5 → 1×1", note: "Varies by block" },
      { name: "Bench Backdown", label: "BACKDOWN", sets: "3×5 → 3×8", note: "Varies by block" },
      { name: "Incline DB Bench", label: "ACCESSORY", sets: "4×10" },
      { name: "Chest Supported Row", label: "ACCESSORY", sets: "4×10–12" },
      { name: "Face Pulls", label: "ACCESSORY", sets: "4×15" },
      { name: "Plank", label: "CORE", sets: "3×30s" },
    ],
  },
  {
    key: "sat", label: "Saturday", focus: "Deadlift / Lower",
    exercises: [
      { name: "Deadlift", label: "PRIMARY LIFT", sets: "1×5 → 1×1", note: "Varies by block" },
      { name: "Deadlift Backdown", label: "BACKDOWN", sets: "3×5 → 3×8", note: "Varies by block" },
      { name: "Bulgarian Split Squat", label: "ACCESSORY", sets: "4×10/leg" },
      { name: "Back Extension", label: "ACCESSORY", sets: "4×10" },
      { name: "Copenhagen Plank", label: "CORE", sets: "30s/side" },
    ],
  },
];

const LABEL_COLOR: Record<string, string> = {
  "PRIMARY LIFT": "#f97316",
  "BACKDOWN": "#3b82f6",
  "ACCESSORY": "#9A9A9A",
  "CORE": "#22c55e",
};

// ─── Goal calculator state ────────────────────────────────────────────────────

type Goals = {
  bench: { current: string; target: string };
  squat: { current: string; target: string };
  deadlift: { current: string; target: string };
  ohp: { current: string; target: string };
  run2mi: { current: string; target: string };
};

const EMPTY_GOALS: Goals = {
  bench:    { current: "", target: "" },
  squat:    { current: "", target: "" },
  deadlift: { current: "", target: "" },
  ohp:      { current: "", target: "" },
  run2mi:   { current: "", target: "" },
};

function loadGoals(): Goals {
  if (typeof window === "undefined") return EMPTY_GOALS;
  try {
    const raw = localStorage.getItem("pb_goals");
    return raw ? JSON.parse(raw) : EMPTY_GOALS;
  } catch {
    return EMPTY_GOALS;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PowerBlockOverviewPage() {
  const [showGoals, setShowGoals] = useState(false);
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");
  const [goals, setGoals] = useState<Goals>(loadGoals);
  const [goalsSaved, setGoalsSaved] = useState(false);

  function updateGoal(lift: keyof Goals, field: "current" | "target", value: string) {
    setGoals((prev) => ({ ...prev, [lift]: { ...prev[lift], [field]: value } }));
  }

  function saveGoals() {
    localStorage.setItem("pb_goals", JSON.stringify(goals));
    setGoalsSaved(true);
    setTimeout(() => setGoalsSaved(false), 2000);
  }

  return (
    <main
      className="min-h-screen flex flex-col px-4 py-8"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-28">

        <Breadcrumb items={[
          { label: "Body", href: "/dashboard/body" },
          { label: "Programs", href: "/dashboard/body/programs" },
          { label: "Power Block Pro", href: "/dashboard/body/programs/power-block" },
          { label: "Overview" },
        ]} />

        {/* Header */}
        <header className="flex items-center gap-4">
          <Link
            href="/dashboard/body/programs/power-block"
            className="flex items-center justify-center w-9 h-9 shrink-0 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "6px" }}
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
              Power Block Pro
            </p>
            <h1 className="text-3xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
              Program Overview
            </h1>
          </div>
        </header>

        {/* ── 5 Periodization Blocks ───────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
            Periodization Blocks
          </p>
          {BLOCKS.map((block) => (
            <div
              key={block.num}
              className="px-5 py-4 flex flex-col gap-2"
              style={{
                backgroundColor: block.bg,
                border: `1px solid ${block.color}33`,
                borderRadius: "12px",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-black"
                    style={{ backgroundColor: block.color + "22", color: block.color, border: `1px solid ${block.color}44` }}
                  >
                    {block.num}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                      {block.label}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: block.color, fontFamily: "var(--font-inter)" }}>
                      {block.weekRange}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                    Top Set: <span style={{ color: block.color }}>{block.topSet}</span>
                  </span>
                  <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    Backdown: {block.backdown} · {block.rpe}
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                {block.desc}
              </p>
            </div>
          ))}
        </section>

        {/* ── Training Days ────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
            Training Days
          </p>
          {TRAINING_DAYS.map((day) => (
            <div
              key={day.key}
              style={{ backgroundColor: "#111111", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}
            >
              <div className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid #1c1c1c", backgroundColor: "#0d0d0d" }}>
                <div>
                  <p className="text-base font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                    {day.label}
                  </p>
                  <p className="text-xs" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                    {day.focus}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: "#1a1a1a", color: "#9A9A9A", border: "1px solid #333", fontFamily: "var(--font-inter)" }}>
                  {day.exercises.length} exercises
                </span>
              </div>
              <div className="flex flex-col divide-y" style={{ borderColor: "#1c1c1c" }}>
                {day.exercises.map((ex) => (
                  <div key={ex.name} className="flex items-center justify-between px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: LABEL_COLOR[ex.label] ?? "#9A9A9A" }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                          {ex.name}
                        </p>
                        {ex.note && (
                          <p className="text-[10px]" style={{ color: "#555555", fontFamily: "var(--font-inter)" }}>
                            {ex.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold shrink-0"
                      style={{ color: LABEL_COLOR[ex.label] ?? "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      {ex.sets}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── Goal Calculator ──────────────────────────────────────────────────── */}
        <section>
          <button
            onClick={() => setShowGoals((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: showGoals ? "12px 12px 0 0" : "12px",
              fontFamily: "var(--font-inter)",
            }}
          >
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" width={18} height={18} style={{ color: "#C45B28" }}>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-wide" style={{ color: "#E8E2D8" }}>
                Goal Calculator
              </span>
            </div>
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}
              style={{ color: "#9A9A9A", transform: showGoals ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
              <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showGoals && (
            <div
              className="flex flex-col gap-5 px-5 py-5"
              style={{
                backgroundColor: "#0f0f0f",
                border: "1px solid #252525",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
              }}
            >
              {/* Unit toggle */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Units
                </p>
                <div className="flex gap-1">
                  {(["lbs", "kg"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className="px-3 py-1 text-xs font-bold uppercase tracking-widest transition-all"
                      style={{
                        backgroundColor: unit === u ? "#C45B28" : "#1a1a1a",
                        color: unit === u ? "#0A0A0A" : "#9A9A9A",
                        border: `1px solid ${unit === u ? "#C45B28" : "#333"}`,
                        borderRadius: "6px",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strength goals */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                  Strength Goals
                </p>
                <div className="flex flex-col gap-3">
                  {([
                    { key: "bench" as const,    label: "Bench Press"    },
                    { key: "squat" as const,    label: "Squat"          },
                    { key: "deadlift" as const, label: "Deadlift"       },
                    { key: "ohp" as const,      label: "Overhead Press" },
                  ]).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <p className="text-sm font-semibold w-36 shrink-0" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                        {label}
                      </p>
                      <GoalInput
                        placeholder={`Current (${unit})`}
                        value={goals[key].current}
                        onChange={(v) => updateGoal(key, "current", v)}
                      />
                      <span style={{ color: "#555" }}>→</span>
                      <GoalInput
                        placeholder={`Target (${unit})`}
                        value={goals[key].target}
                        onChange={(v) => updateGoal(key, "target", v)}
                        accent
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cardio goals */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "#3b82f6", fontFamily: "var(--font-inter)" }}>
                  Cardio Goals
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold w-36 shrink-0" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                    2-Mile Run
                  </p>
                  <GoalInput
                    placeholder="Current (min)"
                    value={goals.run2mi.current}
                    onChange={(v) => updateGoal("run2mi", "current", v)}
                  />
                  <span style={{ color: "#555" }}>→</span>
                  <GoalInput
                    placeholder="Target (min)"
                    value={goals.run2mi.target}
                    onChange={(v) => updateGoal("run2mi", "target", v)}
                    accent
                  />
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: "#555555", fontFamily: "var(--font-inter)" }}>
                  Enter decimal minutes, e.g. 15.5 = 15:30
                </p>
              </div>

              {/* Save button */}
              <button
                onClick={saveGoals}
                className="flex items-center justify-center py-3 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: goalsSaved ? "#1a4a20" : "#C45B28",
                  color: goalsSaved ? "#4CAF50" : "#0A0A0A",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {goalsSaved ? "✓ Goals Saved" : "Save Goals"}
              </button>
            </div>
          )}
        </section>

        {/* ── Start CTA ────────────────────────────────────────────────────────── */}
        <Link
          href="/dashboard/body/programs/power-block"
          className="flex items-center justify-center py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            backgroundColor: "#C45B28",
            color: "#0A0A0A",
            borderRadius: "10px",
            fontFamily: "var(--font-inter)",
          }}
        >
          Start Training →
        </Link>

      </div>
      <BottomNav />
    </main>
  );
}

function GoalInput({
  placeholder,
  value,
  onChange,
  accent,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  accent?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 px-3 py-2 text-sm text-center"
      style={{
        backgroundColor: "#0A0A0A",
        border: `1px solid ${accent ? "#C45B2844" : "#333"}`,
        borderRadius: "6px",
        color: accent ? "#C45B28" : "#E8E2D8",
        fontFamily: "var(--font-inter)",
        outline: "none",
        fontWeight: 600,
      }}
    />
  );
}
