"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import Breadcrumb from "@/components/Breadcrumb";

// ─── Block definitions ────────────────────────────────────────────────────────

const PB_BLOCKS = [
  { num: 1, weekStart: 1,  weekEnd: 4,  topSet: "1×5",      backdown: "3×5", rpe: "6–6.5", color: "#22c55e", bg: "#052010" },
  { num: 2, weekStart: 5,  weekEnd: 8,  topSet: "1×4",      backdown: "3×6", rpe: "7",     color: "#3b82f6", bg: "#051025" },
  { num: 3, weekStart: 9,  weekEnd: 12, topSet: "1×3",      backdown: "3×7", rpe: "7.5–8", color: "#f97316", bg: "#1a0800" },
  { num: 4, weekStart: 13, weekEnd: 14, topSet: "1×2",      backdown: "3×8", rpe: "8.5",   color: "#14b8a6", bg: "#031510" },
  { num: 5, weekStart: 15, weekEnd: 16, topSet: "1 Single", backdown: "3×5", rpe: "9",     color: "#a855f7", bg: "#130520" },
];

function blockForWeek(week: number) {
  return PB_BLOCKS.find((b) => week >= b.weekStart && week <= b.weekEnd) ?? PB_BLOCKS[0];
}

// ─── Exercise definitions ─────────────────────────────────────────────────────

type ExLabel = "PRIMARY LIFT" | "BACKDOWN" | "ACCESSORY" | "CORE";

type PBExercise = {
  name: string;
  label: ExLabel;
  setsReps: (block: (typeof PB_BLOCKS)[0]) => string;
  note?: string;
};

type PBDay = {
  key: "mon" | "tue" | "wed" | "sat";
  label: string;
  focus: string;
  exercises: PBExercise[];
};

const PB_DAYS: PBDay[] = [
  {
    key: "mon",
    label: "Monday",
    focus: "Squat / Lower",
    exercises: [
      { name: "Squat", label: "PRIMARY LIFT", setsReps: (b) => b.topSet },
      { name: "Squat Backdown", label: "BACKDOWN", setsReps: (b) => b.backdown },
      { name: "Romanian Deadlift", label: "ACCESSORY", setsReps: () => "4×8" },
      { name: "Hip Thrust", label: "ACCESSORY", setsReps: () => "4×10" },
      { name: "Core / Abs", label: "CORE", setsReps: () => "4×15" },
    ],
  },
  {
    key: "tue",
    label: "Tuesday",
    focus: "Press / Upper",
    exercises: [
      { name: "Overhead Press", label: "PRIMARY LIFT", setsReps: (b) => b.topSet },
      { name: "OHP Backdown", label: "BACKDOWN", setsReps: (b) => b.backdown },
      { name: "Pull-Ups", label: "ACCESSORY", setsReps: () => "4×10" },
      { name: "DB / BB Row", label: "ACCESSORY", setsReps: () => "5×10" },
      { name: "Rear Delt Raise", label: "ACCESSORY", setsReps: () => "4×12–15" },
      { name: "Curls", label: "ACCESSORY", setsReps: () => "~60 reps", note: "Any curl variation" },
    ],
  },
  {
    key: "wed",
    label: "Wednesday",
    focus: "Bench / Upper",
    exercises: [
      { name: "Bench Press", label: "PRIMARY LIFT", setsReps: (b) => b.topSet },
      { name: "Bench Backdown", label: "BACKDOWN", setsReps: (b) => b.backdown },
      { name: "Incline DB Bench", label: "ACCESSORY", setsReps: () => "4×10" },
      { name: "Chest Supported Row", label: "ACCESSORY", setsReps: () => "4×10–12" },
      { name: "Face Pulls", label: "ACCESSORY", setsReps: () => "4×15" },
      { name: "Plank", label: "CORE", setsReps: () => "3×30s" },
    ],
  },
  {
    key: "sat",
    label: "Saturday",
    focus: "Deadlift / Lower",
    exercises: [
      { name: "Deadlift", label: "PRIMARY LIFT", setsReps: (b) => b.topSet },
      { name: "Deadlift Backdown", label: "BACKDOWN", setsReps: (b) => b.backdown },
      { name: "Bulgarian Split Squat", label: "ACCESSORY", setsReps: () => "4×10/leg" },
      { name: "Back Extension", label: "ACCESSORY", setsReps: () => "4×10" },
      { name: "Copenhagen Plank", label: "CORE", setsReps: () => "30s/side" },
    ],
  },
];

// ─── Warmup steps ─────────────────────────────────────────────────────────────

const WARMUP_STEPS = [
  { name: "Foam Roll / Mobility", duration: "3 min", note: "Hips, thoracic spine, lats" },
  { name: "Band Pull-Aparts", duration: "2×15", note: "Scapular prep" },
  { name: "Hip Circles + Leg Swings", duration: "1 min", note: "Hip mobility" },
  { name: "Empty Bar Warm-Up Sets", duration: "2×5", note: "Groove the pattern" },
  { name: "Ramp-Up Sets", duration: "3–4 sets", note: "50% → 70% → 85% of working weight" },
];

// ─── Label colors ─────────────────────────────────────────────────────────────

const LABEL_STYLE: Record<ExLabel, { color: string; bg: string; border: string }> = {
  "PRIMARY LIFT": { color: "#f97316", bg: "#1a0800", border: "#7a3000" },
  "BACKDOWN":     { color: "#3b82f6", bg: "#050f20", border: "#1a3a6a" },
  "ACCESSORY":    { color: "#9A9A9A", bg: "#111111", border: "#252525" },
  "CORE":         { color: "#22c55e", bg: "#051510", border: "#1a4a25" },
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

function storageKey(userId: string, week: number, dayKey: string, exName: string) {
  const slug = exName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  return `pb_${userId}_w${week}_${dayKey}_${slug}`;
}

function loadLog(userId: string, week: number, dayKey: string, exName: string) {
  if (typeof window === "undefined") return { weight: "", reps: "" };
  try {
    const raw = localStorage.getItem(storageKey(userId, week, dayKey, exName));
    return raw ? (JSON.parse(raw) as { weight: string; reps: string }) : { weight: "", reps: "" };
  } catch {
    return { weight: "", reps: "" };
  }
}

function saveLog(userId: string, week: number, dayKey: string, exName: string, data: { weight: string; reps: string }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId, week, dayKey, exName), JSON.stringify(data));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PowerBlockPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [week, setWeek] = useState(1);
  const [dayIdx, setDayIdx] = useState(0);
  const [showWarmup, setShowWarmup] = useState(false);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  // logs[exName] = { weight, reps }
  const [logs, setLogs] = useState<Record<string, { weight: string; reps: string }>>({});

  const currentBlock = blockForWeek(week);
  const currentDay = PB_DAYS[dayIdx];

  // ── Load user & enrollment ──────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Check enrollment to load current week
      const { data: enrollment } = await supabase
        .from("program_enrollments")
        .select("current_week")
        .eq("user_id", user.id)
        .eq("program_slug", "power-block")
        .single();
      if (enrollment?.current_week) setWeek(enrollment.current_week);

      // Load completed days
      const { data: progress } = await supabase
        .from("program_progress")
        .select("week_num, day_num")
        .eq("user_id", user.id)
        .eq("program_slug", "power-block");
      if (progress) {
        const keys = progress.map((p: { week_num: number; day_num: number }) => `${p.week_num}_${p.day_num}`);
        setCompletedDays(new Set(keys));
      }
    }
    init();
  }, []);

  // ── Load exercise logs from localStorage when week/day changes ───────────────
  useEffect(() => {
    const uid = userId ?? "anon";
    const newLogs: Record<string, { weight: string; reps: string }> = {};
    for (const ex of currentDay.exercises) {
      newLogs[ex.name] = loadLog(uid, week, currentDay.key, ex.name);
    }
    setLogs(newLogs);
  }, [userId, week, dayIdx, currentDay]);

  const isDayDone = completedDays.has(`${week}_${dayIdx + 1}`);

  const updateLog = useCallback((exName: string, field: "weight" | "reps", value: string) => {
    setLogs((prev) => ({ ...prev, [exName]: { ...prev[exName], [field]: value } }));
  }, []);

  const saveExercise = useCallback((exName: string) => {
    const uid = userId ?? "anon";
    saveLog(uid, week, currentDay.key, exName, logs[exName] ?? { weight: "", reps: "" });
    setSavedFlash(exName);
    setTimeout(() => setSavedFlash(null), 1500);
  }, [userId, week, currentDay.key, logs]);

  const markDayComplete = useCallback(async () => {
    if (isDayDone || saving) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("program_progress").upsert(
        { user_id: user.id, program_slug: "power-block", week_num: week, day_num: dayIdx + 1 },
        { onConflict: "user_id,program_slug,week_num,day_num" }
      );
      // Log to workout_logs
      await supabase.from("workout_logs").insert({ user_id: user.id, category: "weightlifting", duration_minutes: 70 });

      const newSet = new Set(completedDays).add(`${week}_${dayIdx + 1}`);
      setCompletedDays(newSet);

      // Advance enrollment if all 4 days done this week
      if (newSet.size >= PB_DAYS.length || [...newSet].filter((k) => k.startsWith(`${week}_`)).length >= PB_DAYS.length) {
        const { data: enrollment } = await supabase
          .from("program_enrollments")
          .select("id, current_week")
          .eq("user_id", user.id)
          .eq("program_slug", "power-block")
          .single();
        if (enrollment && enrollment.current_week === week && week < 16) {
          await supabase.from("program_enrollments").update({ current_week: week + 1 }).eq("id", enrollment.id);
        }
      }
    }
    setSaving(false);
  }, [isDayDone, saving, week, dayIdx, completedDays]);

  return (
    <main
      className="min-h-screen flex flex-col px-4 py-8"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-6 pb-28">

        <Breadcrumb items={[
          { label: "Body", href: "/dashboard/body" },
          { label: "Programs", href: "/dashboard/body/programs" },
          { label: "Power Block Pro" },
        ]} />

        {/* Header */}
        <header className="flex items-center gap-4">
          <Link
            href="/dashboard/body/programs"
            className="flex items-center justify-center w-9 h-9 shrink-0 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "6px" }}
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
              Power Block Pro
            </p>
            <h1 className="text-3xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
              {currentDay.focus}
            </h1>
          </div>
          <Link
            href="/dashboard/body/programs/power-block/overview"
            className="text-xs font-semibold uppercase tracking-widest px-3 py-2 transition-opacity hover:opacity-70"
            style={{ color: "#9A9A9A", border: "1px solid #252525", borderRadius: "6px", fontFamily: "var(--font-inter)" }}
          >
            Overview
          </Link>
        </header>

        {/* ── Week selector ────────────────────────────────────────────────────── */}
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] mb-2"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Week
          </p>
          <div
            className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => {
              const bl = blockForWeek(w);
              const isActive = w === week;
              return (
                <button
                  key={w}
                  onClick={() => setWeek(w)}
                  className="flex flex-col items-center justify-center shrink-0 transition-all duration-100 active:scale-95"
                  style={{
                    width: 40,
                    height: 44,
                    borderRadius: "8px",
                    backgroundColor: isActive ? bl.color : "#161616",
                    border: `1px solid ${isActive ? bl.color : "#252525"}`,
                    color: isActive ? "#0A0A0A" : "#9A9A9A",
                    fontFamily: "var(--font-inter)",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                  }}
                >
                  {w}
                  <span style={{ fontSize: "0.5rem", opacity: 0.7, letterSpacing: "0.05em" }}>B{bl.num}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Day selector ─────────────────────────────────────────────────────── */}
        <section className="flex gap-2">
          {PB_DAYS.map((day, i) => {
            const done = completedDays.has(`${week}_${i + 1}`);
            const isActive = i === dayIdx;
            return (
              <button
                key={day.key}
                onClick={() => setDayIdx(i)}
                className="flex-1 flex flex-col items-center py-3 transition-all duration-100 active:scale-95"
                style={{
                  backgroundColor: isActive ? "#1a0800" : "#111111",
                  border: `1px solid ${isActive ? "#C45B28" : done ? "#1a4a20" : "#252525"}`,
                  borderRadius: "10px",
                  color: isActive ? "#C45B28" : done ? "#4CAF50" : "#9A9A9A",
                  fontFamily: "var(--font-inter)",
                }}
              >
                <span className="text-xs font-bold uppercase">{day.label.slice(0, 3)}</span>
                <span className="text-[9px] uppercase tracking-wide mt-0.5 opacity-70">{day.focus.split(" / ")[0]}</span>
                {done && (
                  <svg viewBox="0 0 12 12" fill="none" width={10} height={10} className="mt-1">
                    <path d="M2 6l3 3 5-5" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </section>

        {/* ── Block info bar ───────────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3"
          style={{
            backgroundColor: currentBlock.bg,
            border: `1px solid ${currentBlock.color}44`,
            borderRadius: "10px",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentBlock.color }} />
            <span className="text-xs font-bold uppercase tracking-wide"
              style={{ color: currentBlock.color, fontFamily: "var(--font-inter)" }}>
              Block {currentBlock.num}
            </span>
            <span className="text-xs" style={{ color: "#555555", fontFamily: "var(--font-inter)" }}>
              Wks {currentBlock.weekStart}–{currentBlock.weekEnd}
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            Top Set <span style={{ color: currentBlock.color }}>{currentBlock.topSet}</span>
          </span>
          <span className="text-xs font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            Backdown <span style={{ color: "#3b82f6" }}>{currentBlock.backdown}</span>
          </span>
          <span className="text-xs font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            RPE <span style={{ color: "#9A9A9A" }}>{currentBlock.rpe}</span>
          </span>
        </div>

        {/* ── Warmup expandable ────────────────────────────────────────────────── */}
        <div style={{ border: "1px solid #252525", borderRadius: "10px", overflow: "hidden" }}>
          <button
            onClick={() => setShowWarmup((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#111111", fontFamily: "var(--font-inter)" }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9A9A9A" }}>
              Show Warmup (~12–15 min)
            </span>
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}
              style={{ color: "#9A9A9A", transform: showWarmup ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
              <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showWarmup && (
            <div className="flex flex-col divide-y" style={{ borderColor: "#252525" }}>
              {WARMUP_STEPS.map((step, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                      {step.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      {step.note}
                    </p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                    {step.duration}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Exercise cards ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {currentDay.exercises.map((ex) => {
            const labelStyle = LABEL_STYLE[ex.label];
            const log = logs[ex.name] ?? { weight: "", reps: "" };
            const isSaved = savedFlash === ex.name;
            return (
              <ExerciseCard
                key={ex.name}
                ex={ex}
                block={currentBlock}
                labelStyle={labelStyle}
                log={log}
                isSaved={isSaved}
                onWeightChange={(v) => updateLog(ex.name, "weight", v)}
                onRepsChange={(v) => updateLog(ex.name, "reps", v)}
                onSave={() => saveExercise(ex.name)}
              />
            );
          })}
        </div>

        {/* ── Mark day complete ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 pt-2">
          {isDayDone ? (
            <div
              className="flex items-center justify-center gap-2 px-6 py-4"
              style={{ backgroundColor: "#051510", border: "1px solid #1a4a20", borderRadius: "10px" }}
            >
              <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
                <path d="M4 10l4 4 8-8" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-wide" style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
                {currentDay.label} Complete
              </span>
            </div>
          ) : (
            <button
              onClick={markDayComplete}
              disabled={saving}
              className="flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: "#C45B28",
                color: "#0A0A0A",
                borderRadius: "10px",
                fontFamily: "var(--font-inter)",
              }}
            >
              {saving ? "Saving…" : `✓ Mark ${currentDay.label} Complete`}
            </button>
          )}
        </div>

      </div>
      <BottomNav />
    </main>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({
  ex,
  block,
  labelStyle,
  log,
  isSaved,
  onWeightChange,
  onRepsChange,
  onSave,
}: {
  ex: PBExercise;
  block: (typeof PB_BLOCKS)[0];
  labelStyle: { color: string; bg: string; border: string };
  log: { weight: string; reps: string };
  isSaved: boolean;
  onWeightChange: (v: string) => void;
  onRepsChange: (v: string) => void;
  onSave: () => void;
}) {
  const setsReps = ex.setsReps(block);

  return (
    <div style={{ backgroundColor: "#131313", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}>
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid #1c1c1c", backgroundColor: "#0f0f0f" }}>
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded"
            style={{
              backgroundColor: labelStyle.bg,
              color: labelStyle.color,
              border: `1px solid ${labelStyle.border}`,
              fontFamily: "var(--font-inter)",
            }}
          >
            {ex.label}
          </span>
          {ex.note && (
            <span className="text-[10px]" style={{ color: "#555555", fontFamily: "var(--font-inter)" }}>
              {ex.note}
            </span>
          )}
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded"
          style={{
            backgroundColor: "#1a1a1a",
            color: "#E8E2D8",
            border: "1px solid #333",
            fontFamily: "var(--font-inter)",
          }}
        >
          {setsReps}
        </span>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <h3 className="text-base font-bold uppercase"
          style={{ color: "#E8E2D8", fontFamily: "var(--font-oswald)", letterSpacing: "0.05em" }}>
          {ex.name}
        </h3>

        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Weight Used
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="lbs"
              value={log.weight}
              onChange={(e) => onWeightChange(e.target.value)}
              className="px-3 py-2 text-sm font-semibold text-center"
              style={{
                backgroundColor: "#0A0A0A",
                border: "1px solid #333",
                borderRadius: "6px",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
                outline: "none",
              }}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Actual Reps
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="reps"
              value={log.reps}
              onChange={(e) => onRepsChange(e.target.value)}
              className="px-3 py-2 text-sm font-semibold text-center"
              style={{
                backgroundColor: "#0A0A0A",
                border: "1px solid #333",
                borderRadius: "6px",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
                outline: "none",
              }}
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              onClick={onSave}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
              style={{
                backgroundColor: isSaved ? "#1a4a20" : "#C45B28",
                color: isSaved ? "#4CAF50" : "#0A0A0A",
                borderRadius: "6px",
                fontFamily: "var(--font-inter)",
                minWidth: 60,
              }}
            >
              {isSaved ? "✓" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
