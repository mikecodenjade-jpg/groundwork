"use client";

import Link from "next/link";
import { useState } from "react";
import DemoBanner from "@/components/DemoBanner";

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

export default function DemoMindPage() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  function handleMoodSelect(value: number) {
    setSelectedMood(value);
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <DemoBanner />

      <div className="px-6 py-10">
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-12 pb-16">

          {/* Header */}
          <header className="flex items-center gap-5">
            <Link
              href="/demo"
              className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
              style={{ border: "1px solid #252525", borderRadius: "8px", color: "#9A9A9A" }}
              aria-label="Back to demo dashboard"
            >
              <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
                <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <section style={{ border: "1px solid #252525", backgroundColor: "#161616", borderRadius: "12px" }}>
            <div className="px-8 py-6" style={{ borderBottom: "1px solid #252525" }}>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
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
                      onClick={() => handleMoodSelect(value)}
                      className="flex-1 min-w-[72px] py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontWeight: 600,
                        backgroundColor: active ? color : "#161616",
                        color: active ? "#E8E2D8" : "#9A9A9A",
                        border: `1px solid ${active ? color : "#252525"}`,
                        borderRadius: "8px",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {selectedMood !== null && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    {selectedMood <= 2
                      ? "Noted. That's real — and it matters. Try the Stress Reset below."
                      : selectedMood === 3
                      ? "Solid. Let's sharpen that edge. Box Breathing is a good place to start."
                      : "That's what we're building toward. Keep it going."}
                  </p>
                  <Link
                    href="/login"
                    className="self-start text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
                    style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                  >
                    Sign up to track your mood over time →
                  </Link>
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
                <DemoToolCard key={tool.title} {...tool} />
              ))}
            </div>
          </section>

          {/* Professional Support */}
          <section>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Professional Support
            </p>
            <div
              className="px-8 py-7 flex flex-col gap-5"
              style={{ backgroundColor: "#0D1B2A", border: "1px solid #1E3A5F", borderRadius: "12px" }}
            >
              <p
                className="text-lg font-bold uppercase"
                style={{ fontFamily: "var(--font-inter)", fontWeight: 600, color: "#E8E2D8" }}
              >
                You don&apos;t have to carry it alone.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Construction has one of the highest suicide rates of any industry —
                more than four times the national average. The pressure is real.
                The weight is real. And reaching out is one of the strongest things
                a leader can do.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
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
                    color: "#E8E2D8",
                    border: "1px solid #252525",
                    borderRadius: "8px",
                  }}
                >
                  Text 988
                </a>
              </div>
              <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Free · Confidential · Available 24/7
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}

function DemoToolCard({
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
              style={{ fontFamily: "var(--font-inter)", fontWeight: 600, color: "#E8E2D8" }}
            >
              {title}
            </h3>
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
              style={{ color: "#9A9A9A", border: "1px solid #252525", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
            >
              {tag}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {desc}
          </p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
          <span className="text-sm font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
            {duration}
          </span>
          <Link
            href="/login"
            className="text-xs font-bold uppercase tracking-widest px-5 py-2 transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-inter)",
              fontWeight: 600,
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
              borderRadius: "8px",
              minHeight: "48px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Start
          </Link>
        </div>
      </div>
    </div>
  );
}
