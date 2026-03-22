"use client";

import Link from "next/link";
import { useState } from "react";

const CREW_SCRIPTS = [
  {
    title: "Difficult Conversation",
    tag: "Performance",
    desc: "How to address underperformance without torching the relationship. Lead with the work, not the person — and be clear about what changes.",
    script: [
      "\"I want to talk about [specific issue]. I've noticed [specific behavior], and it's affecting the crew.\"",
      "\"I'm not here to pile on — I'm here because I need you locked in. What's going on?\"",
      "\"Here's what I need to see by [specific date]. Can I count on you?\"",
    ],
  },
  {
    title: "New Guy on Site",
    tag: "Onboarding",
    desc: "How to bring someone onto your crew the right way — set expectations, establish culture, and make them want to stick around.",
    script: [
      "\"Welcome. Here's how we run things: safety first, no shortcuts, and we look out for each other.\"",
      "\"If you don't know something, ask. Nobody here expects you to already know everything.\"",
      "\"Do the work, show up on time, and you'll have a crew that has your back.\"",
    ],
  },
  {
    title: "Pushing Back Up",
    tag: "Management",
    desc: "How to handle pressure from above — unrealistic timelines, budget cuts, scope creep — without burning out your crew or your credibility.",
    script: [
      "\"I hear you on the deadline. Here's what I can deliver by then, and here's what gets cut to make that happen.\"",
      "\"My crew is already at capacity. If we add this, something else has to move.\"",
      "\"I'll make it work — but I need [specific resource/decision] from you by [date].\"",
    ],
  },
];

export default function LeadPage() {
  const [completed, setCompleted] = useState(false);
  const [openScript, setOpenScript] = useState<string | null>(null);

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
              Lead
            </h1>
          </div>
        </header>

        {/* Daily Leadership Challenge */}
        <section style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}>
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #1E1E1E" }}>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
            >
              Daily Leadership Challenge
            </p>
            <h2
              className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Today&apos;s Challenge
            </h2>
          </div>

          <div className="px-8 py-7 flex flex-col gap-6">
            <div className="flex gap-5">
              <div
                className="w-1 shrink-0"
                style={{ backgroundColor: "#C45B28", minHeight: "1rem" }}
              />
              <p className="text-base leading-relaxed" style={{ color: "#E8E2D8" }}>
                Have a 1-on-1 with someone on your crew you haven&apos;t checked in
                with this week. Ask how they&apos;re doing.{" "}
                <span style={{ color: "#A09890" }}>Listen.</span>
              </p>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
              Not about the job. Not about the schedule. Ask how they&apos;re actually
              doing. Two minutes of genuine attention from a leader can change
              someone&apos;s week — or more.
            </p>

            <button
              onClick={() => setCompleted(!completed)}
              className="self-start px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
              style={{
                fontFamily: "var(--font-oswald)",
                backgroundColor: completed ? "#0E0E0E" : "#C45B28",
                color: completed ? "#C45B28" : "#0A0A0A",
                border: completed ? "1px solid #C45B28" : "1px solid transparent",
              }}
            >
              {completed ? "✓ Marked Complete" : "Mark Complete"}
            </button>
          </div>
        </section>

        {/* Crew Scripts */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Crew Scripts
          </p>
          <p className="text-sm mb-5" style={{ color: "#7A7268" }}>
            Real language for hard moments. Use it, adapt it, make it yours.
          </p>
          <div className="flex flex-col gap-4">
            {CREW_SCRIPTS.map((script) => (
              <ScriptCard
                key={script.title}
                {...script}
                isOpen={openScript === script.title}
                onToggle={() =>
                  setOpenScript(
                    openScript === script.title ? null : script.title
                  )
                }
              />
            ))}
          </div>
        </section>

        {/* Transition Plan */}
        <section className="pb-12">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Transition Plan
          </p>

          <div style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}>
            <div className="px-8 py-6" style={{ borderBottom: "1px solid #1E1E1E" }}>
              <h2
                className="text-2xl font-bold uppercase leading-snug"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Build something beyond
                <br />
                <span style={{ color: "#C45B28" }}>the hard hat.</span>
              </h2>
            </div>

            <div className="px-8 py-7 flex flex-col gap-5">
              <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
                Most construction leaders spend decades building things for
                everyone else and never stop to plan their own next move. Whether
                that&apos;s moving into ownership, consulting, project management at a
                higher level, or something else entirely — that move doesn&apos;t
                happen by accident.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
                The skills you&apos;ve built on the jobsite — logistics, people
                management, problem-solving under pressure — are worth more than
                you think. The question is whether you&apos;re directing them toward
                something that&apos;s yours.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                {[
                  "Where do you want to be in 5 years?",
                  "What skills are you building — or missing?",
                  "Who in your network has made a move you respect?",
                ].map((prompt) => (
                  <div key={prompt} className="flex gap-4 items-start">
                    <span style={{ color: "#C45B28", marginTop: "2px" }}>
                      <svg viewBox="0 0 16 16" fill="currentColor" width={12} height={12}>
                        <polygon points="0,0 16,8 0,16" />
                      </svg>
                    </span>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#A09890" }}
                    >
                      {prompt}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-sm leading-relaxed pt-2" style={{ color: "#5A5248" }}>
                Use the journal in the Heart pillar to start writing it out.
                No plan survives the first pour — but leaders who don&apos;t plan
                don&apos;t build.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

function ScriptCard({
  title,
  tag,
  desc,
  script,
  isOpen,
  onToggle,
}: {
  title: string;
  tag: string;
  desc: string;
  script: string[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="transition-all duration-150"
      style={{
        backgroundColor: "#111111",
        border: `1px solid ${isOpen ? "#C45B28" : "#1E1E1E"}`,
      }}
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-8 py-6 flex items-start justify-between gap-4"
      >
        <div className="flex flex-col gap-1">
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
        <span
          className="text-lg shrink-0 mt-1 transition-transform duration-200"
          style={{
            color: "#C45B28",
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            display: "inline-block",
          }}
        >
          ▶
        </span>
      </button>

      {/* Script lines — revealed on open */}
      {isOpen && (
        <div
          className="px-8 pb-7 flex flex-col gap-3"
          style={{ borderTop: "1px solid #1A1A1A" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest pt-5 mb-1"
            style={{ color: "#5A5248", fontFamily: "var(--font-oswald)" }}
          >
            What to say
          </p>
          {script.map((line, i) => (
            <div key={i} className="flex gap-4 items-start">
              <span
                className="text-xs font-bold shrink-0 mt-0.5"
                style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                className="text-sm leading-relaxed italic"
                style={{ color: "#A09890" }}
              >
                {line}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
