"use client";

import Link from "next/link";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

const RELATIONSHIP_TIPS = [
  {
    title: "Leave the site at the site.",
    desc: "When you walk through the front door, the job stays outside. Your family needs you present — not on the phone, not running numbers in your head.",
  },
  {
    title: "Show up for the small stuff.",
    desc: "Dinner. Bedtime. A quick conversation before work. Consistency in the small moments builds more trust than any grand gesture.",
  },
  {
    title: "Say it out loud.",
    desc: "The people who matter most to you probably don't hear it enough. Tell them. Superintendents and foremen aren't known for being soft — that's exactly why it lands harder when you say it.",
  },
];

export default function HeartPage() {
  const [journal, setJournal] = useState("");
  const [saved, setSaved] = useState(false);
  const [gratitude, setGratitude] = useState(["", "", ""]);

  function handleSave() {
    if (!journal.trim()) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function updateGratitude(index: number, value: string) {
    setGratitude((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
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
              Heart
            </h1>
          </div>
        </header>

        {/* Daily Journal */}
        <section style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}>
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #1E1E1E" }}>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
            >
              Daily Journal
            </p>
            <h2
              className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              What&apos;s on your mind?
            </h2>
          </div>

          <div className="px-8 py-6 flex flex-col gap-4">
            <textarea
              rows={6}
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="No one reads this but you. Write honestly."
              className="w-full px-4 py-3 text-sm leading-relaxed resize-none outline-none focus:ring-2 focus:ring-[#C45B28]"
              style={{
                backgroundColor: "#0E0E0E",
                border: "1px solid #2A2A2A",
                color: "#E8E2D8",
                fontFamily: "var(--font-geist)",
              }}
            />
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={!journal.trim()}
                className="px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-30"
                style={{
                  fontFamily: "var(--font-oswald)",
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                }}
              >
                Save Entry
              </button>
              {saved && (
                <p className="text-sm" style={{ color: "#4CAF50" }}>
                  Saved.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Gratitude */}
        <section style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}>
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #1E1E1E" }}>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
            >
              Gratitude
            </p>
            <h2
              className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Name 3 things that went right today.
            </h2>
            <p className="text-sm mt-1" style={{ color: "#7A7268" }}>
              Doesn&apos;t have to be big. Showing up counts.
            </p>
          </div>

          <div className="px-8 py-6 flex flex-col gap-3">
            {gratitude.map((val, i) => (
              <div key={i} className="flex items-center gap-4">
                <span
                  className="text-lg font-bold w-6 shrink-0 text-center"
                  style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
                >
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => updateGratitude(i, e.target.value)}
                  placeholder={
                    i === 0
                      ? "The crew showed up on time."
                      : i === 1
                      ? "I didn't lose my temper."
                      : "Made it home for dinner."
                  }
                  className="flex-1 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                  style={{
                    backgroundColor: "#0E0E0E",
                    border: "1px solid #2A2A2A",
                    color: "#E8E2D8",
                    fontFamily: "var(--font-geist)",
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Relationships */}
        <section className="pb-28">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Relationships
          </p>

          <div style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}>
            <div className="px-8 py-6" style={{ borderBottom: "1px solid #1E1E1E" }}>
              <h2
                className="text-2xl font-bold uppercase leading-snug"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                The job takes from your family.
                <br />
                <span style={{ color: "#C45B28" }}>
                  Be intentional about giving back.
                </span>
              </h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "#7A7268" }}>
                You manage a crew, a schedule, a budget, and a hundred problems a day.
                The people at home get whatever&apos;s left. That&apos;s the reality for most
                construction leaders — and most of them know it isn&apos;t working.
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: "#1A1A1A" }}>
              {RELATIONSHIP_TIPS.map((tip) => (
                <div key={tip.title} className="px-8 py-6 flex gap-5">
                  <div
                    className="w-1 shrink-0 mt-1"
                    style={{ backgroundColor: "#C45B28", minHeight: "1rem" }}
                  />
                  <div className="flex flex-col gap-1">
                    <p
                      className="text-base font-bold uppercase"
                      style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                    >
                      {tip.title}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
                      {tip.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}
