"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const INTEREST_TO_SLUG: Record<string, string> = {
  Running: "running",
  Weightlifting: "weightlifting",
  Bodybuilding: "bodybuilding",
  "Hybrid / Functional": "hybrid-functional",
  Calisthenics: "calisthenics",
  "Mobility & Recovery": "mobility-recovery",
  Rucking: "rucking",
  Bodyweight: "bodyweight",
};

const SLUG_LABELS: Record<string, string> = {
  running: "Running",
  weightlifting: "Weightlifting",
  bodybuilding: "Bodybuilding",
  "hybrid-functional": "Hybrid / Functional",
  calisthenics: "Calisthenics",
  "mobility-recovery": "Mobility & Recovery",
  rucking: "Rucking",
  bodyweight: "Bodyweight",
};

const ALL_SLUGS = Object.values(INTEREST_TO_SLUG);

const BREATH_PHASES = ["Inhale", "Hold", "Exhale", "Hold"];
const BREATH_SCALE = [1.2, 1.2, 0.82, 0.82];
const BREATH_COLORS = ["#C45B28", "#7A5228", "#3A6A4A", "#7A5228"];

type Step = 1 | 2 | 3 | "done";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function suggestWorkout(interests: string[] | null): { slug: string; name: string } {
  const slugs =
    interests && interests.length > 0
      ? interests.map((i) => INTEREST_TO_SLUG[i]).filter(Boolean)
      : ALL_SLUGS;
  const pool = slugs.length > 0 ? slugs : ALL_SLUGS;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const slug = pool[dayOfYear % pool.length];
  return { slug, name: `${SLUG_LABELS[slug]} Workout` };
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = Array.from(
    new Set(dates.map((d) => new Date(d).toLocaleDateString("en-CA")))
  ).sort((a, b) => (a > b ? -1 : 1));
  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
  if (unique[0] !== today && unique[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const diff = Math.round(
      (new Date(unique[i - 1]).getTime() - new Date(unique[i]).getTime()) / 86400000
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const [step, setStep] = useState<Step>(1);
  const [workout, setWorkout] = useState<{ slug: string; name: string } | null>(null);

  // Step 2 breathing state
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathCount, setBreathCount] = useState(4);
  const [resetTimer, setResetTimer] = useState(120);
  const [resetDone, setResetDone] = useState(false);

  // Step 3 reflect state
  const [heavy, setHeavy] = useState("");
  const [handled, setHandled] = useState("");
  const [saving, setSaving] = useState(false);

  // Done screen
  const [finalScore, setFinalScore] = useState(0);
  const [finalStreak, setFinalStreak] = useState(0);

  // Load user interests on mount
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("interests")
        .eq("id", user.id)
        .single();
      setWorkout(suggestWorkout((data?.interests as string[] | null) ?? null));
    }
    load();
  }, []);

  // Breathing countdown (step 2 only)
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setBreathCount((prev) => {
        if (prev === 1) {
          setBreathPhase((p) => (p + 1) % 4);
          return 4;
        }
        return prev - 1;
      });
      setResetTimer((prev) => {
        if (prev <= 1) {
          setResetDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const completeStep1 = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && workout) {
      await supabase.from("workout_logs").insert({
        user_id: user.id,
        workout_name: workout.name,
        duration_minutes: 10,
        exercises_completed: 3,
      });
    }
    setStep(2);
  }, [workout]);

  const completeStep2 = useCallback(
    async (completed: boolean) => {
      if (completed) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("mood_checkins").insert({
            user_id: user.id,
            mood: "Solid",
          });
        }
      }
      setStep(3);
    },
    []
  );

  const completeStep3 = useCallback(async () => {
    if (!heavy.trim() && !handled.trim()) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    // Save journal entry — use combined entry string for NOT NULL compat
    const { data: journalData } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      entry: [heavy.trim(), handled.trim()].filter(Boolean).join(" | ") || "–",
      pissed_off: heavy.trim() || null,
      handled_well: handled.trim() || null,
    }).select("id").single();

    // Fire-and-forget sentiment analysis on journal entry
    if (journalData?.id) {
      const entryText = [heavy.trim(), handled.trim()].filter(Boolean).join(" ");
      supabase.functions.invoke("analyze-sentiment", {
        body: {
          text: entryText,
          user_id: user.id,
          entry_type: "journal_entry",
          entry_id: journalData.id,
        },
      }).catch(() => {});
    }

    // Calculate final score and streak
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [workoutsRes, moodsRes, journalsRes, mealsRes, workoutsAllRes, moodsAllRes] =
      await Promise.all([
        supabase.from("workout_logs").select("created_at").eq("user_id", user.id).gte("created_at", todayISO),
        supabase.from("mood_checkins").select("created_at").eq("user_id", user.id).gte("created_at", todayISO),
        supabase.from("journal_entries").select("created_at").eq("user_id", user.id).gte("created_at", todayISO),
        supabase.from("meal_logs").select("created_at").eq("user_id", user.id).gte("created_at", todayISO),
        supabase.from("workout_logs").select("created_at").eq("user_id", user.id),
        supabase.from("mood_checkins").select("created_at").eq("user_id", user.id),
      ]);

    const score =
      ((workoutsRes.data?.length ?? 0) > 0 ? 40 : 0) +
      ((moodsRes.data?.length ?? 0) > 0 ? 20 : 0) +
      ((journalsRes.data?.length ?? 0) > 0 ? 20 : 0) +
      ((mealsRes.data?.length ?? 0) > 0 ? 20 : 0);

    const allDates = [
      ...(workoutsAllRes.data ?? []).map((r) => r.created_at),
      ...(moodsAllRes.data ?? []).map((r) => r.created_at),
    ];

    setFinalScore(score);
    setFinalStreak(calcStreak(allDates));
    setSaving(false);
    setStep("done");
  }, [heavy, handled]);

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-lg w-full mx-auto flex flex-col gap-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back to dashboard"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path
                d="M13 4L7 10L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {step !== "done" && (
            <div className="flex items-center gap-2">
              {([1, 2, 3] as const).map((s) => (
                <div
                  key={s}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: step === s ? "2rem" : "0.75rem",
                    backgroundColor: step >= s ? "#C45B28" : "#252525",
                  }}
                />
              ))}
            </div>
          )}
        </header>

        {step === 1 && <StepTrain workout={workout} onDone={completeStep1} />}
        {step === 2 && (
          <StepReset
            breathPhase={breathPhase}
            breathCount={breathCount}
            timeLeft={resetTimer}
            done={resetDone}
            onDone={completeStep2}
          />
        )}
        {step === 3 && (
          <StepReflect
            heavy={heavy}
            handled={handled}
            onHeavyChange={setHeavy}
            onHandledChange={setHandled}
            saving={saving}
            onSave={completeStep3}
          />
        )}
        {step === "done" && <DoneScreen score={finalScore} streak={finalStreak} />}

      </div>
    </main>
  );
}

// ─── Step 1: Train ────────────────────────────────────────────────────────────

function StepTrain({
  workout,
  onDone,
}: {
  workout: { slug: string; name: string } | null;
  onDone: () => void;
}) {
  const [started, setStarted] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
        >
          Step 1 of 3 · Train
        </p>
        <h1
          className="text-5xl font-bold uppercase leading-tight"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          {workout?.name ?? "Today's Workout"}
        </h1>
        <p className="text-sm mt-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          10 min · 3 exercises · Build the habit, then build the body.
        </p>
      </div>

      <div
        className="px-6 py-5 flex flex-col gap-3"
        style={{
          backgroundColor: "#161616",
          border: "1px solid #252525",
          borderRadius: "12px",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
        >
          Today&apos;s session
        </p>
        <p className="text-sm" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
          {workout ? `${workout.name} — 10 minutes, 3 exercises.` : "Loading…"}
        </p>
        {workout && (
          <a
            href={`/dashboard/body/${workout.slug}?time=10`}
            onClick={() => setStarted(true)}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            View Workout →
          </a>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {!started && (
          <button
            onClick={() => setStarted(true)}
            className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.99]"
            style={{
              backgroundColor: "transparent",
              border: "1px solid #C45B28",
              color: "#C45B28",
              borderRadius: "12px",
              fontFamily: "var(--font-inter)",
              fontWeight: 700,
            }}
          >
            Start Workout
          </button>
        )}
        <button
          onClick={onDone}
          className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            backgroundColor: "#C45B28",
            color: "#0A0A0A",
            borderRadius: "12px",
            fontFamily: "var(--font-inter)",
            fontWeight: 700,
          }}
        >
          {started ? "Workout Done →" : "Mark as Done →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Reset ────────────────────────────────────────────────────────────

function StepReset({
  breathPhase,
  breathCount,
  timeLeft,
  done,
  onDone,
}: {
  breathPhase: number;
  breathCount: number;
  timeLeft: number;
  done: boolean;
  onDone: (completed: boolean) => void;
}) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const phase = BREATH_PHASES[breathPhase];
  const color = BREATH_COLORS[breathPhase];
  const scale = BREATH_SCALE[breathPhase];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
          style={{ color: "#7A5228", fontFamily: "var(--font-inter)" }}
        >
          Step 2 of 3 · Reset
        </p>
        <h1
          className="text-5xl font-bold uppercase leading-tight"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          Box Breathing
        </h1>
        <p className="text-sm mt-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          2 minutes. Drop the cortisol. Sharpen the edge.
        </p>
      </div>

      {/* Breathing visual */}
      <div className="flex flex-col items-center gap-6 py-6">
        <div
          className="flex items-center justify-center"
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            border: `3px solid ${color}`,
            transform: `scale(${scale})`,
            transition: "transform 1s ease, border-color 1s ease",
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-oswald)", color, transition: "color 1s ease" }}
            >
              {breathCount}
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color, fontFamily: "var(--font-inter)", transition: "color 1s ease" }}
            >
              {phase}
            </span>
          </div>
        </div>

        <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          {done ? "Complete" : `${mins}:${secs.toString().padStart(2, "0")} remaining`}
        </p>
      </div>

      <p
        className="text-center text-xs uppercase tracking-widest"
        style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}
      >
        Inhale 4 · Hold 4 · Exhale 4 · Hold 4
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => onDone(true)}
          disabled={!done}
          className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-30"
          style={{
            backgroundColor: "#C45B28",
            color: "#0A0A0A",
            borderRadius: "12px",
            fontFamily: "var(--font-inter)",
            fontWeight: 700,
          }}
        >
          Reset Complete →
        </button>
        {!done && (
          <button
            onClick={() => onDone(false)}
            className="w-full py-3 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
          >
            Skip →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Reflect ──────────────────────────────────────────────────────────

function StepReflect({
  heavy,
  handled,
  onHeavyChange,
  onHandledChange,
  saving,
  onSave,
}: {
  heavy: string;
  handled: string;
  onHeavyChange: (v: string) => void;
  onHandledChange: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const canSave = heavy.trim() || handled.trim();

  const taStyle = {
    backgroundColor: "#0A0A0A",
    border: "1px solid #252525",
    borderRadius: "8px",
    color: "#E8E2D8",
    fontFamily: "var(--font-inter)",
    resize: "none" as const,
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
          style={{ color: "#3A5A3A", fontFamily: "var(--font-inter)" }}
        >
          Step 3 of 3 · Reflect
        </p>
        <h1
          className="text-5xl font-bold uppercase leading-tight"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          End of Day
        </h1>
        <p className="text-sm mt-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          Two minutes. No filter.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-bold"
            style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
          >
            What&apos;s heavy right now?
          </label>
          <textarea
            rows={4}
            value={heavy}
            onChange={(e) => onHeavyChange(e.target.value)}
            placeholder="The thing that's been sitting in your chest all day."
            className="w-full px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#C45B28]"
            style={taStyle}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-bold"
            style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
          >
            What did you handle well today?
          </label>
          <textarea
            rows={4}
            value={handled}
            onChange={(e) => onHandledChange(e.target.value)}
            placeholder="One win. Big or small."
            className="w-full px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#C45B28]"
            style={taStyle}
          />
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={!canSave || saving}
        className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-30"
        style={{
          backgroundColor: "#C45B28",
          color: "#0A0A0A",
          borderRadius: "12px",
          fontFamily: "var(--font-inter)",
          fontWeight: 700,
        }}
      >
        {saving ? "Saving…" : "Save & Finish →"}
      </button>
    </div>
  );
}

// ─── Done Screen ──────────────────────────────────────────────────────────────

function DoneScreen({ score, streak }: { score: number; streak: number }) {
  return (
    <div className="flex flex-col items-center gap-10 py-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
        >
          Day Complete
        </p>
        <h1
          className="text-6xl font-bold uppercase"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          Built.
        </h1>
        <p
          className="text-sm max-w-xs leading-relaxed"
          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
        >
          You showed up for your body, your mind, and your crew. That&apos;s the work.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        <div
          className="flex flex-col items-center py-7 gap-1"
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: "12px",
          }}
        >
          <span
            className="text-4xl font-bold leading-none"
            style={{
              fontFamily: "var(--font-oswald)",
              color: score === 100 ? "#4CAF50" : "#C45B28",
            }}
          >
            {score}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
          >
            Score / 100
          </span>
        </div>

        <div
          className="flex flex-col items-center py-7 gap-1"
          style={{
            backgroundColor: "#0D1B2A",
            border: "1px solid #1E3A5F",
            borderRadius: "12px",
          }}
        >
          <span
            className="text-4xl font-bold leading-none"
            style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
          >
            {streak}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
          >
            Day Streak
          </span>
        </div>
      </div>

      <Link
        href="/dashboard"
        className="w-full max-w-xs flex items-center justify-center py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.99]"
        style={{
          backgroundColor: "#C45B28",
          color: "#0A0A0A",
          borderRadius: "12px",
          fontFamily: "var(--font-inter)",
          fontWeight: 700,
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
