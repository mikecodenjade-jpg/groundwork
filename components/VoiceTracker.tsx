"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

type ParsedSet = {
  exercise: string;
  weight: number | null;
  reps: number | null;
  sets: number;
};

type Phase = "idle" | "listening" | "parsed" | "saving" | "saved" | "error";

// ─── Known exercises for fuzzy matching ──────────────────────────────────────

const KNOWN_EXERCISES = [
  "bench press",
  "incline bench press",
  "decline bench press",
  "dumbbell bench press",
  "squat",
  "back squat",
  "front squat",
  "goblet squat",
  "deadlift",
  "sumo deadlift",
  "romanian deadlift",
  "overhead press",
  "military press",
  "shoulder press",
  "barbell row",
  "bent over row",
  "dumbbell row",
  "cable row",
  "seated row",
  "pull up",
  "pullup",
  "chin up",
  "lat pulldown",
  "bicep curl",
  "hammer curl",
  "tricep extension",
  "skull crusher",
  "tricep pushdown",
  "lateral raise",
  "front raise",
  "face pull",
  "leg press",
  "leg curl",
  "leg extension",
  "calf raise",
  "hip thrust",
  "lunge",
  "walking lunge",
  "bulgarian split squat",
  "pushup",
  "push up",
  "dip",
  "chest fly",
  "cable fly",
  "shrug",
  "plank",
  "crunch",
  "sit up",
];

function fuzzyMatch(input: string): string {
  const lower = input.toLowerCase().trim();
  if (!lower) return "Unknown Exercise";

  // Exact match
  const exact = KNOWN_EXERCISES.find((e) => e === lower);
  if (exact) return titleCase(exact);

  // Contains match — pick longest matching exercise name
  let best = "";
  for (const ex of KNOWN_EXERCISES) {
    if (lower.includes(ex) && ex.length > best.length) best = ex;
  }
  if (best) return titleCase(best);

  // Partial word overlap
  const words = lower.split(/\s+/);
  let topScore = 0;
  let topMatch = "";
  for (const ex of KNOWN_EXERCISES) {
    const exWords = ex.split(/\s+/);
    const score = words.filter((w) => exWords.some((ew) => ew.startsWith(w) || w.startsWith(ew))).length;
    if (score > topScore) {
      topScore = score;
      topMatch = ex;
    }
  }
  if (topScore > 0) return titleCase(topMatch);

  // Fallback: title-case whatever they said
  return titleCase(lower);
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Speech parsing ──────────────────────────────────────────────────────────

function parseSpeech(raw: string): ParsedSet {
  const text = raw.toLowerCase().replace(/[.,!?]/g, "");
  const tokens = text.split(/\s+/);

  let weight: number | null = null;
  let reps: number | null = null;
  let sets = 1;
  const exerciseTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const num = parseNumber(tok);
    const next = tokens[i + 1] ?? "";

    if (num !== null) {
      if (next === "pounds" || next === "lbs" || next === "lb") {
        weight = num;
        i++; // skip "pounds"
      } else if (next === "reps" || next === "rep" || next === "times") {
        reps = num;
        i++;
      } else if (next === "sets" || next === "set") {
        sets = num;
        i++;
      } else if (next === "for" && i + 2 < tokens.length) {
        // "225 for 5" pattern
        const afterFor = parseNumber(tokens[i + 2]);
        if (afterFor !== null) {
          weight = num;
          reps = afterFor;
          i += 2;
          continue;
        }
        exerciseTokens.push(tok);
      } else if (weight === null && num > 20) {
        // Bare large number — likely weight
        weight = num;
      } else if (reps === null && num <= 100) {
        // Bare small number — likely reps
        reps = num;
      } else {
        exerciseTokens.push(tok);
      }
    } else if (
      tok !== "just" &&
      tok !== "did" &&
      tok !== "of" &&
      tok !== "for" &&
      tok !== "at" &&
      tok !== "with" &&
      tok !== "a" &&
      tok !== "the" &&
      tok !== "i" &&
      tok !== "my"
    ) {
      exerciseTokens.push(tok);
    }
  }

  const exercise = fuzzyMatch(exerciseTokens.join(" "));

  return { exercise, weight, reps, sets };
}

function parseNumber(tok: string): number | null {
  // Handle spoken numbers
  const map: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
  };
  if (map[tok]) return map[tok];
  const n = Number(tok);
  return isFinite(n) && n > 0 ? n : null;
}

// ─── Tooltip helper ──────────────────────────────────────────────────────────

const TOOLTIP_KEY = "voiceTracker_tooltipCount";

function shouldShowTooltip(): boolean {
  if (typeof window === "undefined") return false;
  const count = Number(localStorage.getItem(TOOLTIP_KEY) ?? "0");
  return count < 3;
}

function incrementTooltip() {
  if (typeof window === "undefined") return;
  const count = Number(localStorage.getItem(TOOLTIP_KEY) ?? "0");
  localStorage.setItem(TOOLTIP_KEY, String(count + 1));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VoiceTracker() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [parsed, setParsed] = useState<ParsedSet | null>(null);
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check tooltip on mount
  useEffect(() => {
    if (shouldShowTooltip()) {
      setShowTooltip(true);
      incrementTooltip();
    }
  }, []);

  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!supported) {
      setErrorMsg("Speech recognition not supported. Try Chrome.");
      setPhase("error");
      return;
    }

    setShowTooltip(false);
    setPhase("listening");
    setTranscript("");
    setParsed(null);
    setErrorMsg("");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      const result = parseSpeech(text);
      setParsed(result);
      setPhase("parsed");
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        setErrorMsg("No speech detected. Try again.");
      } else if (event.error === "not-allowed") {
        setErrorMsg("Microphone access denied.");
      } else {
        setErrorMsg("Could not recognize speech. Try again.");
      }
      setPhase("error");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (phase === "listening") setPhase("idle");
  }, [phase]);

  const save = useCallback(async () => {
    if (!parsed) return;
    setPhase("saving");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg("Not logged in.");
      setPhase("error");
      return;
    }

    await supabase.from("workout_logs").insert({
      user_id: user.id,
      exercise_name: parsed.exercise,
      weight_lbs: parsed.weight,
      reps: parsed.reps,
      sets: parsed.sets,
      source: "voice",
    });

    setPhase("saved");
    setTimeout(() => {
      setPhase("idle");
      setParsed(null);
      setTranscript("");
    }, 1500);
  }, [parsed]);

  const dismiss = useCallback(() => {
    setPhase("idle");
    setParsed(null);
    setTranscript("");
    setErrorMsg("");
  }, []);

  return (
    <>
      {/* ── Confirmation / result card ─────────────────────────────────── */}
      {(phase === "listening" || phase === "parsed" || phase === "saving" || phase === "saved" || phase === "error") && (
        <div
          className="fixed left-4 right-4 z-50"
          style={{ bottom: 200 }}
        >
          <div
            className="mx-auto max-w-md px-5 py-4"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
            }}
          >
            {/* Listening state */}
            {phase === "listening" && (
              <div className="flex flex-col items-center gap-3 py-2">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                >
                  Listening...
                </p>
                {/* Sound wave animation */}
                <div className="flex items-end gap-1" style={{ height: 24 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 4,
                        backgroundColor: "#C45B28",
                        borderRadius: 2,
                        animation: `voiceWave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes voiceWave {
                    0%   { height: 6px; }
                    100% { height: 22px; }
                  }
                ` }} />
                <button
                  onClick={stopListening}
                  className="text-xs mt-1"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Parsed confirmation */}
            {phase === "parsed" && parsed && (
              <div className="flex flex-col gap-3">
                <p
                  className="text-xs"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Heard: &ldquo;{transcript}&rdquo;
                </p>
                <p
                  className="text-base font-bold text-center"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                >
                  {parsed.exercise}
                  {parsed.weight != null && ` — ${parsed.weight} lbs`}
                  {parsed.reps != null && ` × ${parsed.reps} reps`}
                  {parsed.sets > 1 && ` × ${parsed.sets} sets`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={save}
                    className="flex-1 py-2.5 text-sm font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: "#C45B28",
                      color: "#0A0A0A",
                      borderRadius: "8px",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={startListening}
                    className="flex-1 py-2.5 text-sm font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: "#0A0A0A",
                      color: "#9A9A9A",
                      border: "1px solid #252525",
                      borderRadius: "8px",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    Re-record
                  </button>
                </div>
              </div>
            )}

            {/* Saving */}
            {phase === "saving" && (
              <p
                className="text-sm text-center py-2"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Saving...
              </p>
            )}

            {/* Saved */}
            {phase === "saved" && (
              <p
                className="text-sm text-center py-2 font-semibold"
                style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}
              >
                Logged!
              </p>
            )}

            {/* Error */}
            {phase === "error" && (
              <div className="flex flex-col items-center gap-2 py-2">
                <p
                  className="text-sm text-center"
                  style={{ color: "#E87070", fontFamily: "var(--font-inter)" }}
                >
                  {errorMsg}
                </p>
                <button
                  onClick={dismiss}
                  className="text-xs"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Floating mic button ────────────────────────────────────────── */}
      <div className="fixed z-50" style={{ bottom: 140, right: 20 }}>
        {/* Tooltip */}
        {showTooltip && phase === "idle" && (
          <div
            className="absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5"
            style={{
              backgroundColor: "#252525",
              borderRadius: "6px",
              color: "#9A9A9A",
              fontSize: "11px",
              fontFamily: "var(--font-inter)",
            }}
          >
            Tap to log by voice
          </div>
        )}

        <button
          onClick={phase === "listening" ? stopListening : startListening}
          className="flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-90"
          style={{
            width: 56,
            height: 56,
            backgroundColor: phase === "listening" ? "#E83030" : "#C45B28",
            animation: phase === "listening" ? "micPulse 1.2s ease-in-out infinite" : "none",
          }}
          aria-label={phase === "listening" ? "Stop listening" : "Log set by voice"}
        >
          {/* Mic SVG */}
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" fill="#0A0A0A" />
            <path d="M5 10a7 7 0 0 0 14 0" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="22" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes micPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(232,48,48,0.5); }
            50%      { box-shadow: 0 0 0 14px rgba(232,48,48,0); }
          }
        ` }} />
      </div>
    </>
  );
}
