"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WORKOUTS, type Exercise } from "../workouts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "idle" | "exercise" | "rest" | "complete";

// ─── Circular Timer ───────────────────────────────────────────────────────────

function CircularTimer({
  timeLeft,
  total,
  isRest,
}: {
  timeLeft: number;
  total: number;
  isRest: boolean;
}) {
  const size = 200;
  const sw = 12;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? timeLeft / total : 0;
  const offset = circ * (1 - progress);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const label = `${mins}:${String(secs).padStart(2, "0")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${label} remaining`}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1e1e1e"
        strokeWidth={sw}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={isRest ? "#6366f1" : "#C45B28"}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.85s linear" }}
      />
      {/* Time */}
      <text
        x={size / 2}
        y={size / 2 - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#E8E2D8"
        fontSize="40"
        fontWeight="700"
        fontFamily="var(--font-oswald)"
        letterSpacing="1"
      >
        {label}
      </text>
      {/* Phase label */}
      <text
        x={size / 2}
        y={size / 2 + 22}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isRest ? "#6366f1" : "#C45B28"}
        fontSize="11"
        fontWeight="700"
        fontFamily="var(--font-inter)"
        letterSpacing="3"
        textDecoration="none"
      >
        {isRest ? "REST" : "GO"}
      </text>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkoutPlayerPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = use(params);
  const router = useRouter();

  const workout = WORKOUTS.find((w) => w.id === workoutId);

  const [phase, setPhase] = useState<Phase>("idle");
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMarked, setIsMarked] = useState(false);

  // Refs so interval callbacks always read current values without stale closures
  const phaseRef = useRef<Phase>("idle");
  const exerciseIdxRef = useRef(0);

  // Sync refs
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    exerciseIdxRef.current = exerciseIdx;
  }, [exerciseIdx]);

  // ── Speech ──────────────────────────────────────────────────────────────────

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95;
      utt.pitch = 1.0;
      utt.volume = 1.0;
      synth.speak(utt);
    } catch {
      // Speech not available — silent fallback
    }
  }, []);

  // ── Timer interval ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === "idle" || phase === "complete" || isPaused || !workout) return;

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t === 1) {
          // Schedule phase transition on next tick
          const currentPhase = phaseRef.current;
          const currentIdx = exerciseIdxRef.current;

          setTimeout(() => {
            if (currentPhase === "exercise") {
              if (currentIdx < workout.exercises.length - 1) {
                const nextEx = workout.exercises[currentIdx + 1];
                speak(`Rest. Next up: ${nextEx.name}`);
                phaseRef.current = "rest";
                setPhase("rest");
                setTotalTime(workout.restDuration);
                setTimeLeft(workout.restDuration);
              } else {
                speak("Workout complete. Great work!");
                phaseRef.current = "complete";
                setPhase("complete");
              }
            } else if (currentPhase === "rest") {
              const nextIdx = currentIdx + 1;
              const nextEx = workout.exercises[nextIdx];
              speak(`${nextEx.name}. Go!`);
              exerciseIdxRef.current = nextIdx;
              setExerciseIdx(nextIdx);
              phaseRef.current = "exercise";
              setPhase("exercise");
              setTotalTime(nextEx.duration);
              setTimeLeft(nextEx.duration);
            }
          }, 0);

          return 0;
        }

        if (t === 0) return 0;

        // "3, 2, 1" cue before exercise starts
        if (phaseRef.current === "rest" && t === 4) {
          setTimeout(() => speak("3, 2, 1"), 0);
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [phase, isPaused, workout, speak]);

  // ── Controls ─────────────────────────────────────────────────────────────────

  function startWorkout() {
    if (!workout) return;
    const first = workout.exercises[0];
    speak(`${first.name}. Go!`);
    exerciseIdxRef.current = 0;
    setExerciseIdx(0);
    phaseRef.current = "exercise";
    setPhase("exercise");
    setTotalTime(first.duration);
    setTimeLeft(first.duration);
    setIsPaused(false);
  }

  function togglePause() {
    setIsPaused((p) => !p);
  }

  function skipCurrent() {
    if (!workout) return;
    const currentPhase = phaseRef.current;
    const currentIdx = exerciseIdxRef.current;

    if (currentPhase === "exercise") {
      if (currentIdx < workout.exercises.length - 1) {
        const nextEx = workout.exercises[currentIdx + 1];
        speak(`Rest. Next up: ${nextEx.name}`);
        phaseRef.current = "rest";
        setPhase("rest");
        setTotalTime(workout.restDuration);
        setTimeLeft(workout.restDuration);
      } else {
        speak("Workout complete. Great work!");
        phaseRef.current = "complete";
        setPhase("complete");
      }
    } else if (currentPhase === "rest") {
      const nextIdx = currentIdx + 1;
      const nextEx = workout.exercises[nextIdx];
      speak(`${nextEx.name}. Go!`);
      exerciseIdxRef.current = nextIdx;
      setExerciseIdx(nextIdx);
      phaseRef.current = "exercise";
      setPhase("exercise");
      setTotalTime(nextEx.duration);
      setTimeLeft(nextEx.duration);
    }
  }

  function markComplete() {
    if (!workout) return;
    try {
      const raw = localStorage.getItem("gw-cache:jobsite-fit-completions") ?? "{}";
      const completions = JSON.parse(raw);
      completions[workout.id] = Date.now();
      localStorage.setItem("gw-cache:jobsite-fit-completions", JSON.stringify(completions));
    } catch {
      // ignore
    }
    setIsMarked(true);
  }

  // ── 404 guard ────────────────────────────────────────────────────────────────

  if (!workout) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 gap-6"
        style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
      >
        <p style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          Workout not found.
        </p>
        <Link
          href="/dashboard/train/jobsite-fit"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)", fontSize: "14px" }}
        >
          ← Back to Jobsite Fit
        </Link>
      </main>
    );
  }

  const currentExercise: Exercise = workout.exercises[exerciseIdx];
  const nextExercise: Exercise | undefined = workout.exercises[exerciseIdx + 1];
  const totalExercises = workout.exercises.length;

  // ── Render helpers ────────────────────────────────────────────────────────────

  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "56px",
    borderRadius: "8px",
    fontFamily: "var(--font-inter)",
    fontWeight: 700,
    fontSize: "14px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    border: "none",
    cursor: "pointer",
    flex: 1,
    transition: "opacity 0.15s",
  };

  // ─── IDLE STATE ───────────────────────────────────────────────────────────────

  if (phase === "idle") {
    return (
      <main
        className="min-h-screen flex flex-col pb-10"
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
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Jobsite Fit
              </p>
              <h1
                className="text-2xl font-bold uppercase leading-tight"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                {workout.title}
              </h1>
            </div>
          </header>

          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: `${workout.duration} min`, color: "#9A9A9A" },
              { label: workout.difficulty, color: workout.difficulty === "Easy" ? "#22c55e" : workout.difficulty === "Medium" ? "#f97316" : "#ef4444" },
              { label: workout.targetArea, color: "#9A9A9A" },
              { label: `${totalExercises} exercises`, color: "#9A9A9A" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="px-3 py-1 text-xs font-semibold"
                style={{
                  color,
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "20px",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {workout.description}
          </p>

          {/* Audio note */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "8px" }}
          >
            <span style={{ fontSize: "18px" }}>🔊</span>
            <p className="text-xs" style={{ color: "#6B6B6B", fontFamily: "var(--font-inter)" }}>
              Audio cues are enabled. Turn up your volume — you&apos;ll hear exercise names and countdowns.
            </p>
          </div>

          {/* Exercise list */}
          <section>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-3"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Exercises
            </p>
            <div
              className="flex flex-col divide-y"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {workout.exercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderColor: "#252525" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold w-5 text-right flex-shrink-0"
                      style={{ color: "#444", fontFamily: "var(--font-inter)" }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                    >
                      {ex.name}
                    </span>
                  </div>
                  <span
                    className="text-xs font-semibold flex-shrink-0"
                    style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                  >
                    {ex.duration}s
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Start button */}
          <button
            onClick={startWorkout}
            className="touch-target active:scale-95 transition-all duration-150"
            style={{
              ...btnBase,
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
              width: "100%",
              marginTop: "8px",
            }}
          >
            Start Workout
          </button>

        </div>
      </main>
    );
  }

  // ─── COMPLETE STATE ───────────────────────────────────────────────────────────

  if (phase === "complete") {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 gap-8"
        style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
      >
        <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-scale-in">
          {/* Check circle */}
          <div
            className="flex items-center justify-center"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              backgroundColor: "#0d2a0d",
              border: "2px solid #22c55e",
            }}
          >
            <svg viewBox="0 0 40 40" fill="none" width={40} height={40} className="success-checkmark">
              <polyline
                points="8,22 17,30 32,12"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="text-center">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#22c55e", fontFamily: "var(--font-inter)" }}
            >
              Finished
            </p>
            <h2
              className="text-3xl font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              {workout.title}
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {totalExercises} exercises · {workout.duration} min
            </p>
          </div>

          {/* Mark complete */}
          {!isMarked ? (
            <button
              onClick={markComplete}
              className="touch-target active:scale-95 transition-all duration-150 w-full"
              style={{
                ...btnBase,
                backgroundColor: "#22c55e",
                color: "#0A0A0A",
                width: "100%",
              }}
            >
              Mark Complete
            </button>
          ) : (
            <div
              className="flex items-center justify-center gap-2 w-full py-3"
              style={{
                backgroundColor: "#0d2a0d",
                border: "1px solid #22c55e",
                borderRadius: "8px",
              }}
            >
              <span style={{ color: "#22c55e", fontFamily: "var(--font-inter)", fontSize: "14px", fontWeight: 700 }}>
                ✓ Saved to your history
              </span>
            </div>
          )}

          <Link
            href="/dashboard/train/jobsite-fit"
            className="text-sm"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)", textDecoration: "none" }}
          >
            ← Back to Jobsite Fit
          </Link>
        </div>
      </main>
    );
  }

  // ─── ACTIVE STATE (exercise | rest) ──────────────────────────────────────────

  const isRest = phase === "rest";

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid #161616" }}
      >
        <button
          onClick={() => {
            speak("");
            router.back();
          }}
          className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
          style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "4px", background: "none" }}
          aria-label="Exit workout"
        >
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
            <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
          >
            {workout.title}
          </p>
        </div>

        <span
          className="text-xs font-bold"
          style={{ color: "#444", fontFamily: "var(--font-inter)", minWidth: "48px", textAlign: "right" }}
        >
          {exerciseIdx + 1}/{totalExercises}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 py-8 gap-6 max-w-sm mx-auto w-full">

        {/* Exercise / Rest label */}
        <div className="text-center w-full">
          {isRest ? (
            <>
              <h2
                className="text-5xl font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#6366f1", letterSpacing: "2px" }}
              >
                Rest
              </h2>
              {nextExercise && (
                <p
                  className="mt-2 text-sm"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Next up
                </p>
              )}
              {nextExercise && (
                <p
                  className="mt-1 text-xl font-bold uppercase"
                  style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                >
                  {nextExercise.name}
                </p>
              )}
            </>
          ) : (
            <>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Exercise {exerciseIdx + 1} of {totalExercises}
              </p>
              <h2
                className="text-3xl font-bold uppercase leading-tight"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8", letterSpacing: "1px" }}
              >
                {currentExercise.name}
              </h2>
            </>
          )}
        </div>

        {/* Timer */}
        <CircularTimer
          timeLeft={timeLeft}
          total={totalTime}
          isRest={isRest}
        />

        {/* Instruction */}
        <div className="w-full text-center min-h-[60px] flex items-center justify-center">
          {!isRest && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              {currentExercise.instruction}
            </p>
          )}
          {isRest && nextExercise && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#6B6B6B", fontFamily: "var(--font-inter)" }}
            >
              {nextExercise.instruction}
            </p>
          )}
        </div>

        {/* Upcoming queue */}
        {!isRest && workout.exercises.slice(exerciseIdx + 1, exerciseIdx + 3).length > 0 && (
          <div
            className="w-full px-4 py-3"
            style={{ backgroundColor: "#111", border: "1px solid #1e1e1e", borderRadius: "8px" }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: "#444", fontFamily: "var(--font-inter)" }}
            >
              Coming up
            </p>
            {workout.exercises.slice(exerciseIdx + 1, exerciseIdx + 3).map((ex, i) => (
              <div
                key={ex.id}
                className="flex items-center justify-between py-1"
              >
                <span
                  className="text-xs"
                  style={{ color: "#555", fontFamily: "var(--font-inter)" }}
                >
                  {exerciseIdx + i + 2}. {ex.name}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "#444", fontFamily: "var(--font-inter)" }}
                >
                  {ex.duration}s
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 w-full pb-4">
          <button
            onClick={togglePause}
            className="touch-target active:scale-95 transition-all duration-150"
            style={{
              ...btnBase,
              backgroundColor: isPaused ? "#C45B28" : "#1e1e1e",
              color: isPaused ? "#0A0A0A" : "#E8E2D8",
              border: isPaused ? "none" : "1px solid #333",
            }}
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Resume
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </>
            )}
          </button>

          <button
            onClick={skipCurrent}
            className="touch-target active:scale-95 transition-all duration-150"
            style={{
              ...btnBase,
              backgroundColor: "#1e1e1e",
              color: "#9A9A9A",
              border: "1px solid #333",
            }}
            aria-label="Skip"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
              <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
              <path d="M15.75 4.5a.75.75 0 011.5 0v11.25a.75.75 0 01-1.5 0V4.5z" />
            </svg>
            Skip
          </button>
        </div>

      </div>
    </main>
  );
}
