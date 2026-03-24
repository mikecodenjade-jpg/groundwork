"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ── Data ──────────────────────────────────────────────────────────────────────

const AGE_GROUPS = [
  { label: "Under 3", value: "under3" as const, sub: "Baby & Toddler" },
  { label: "3–5", value: "age35" as const, sub: "Preschool" },
  { label: "6–9", value: "age69" as const, sub: "Elementary" },
  { label: "10–12", value: "age1012" as const, sub: "Tween" },
  { label: "Teenagers", value: "teen" as const, sub: "13 & up" },
];

type AgeGroup = "under3" | "age35" | "age69" | "age1012" | "teen";

const PLAY_ACTIVITIES: Record<AgeGroup, string[]> = {
  under3: [
    "Floor time. Get down there. 15 minutes, no phone.",
    "Peek-a-boo marathon. It never gets old for them.",
    "Stack blocks and let them knock it down. Do it ten times.",
    "Bath time — let them splash. You'll survive getting wet.",
    "Carry them around and name everything you see. They're absorbing it.",
    "Lie on the floor and just look at the ceiling together. Point at things.",
    "Roll a ball back and forth. That's the whole thing. They love it.",
  ],
  age35: [
    "Build something together. Blocks, Legos, couch cushion fort — anything.",
    "Play 'the floor is lava.' That's it. That's the whole activity.",
    "Read a book and do all the voices. Go all out.",
    "Freeze dance. Pick a song. Hit pause. Last one moving loses.",
    "Let them 'help' you cook dinner. It takes longer. Worth it.",
    "Draw anything together. Let them critique your art.",
    "Chase each other around the house. They'll sleep tonight.",
  ],
  age69: [
    "Challenge them to a race. Doesn't matter what kind.",
    "Arm wrestling tournament. Let them win a few, then don't.",
    "Pick a sport and play 1-on-1. Keep score. They'll want a rematch.",
    "Start a simple project with your hands — birdhouse, a shelf, anything.",
    "Teach them something you're good at. Doesn't matter what.",
    "Turn off screens and play cards. Teach them a game you know.",
    "Go for a walk and leave your phone behind. Let them lead.",
  ],
  age1012: [
    "Ask them to teach you something they learned this week.",
    "Watch something they picked. No commentary from the couch.",
    "Cook a real meal together. Give them real jobs.",
    "Talk about your job — the actual version, not the edited one.",
    "Find a YouTube tutorial and build or fix something together.",
    "Drive somewhere and let them run the music. Don't complain about it.",
    "Tell them one story from when you were their age. Make it honest.",
  ],
  teen: [
    "Drive somewhere. Don't talk about school. Just drive.",
    "Sit in silence and watch something together. Just being there counts.",
    "Ask them what they're into right now. Ask follow-up questions. Don't judge.",
    "Tell them something real that's going on at work. Treat them like an adult.",
    "Grab food together — drive-through counts. No agenda.",
    "Play a video game with them, even if you're bad at it.",
    "Check in with a text that has nothing to do with plans or homework.",
  ],
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TonightsPlayPage() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [activityIndex, setActivityIndex] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  function pickActivity(age: AgeGroup, exclude?: number) {
    const pool = PLAY_ACTIVITIES[age];
    const available = pool.map((_, i) => i).filter((i) => i !== exclude);
    const pick = available[Math.floor(Math.random() * available.length)];
    return pick ?? 0;
  }

  function handleSelectAge(age: AgeGroup) {
    setSelectedAge(age);
    setActivityIndex(pickActivity(age));
    setDone(false);
  }

  function handleShuffle() {
    if (!selectedAge) return;
    setActivityIndex((prev) => pickActivity(selectedAge, prev ?? undefined));
    setDone(false);
  }

  async function handleDidIt() {
    if (!selectedAge || activityIndex === null || saving) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("family_activities").insert({
        user_id: user.id,
        activity_name: PLAY_ACTIVITIES[selectedAge][activityIndex],
        energy_level: "low",
        time_slot: "15",
      });
    }
    setSaving(false);
    setDone(true);
  }

  const currentActivity =
    selectedAge !== null && activityIndex !== null
      ? PLAY_ACTIVITIES[selectedAge][activityIndex]
      : null;

  const s = {
    accent: { color: "#f97316", fontFamily: "var(--font-inter)" } as React.CSSProperties,
    body: { color: "#E8E2D8", fontFamily: "var(--font-inter)" } as React.CSSProperties,
    muted: { color: "#9A9A9A", fontFamily: "var(--font-inter)" } as React.CSSProperties,
  };

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0a0f1a", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
        <header className="flex items-start gap-5">
          <Link
            href="/dashboard/heart"
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 mt-1 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #1e2d40", color: "#9A9A9A", borderRadius: "4px" }}
            aria-label="Back to Heart"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5" style={s.accent}>
              Heart
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none mb-2"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Tonight&apos;s Play
            </h1>
            <p className="text-sm leading-relaxed" style={s.muted}>
              You&apos;re home. You&apos;re tired. Here&apos;s what to do with your kids tonight.
            </p>
          </div>
        </header>

        {/* Age selector */}
        <section className="flex flex-col gap-4">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={s.accent}>
            How old are your kids?
          </p>
          <div className="grid grid-cols-5 gap-2">
            {AGE_GROUPS.map((group) => {
              const active = selectedAge === group.value;
              return (
                <button
                  key={group.value}
                  onClick={() => handleSelectAge(group.value)}
                  className="flex flex-col items-center py-3 px-1 transition-all duration-150"
                  style={{
                    backgroundColor: active ? "#1A0A00" : "#111827",
                    border: `1px solid ${active ? "#f97316" : "#1e2d40"}`,
                    borderRadius: "10px",
                  }}
                >
                  <span
                    className="text-sm font-bold leading-tight text-center"
                    style={{ color: active ? "#f97316" : "#E8E2D8", fontFamily: "var(--font-inter)" }}
                  >
                    {group.label}
                  </span>
                  <span
                    className="text-[9px] mt-0.5 text-center leading-tight"
                    style={{ color: "#555", fontFamily: "var(--font-inter)" }}
                  >
                    {group.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Activity result */}
        {currentActivity && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px" style={{ backgroundColor: "#1e2d40" }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={s.accent}>
                Tonight&apos;s Activity
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#1e2d40" }} />
            </div>

            <div
              className="flex flex-col gap-6 p-7"
              style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "14px" }}
            >
              <p
                className="text-xl font-bold leading-snug"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8", fontSize: "1.5rem" }}
              >
                {currentActivity}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleShuffle}
                  className="flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-70"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #1e2d40",
                    borderRadius: "10px",
                    color: "#9A9A9A",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Shuffle
                </button>

                {!done ? (
                  <button
                    onClick={handleDidIt}
                    disabled={saving}
                    className="flex-1 py-3 font-bold uppercase tracking-wider text-sm transition-all duration-150 disabled:opacity-50"
                    style={{
                      backgroundColor: "#f97316",
                      color: "#0a0f1a",
                      borderRadius: "10px",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {saving ? "Saving…" : "I Did It"}
                  </button>
                ) : (
                  <div
                    className="flex-1 py-3 flex flex-col items-center gap-0.5 rounded-xl"
                    style={{ backgroundColor: "#0D1F0D", border: "1px solid #1C3A1C" }}
                  >
                    <p className="text-sm font-bold uppercase tracking-wider"
                      style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
                      ✓ Logged
                    </p>
                    <p className="text-xs" style={{ color: "#4CAF50", fontFamily: "var(--font-inter)", opacity: 0.8 }}>
                      Your kids will remember tonight.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedAge && (
          <p className="text-center text-sm" style={{ color: "#2a3a4a", fontFamily: "var(--font-inter)" }}>
            Pick an age group above and we&apos;ll give you something to do tonight.
          </p>
        )}

      </div>
      <BottomNav />
    </main>
  );
}
