"use client";

import Link from "next/link";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

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
  const [pissedOff, setPissedOff] = useState("");
  const [handledWell, setHandledWell] = useState("");
  const [gratitude, setGratitude] = useState(["", "", ""]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = pissedOff.trim() || handledWell.trim();

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        // Combine for entry field (NOT NULL compat until migration 011 applied)
        entry: [pissedOff.trim(), handledWell.trim()].filter(Boolean).join(" | ") || "–",
        pissed_off: pissedOff.trim() || null,
        handled_well: handledWell.trim() || null,
        gratitude_1: gratitude[0].trim() || null,
        gratitude_2: gratitude[1].trim() || null,
        gratitude_3: gratitude[2].trim() || null,
      });
    }

    setSaving(false);
    setSaved(true);
    setPissedOff("");
    setHandledWell("");
    setGratitude(["", "", ""]);
    setTimeout(() => setSaved(false), 3000);
  }

  function updateGratitude(index: number, value: string) {
    setGratitude((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const taStyle = {
    backgroundColor: "#0A0A0A",
    border: "1px solid #252525",
    borderRadius: "8px",
    color: "#E8E2D8",
    fontFamily: "var(--font-inter)",
    resize: "none" as const,
  };

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
              Heart
            </h1>
          </div>
        </header>

        {/* Tonight's Play */}
        <Link
          href="/dashboard/heart/play"
          className="flex items-center gap-5 px-7 py-6 transition-all duration-150 group"
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: "12px",
          }}
        >
          {/* Icon */}
          <div
            className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ backgroundColor: "#1A0A00", border: "1px solid #2A1A00" }}
          >
            <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
              <path d="M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12" stroke="#C45B28" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M17 3L21 7M21 3L17 7" stroke="#C45B28" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="9" cy="12" r="1.5" fill="#C45B28" />
              <circle cx="12" cy="12" r="1.5" fill="#C45B28" />
              <circle cx="15" cy="12" r="1.5" fill="#C45B28" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.25em]"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Tonight&apos;s Play
            </p>
            <p
              className="text-base font-bold leading-tight"
              style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
            >
              Too tired to think?
            </p>
            <p
              className="text-sm"
              style={{ color: "#666", fontFamily: "var(--font-inter)" }}
            >
              We got you. Pick an activity for your kids in 10 seconds.
            </p>
          </div>

          {/* Arrow */}
          <svg
            viewBox="0 0 20 20" fill="none" width={16} height={16}
            className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
            style={{ color: "#555" }}
          >
            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* Daily Journal — directed prompts */}
        <section
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: "12px",
          }}
        >
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #252525" }}>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Daily Journal
            </p>
            <h2
              className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              End of day. Be honest.
            </h2>
            <p className="text-sm mt-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              No one reads this but you.
            </p>
          </div>

          <div className="px-8 py-6 flex flex-col gap-6">
            {/* Prompt 1 */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-bold"
                style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
              >
                What pissed you off today?
              </label>
              <textarea
                rows={4}
                value={pissedOff}
                onChange={(e) => setPissedOff(e.target.value)}
                placeholder="The thing that got under your skin. Say it."
                className="w-full px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#C45B28]"
                style={taStyle}
              />
            </div>

            {/* Prompt 2 */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-bold"
                style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
              >
                What did you handle well?
              </label>
              <textarea
                rows={4}
                value={handledWell}
                onChange={(e) => setHandledWell(e.target.value)}
                placeholder="One win. Doesn't have to be big."
                className="w-full px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#C45B28]"
                style={taStyle}
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-30"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                  borderRadius: "8px",
                  minHeight: "48px",
                }}
              >
                {saving ? "Saving…" : "Save Entry"}
              </button>
              {saved && (
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}
                >
                  ✓ Saved
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Gratitude */}
        <section
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: "12px",
          }}
        >
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #252525" }}>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Gratitude
            </p>
            <h2
              className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              Name 3 things that went right today.
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Doesn&apos;t have to be big. Showing up counts.
            </p>
          </div>

          <div className="px-8 py-6 flex flex-col gap-3">
            {gratitude.map((val, i) => (
              <div key={i} className="flex items-center gap-4">
                <span
                  className="text-lg font-bold w-6 shrink-0 text-center"
                  style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
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
                    backgroundColor: "#0A0A0A",
                    border: "1px solid #252525",
                    borderRadius: "8px",
                    color: "#E8E2D8",
                    fontFamily: "var(--font-inter)",
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
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Relationships
          </p>

          <div
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
            }}
          >
            <div className="px-8 py-6" style={{ borderBottom: "1px solid #252525" }}>
              <h2
                className="text-2xl font-bold uppercase leading-snug"
                style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
              >
                The job takes from your family.
                <br />
                <span style={{ color: "#C45B28" }}>Be intentional about giving back.</span>
              </h2>
              <p
                className="text-sm mt-3 leading-relaxed"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                You manage a crew, a schedule, a budget, and a hundred problems a day. The
                people at home get whatever&apos;s left. That&apos;s the reality for most
                construction leaders — and most of them know it isn&apos;t working.
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: "#252525" }}>
              {RELATIONSHIP_TIPS.map((tip) => (
                <div key={tip.title} className="px-8 py-6 flex gap-5">
                  <div
                    className="w-1 shrink-0 mt-1"
                    style={{ backgroundColor: "#C45B28", minHeight: "1rem" }}
                  />
                  <div className="flex flex-col gap-1">
                    <p
                      className="text-base font-bold uppercase"
                      style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                    >
                      {tip.title}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
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
