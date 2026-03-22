"use client";

import Link from "next/link";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

const MOODS = [
  { label: "Low", value: 1, color: "#5A3A3A" },
  { label: "Rough", value: 2, color: "#7A5228" },
  { label: "Mid", value: 3, color: "#5A5248" },
  { label: "Good", value: 4, color: "#3A5A3A" },
  { label: "High", value: 5, color: "#2A6A4A" },
];

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

export default function MindPage() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

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
            style={{ border: "1px solid #2A2A2A", color: "#7A7268" }}
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
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
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
        <section style={{ border: "1px solid #1E1E1E", backgroundColor: "#111111" }}>
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #1E1E1E" }}>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
            >
              Daily Check-In
            </p>
            <h2
              className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              How are you doing today — really?
            </h2>
          </div>

          <div className="px-8 py-6 flex flex-col gap-5">
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(({ label, value, color }) => {
                const active = selectedMood === value;
                return (
                  <button
                    key={value}
                    onClick={() => setSelectedMood(value)}
                    className="flex-1 min-w-[72px] py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
                    style={{
                      fontFamily: "var(--font-oswald)",
                      backgroundColor: active ? color : "#141414",
                      color: active ? "#E8E2D8" : "#7A7268",
                      border: `1px solid ${active ? color : "#2A2A2A"}`,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {selectedMood && (
              <p className="text-sm" style={{ color: "#7A7268" }}>
                {selectedMood <= 2
                  ? "Noted. That's real — and it matters. Try the Stress Reset below."
                  : selectedMood === 3
                  ? "Solid. Let's sharpen that edge. Box Breathing is a good place to start."
                  : "That's what we're building toward. Keep it going."}
              </p>
            )}
          </div>
        </section>

        {/* Tools */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
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
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Professional Support
          </p>
          <div
            className="px-8 py-7 flex flex-col gap-5"
            style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}
          >
            <p
              className="text-lg font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              You don&apos;t have to carry it alone.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
              Construction has one of the highest suicide rates of any industry —
              more than four times the national average. The pressure is real.
              The weight is real. And reaching out is one of the strongest things
              a leader can do.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
              If you or someone on your crew is struggling, the{" "}
              <strong style={{ color: "#E8E2D8" }}>988 Suicide &amp; Crisis Lifeline</strong>{" "}
              is free, confidential, and available 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:988"
                className="flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "var(--font-oswald)",
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
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
                  fontFamily: "var(--font-oswald)",
                  color: "#E8E2D8",
                  border: "1px solid #2A2A2A",
                }}
              >
                Text 988
              </a>
            </div>
            <p className="text-xs" style={{ color: "#3A3A3A" }}>
              Free · Confidential · Available 24/7
            </p>
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}

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
        backgroundColor: "#111111",
        border: `1px solid ${hovered ? "#C45B28" : "#1E1E1E"}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Text */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3
              className="text-xl font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              {title}
            </h3>
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
              style={{
                color: "#7A7268",
                border: "1px solid #2A2A2A",
                fontFamily: "var(--font-oswald)",
              }}
            >
              {tag}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
            {desc}
          </p>
        </div>

        {/* Duration + CTA */}
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
          <span
            className="text-sm font-bold"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            {duration}
          </span>
          <button
            className="text-xs font-bold uppercase tracking-widest px-5 py-2 transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-oswald)",
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
            }}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
