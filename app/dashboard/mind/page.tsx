"use client";

import Link from "next/link";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const MOODS = [
  { label: "Locked In",  value: "locked_in",  color: "#2A6A4A" },
  { label: "Solid",      value: "solid",       color: "#3A5A3A" },
  { label: "Off",        value: "off",         color: "#5A5248" },
  { label: "Burned Out", value: "burned_out",  color: "#7A5228" },
  { label: "In Trouble", value: "in_trouble",  color: "#5A1A1A" },
];

const SOURCES = ["Work", "Family", "Money", "Health", "Sleep"];

const MOOD_MESSAGES: Record<string, string> = {
  locked_in:  "That's the standard. Lock it in and go.",
  solid:      "Good base. Push the edge today.",
  off:        "Noted. That's real — it matters. What's driving it?",
  burned_out: "Acknowledged. Rest isn't quitting. What's the source?",
  in_trouble: "Takes guts to say that. You're not alone — what's weighing on you?",
};

type Phase = "mood" | "source" | "done";

const TOOLS = [
  {
    title: "Stress Reset",
    duration: "5 min",
    desc: "A quick guided sequence to drop cortisol and reset your nervous system between tasks or after a hard conversation.",
    tag: "Breathing + Grounding",
  },
  {
    title: "Box Breathing",
    duration: "4 min",
    desc: "Inhale, hold, exhale, hold — four counts each. Used by special forces to stay sharp under pressure. Works on a jobsite too.",
    tag: "Breathwork",
  },
  {
    title: "Sleep Protocol",
    duration: "10 min",
    desc: "A wind-down routine built around the realities of late nights and early starts. Better sleep, better decisions.",
    tag: "Recovery",
  },
  {
    title: "Time Blocking",
    duration: "Daily",
    desc: "Structure your day before the day structures you. A simple system for leaders who are pulled in every direction.",
    tag: "Planning",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MindPage() {
  const [phase, setPhase] = useState<Phase>("mood");
  const [selectedMood, setSelectedMood] = useState<(typeof MOODS)[number] | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleMoodSelect(mood: (typeof MOODS)[number]) {
    setSelectedMood(mood);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPhase("source");
      return;
    }

    const { data } = await supabase
      .from("mood_checkins")
      .insert({ user_id: user.id, mood: mood.label })
      .select("id")
      .single();

    if (data?.id) setSavedId(data.id);
    setPhase("source");
  }

  async function handleSourceSelect(source: string) {
    if (savedId) {
      await supabase.from("mood_checkins").update({ source }).eq("id", savedId);
    }
    setPhase("done");
  }

  function reset() {
    setPhase("mood");
    setSelectedMood(null);
    setSavedId(null);
  }

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-12">

        {/* Header */}
        <header className="flex items-center gap-5">
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
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Pillar
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Mind
            </h1>
          </div>
        </header>

        {/* Daily Check-In */}
        <section
          style={{
            border: "1px solid #252525",
            backgroundColor: "#161616",
            borderRadius: "12px",
          }}
        >
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #252525" }}>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Daily Check-In
            </p>
            <h2
              className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              {phase === "mood"
                ? "How are you right now — really?"
                : phase === "source"
                ? "What's the source?"
                : "Checked in."}
            </h2>
            {phase === "mood" && (
              <p className="text-sm mt-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                One tap. Under 10 seconds.
              </p>
            )}
          </div>

          <div className="px-8 py-6 flex flex-col gap-4">

            {/* Phase: Mood selection */}
            {phase === "mood" && (
              <div className="flex flex-col gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodSelect(mood)}
                    className="w-full flex items-center justify-between px-6 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-[0.99] hover:opacity-90"
                    style={{
                      fontFamily: "var(--font-inter)",
                      backgroundColor: "#0A0A0A",
                      color: "#E8E2D8",
                      border: "1px solid #252525",
                      borderRadius: "8px",
                      height: "56px",
                    }}
                  >
                    {mood.label}
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: mood.color }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Phase: Source selection */}
            {phase === "source" && (
              <>
                {selectedMood && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-lg"
                    style={{ backgroundColor: "#0A0A0A", border: `1px solid ${selectedMood.color}` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: selectedMood.color }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {MOOD_MESSAGES[selectedMood.value]}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {SOURCES.map((source) => (
                    <button
                      key={source}
                      onClick={() => handleSourceSelect(source)}
                      className="flex-1 min-w-[80px] flex items-center justify-center px-4 text-sm font-bold uppercase tracking-widest transition-all active:scale-95 hover:opacity-90"
                      style={{
                        fontFamily: "var(--font-inter)",
                        backgroundColor: "#0A0A0A",
                        color: "#E8E2D8",
                        border: "1px solid #252525",
                        borderRadius: "8px",
                        height: "56px",
                      }}
                    >
                      {source}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPhase("done")}
                  className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 text-left"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Skip →
                </button>
              </>
            )}

            {/* Phase: Done */}
            {phase === "done" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: selectedMood?.color ?? "#C45B28" }}
                  >
                    <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
                      <path
                        d="M4 10l4 4 8-8"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                    >
                      {selectedMood?.label} — logged.
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {selectedMood ? MOOD_MESSAGES[selectedMood.value] : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={reset}
                  className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 text-left"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  + Check in again
                </button>
              </div>
            )}

          </div>
        </section>

        {/* Tools */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Tools
          </p>
          <div className="flex flex-col gap-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.title} {...tool} />
            ))}
          </div>
        </section>

        {/* Professional Support */}
        <section className="pb-28">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Professional Support
          </p>
          <div
            className="px-8 py-7 flex flex-col gap-5"
            style={{
              backgroundColor: "#0D1B2A",
              border: "1px solid #1E3A5F",
              borderRadius: "12px",
            }}
          >
            <p
              className="text-lg font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              You don&apos;t have to carry it alone.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Construction has one of the highest suicide rates of any industry — more than
              four times the national average. The pressure is real. The weight is real. And
              reaching out is one of the strongest things a leader can do.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              If you or someone on your crew is struggling, the{" "}
              <strong style={{ color: "#E8E2D8" }}>988 Suicide &amp; Crisis Lifeline</strong>{" "}
              is free, confidential, and available 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:988"
                className="flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                  borderRadius: "8px",
                  minHeight: "48px",
                }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Call 988
              </a>
              <a
                href="sms:988"
                className="flex items-center justify-center px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  color: "#C45B28",
                  border: "1px solid #C45B28",
                  borderRadius: "8px",
                  minHeight: "48px",
                }}
              >
                Text 988
              </a>
            </div>
            <p
              className="text-xs"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Free · Confidential · Available 24/7
            </p>
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}

// ─── Tool Card ────────────────────────────────────────────────────────────────

function ToolCard({
  title,
  duration,
  desc,
  tag,
}: {
  title: string;
  duration: string;
  desc: string;
  tag: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="transition-all duration-150"
      style={{
        backgroundColor: "#161616",
        border: `1px solid ${hovered ? "#C45B28" : "#252525"}`,
        borderRadius: "12px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3
              className="text-xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              {title}
            </h3>
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
              style={{
                color: "#9A9A9A",
                border: "1px solid #252525",
                borderRadius: "8px",
                fontFamily: "var(--font-inter)",
              }}
            >
              {tag}
            </span>
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
          >
            {desc}
          </p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
          <span
            className="text-sm font-bold"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            {duration}
          </span>
          <button
            className="text-xs font-bold uppercase tracking-widest px-5 py-2 transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-inter)",
              fontWeight: 600,
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
              borderRadius: "8px",
              minHeight: "48px",
            }}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
