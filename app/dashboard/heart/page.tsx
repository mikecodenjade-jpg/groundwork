"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ── Data ──────────────────────────────────────────────────────────────────────

const JOURNAL_PAIRS = [
  {
    q1: "What drained you today?",
    q2: "What recharged you?",
  },
  {
    q1: "What conversation are you avoiding?",
    q2: "What would happen if you just had it?",
  },
  {
    q1: "Who are you carrying right now?",
    q2: "Who's carrying you?",
  },
  {
    q1: "What would your crew say about you today?",
    q2: "What do you wish they'd say?",
  },
  {
    q1: "What did you sacrifice this week for work?",
    q2: "Was it worth it?",
  },
];

const GRATITUDE_PROMPTS = [
  "Name a crew member who showed up and handled it today.",
  "What's one thing on this project you're actually proud of?",
  "Who made your day easier today — even a little?",
  "What's something at home that's going right, even if work isn't?",
  "Name a moment this week where you kept your cool when you didn't have to.",
  "What's a skill you have that most people take for granted?",
  "Who trusted you with something important recently?",
];

const RELATIONSHIP_CHALLENGES = [
  "Put your phone in another room for dinner. Every night this week.",
  "Ask your partner: 'What's one thing I can do better this week?' Don't defend. Just listen.",
  "Plan one thing this weekend that isn't errands or chores.",
  "Send a text right now to someone you haven't talked to in a month.",
  "When you get home tonight, ask your kids about their day — then actually stay in the room.",
  "Tell someone at home what you appreciate about them. Say it out loud, not in a text.",
  "Leave work at work for one full evening. No phone calls, no job emails after dinner.",
  "Do one thing this week that your partner has been asking for. Don't wait to be asked again.",
  "Put your kids to bed yourself tonight. No shortcuts. The whole routine.",
  "Take 10 minutes to sit with your partner — no phones, no TV. Just talk.",
  "Write down three things your family does well. Read it when the job is getting to you.",
  "Cancel something work-related that isn't critical. Use that time for your family instead.",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDailyIndex(total: number): number {
  const msPerDay = 86400000;
  const epoch = new Date(2026, 0, 1).getTime();
  const days = Math.floor((Date.now() - epoch) / msPerDay);
  return ((days % total) + total) % total;
}

function getCurrentWeekChallenge(): number {
  const msPerWeek = 7 * 86400000;
  const epoch = new Date(2026, 0, 1).getTime();
  const weeks = Math.floor((Date.now() - epoch) / msPerWeek);
  return ((weeks % RELATIONSHIP_CHALLENGES.length) + RELATIONSHIP_CHALLENGES.length) % RELATIONSHIP_CHALLENGES.length;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HeartPage() {
  const journalIndex = getDailyIndex(JOURNAL_PAIRS.length);
  const gratitudeIndex = getDailyIndex(GRATITUDE_PROMPTS.length);
  const weekChallengeIndex = getCurrentWeekChallenge();

  const todayPair = JOURNAL_PAIRS[journalIndex];
  const todayGratitudePrompt = GRATITUDE_PROMPTS[gratitudeIndex];
  const weekChallenge = RELATIONSHIP_CHALLENGES[weekChallengeIndex];

  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [gratitudeAnswer, setGratitudeAnswer] = useState("");
  const [journalSaving, setJournalSaving] = useState(false);
  const [journalSaved, setJournalSaved] = useState(false);

  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeSaving, setChallengeSaving] = useState(false);

  useEffect(() => {
    async function loadChallengeStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("relationship_challenge_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_number", weekChallengeIndex)
        .maybeSingle();
      if (data) setChallengeCompleted(true);
    }
    loadChallengeStatus();
  }, [weekChallengeIndex]);

  const canSaveJournal = answer1.trim() || answer2.trim() || gratitudeAnswer.trim();

  async function handleSaveJournal() {
    if (!canSaveJournal) return;
    setJournalSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        entry: [answer1.trim(), answer2.trim()].filter(Boolean).join(" | ") || "–",
        pissed_off: answer1.trim() || null,
        handled_well: answer2.trim() || null,
        gratitude_1: gratitudeAnswer.trim() || null,
        gratitude_2: null,
        gratitude_3: null,
      });
    }

    setJournalSaving(false);
    setJournalSaved(true);
    setAnswer1("");
    setAnswer2("");
    setGratitudeAnswer("");
    setTimeout(() => setJournalSaved(false), 3000);
  }

  async function handleCompleteChallenge() {
    if (challengeCompleted || challengeSaving) return;
    setChallengeSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("relationship_challenge_completions").upsert(
        { user_id: user.id, week_number: weekChallengeIndex },
        { onConflict: "user_id,week_number" }
      );
    }

    setChallengeSaving(false);
    setChallengeCompleted(true);
  }

  const taStyle: React.CSSProperties = {
    backgroundColor: "#0a0f1a",
    border: "1px solid #1e2d40",
    borderRadius: "8px",
    color: "#E8E2D8",
    fontFamily: "var(--font-inter)",
    resize: "none",
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#0a0f1a",
    border: "1px solid #1e2d40",
    borderRadius: "8px",
    color: "#E8E2D8",
    fontFamily: "var(--font-inter)",
  };

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0a0f1a", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-12">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #1e2d40", color: "#9A9A9A", borderRadius: "4px" }}
            aria-label="Back to dashboard"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
              Pillar
            </p>
            <h1 className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
              Heart
            </h1>
          </div>
        </header>

        {/* Intro for fresh state */}
        {!answer1 && !answer2 && !gratitudeAnswer && !journalSaved && (
          <div
            className="px-7 py-5 text-center"
            style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              This is your space. No judgment. Start writing when you are ready.
            </p>
          </div>
        )}

        {/* Tonight's Play */}
        <Link
          href="/dashboard/heart/play"
          className="flex items-center gap-5 px-7 py-6 transition-all duration-150 group"
          style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}
        >
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ backgroundColor: "#1A0A00", border: "1px solid #2A1A00" }}>
            <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
              <path d="M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12"
                stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M17 3L21 7M21 3L17 7" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="9" cy="12" r="1.5" fill="#f97316" />
              <circle cx="12" cy="12" r="1.5" fill="#f97316" />
              <circle cx="15" cy="12" r="1.5" fill="#f97316" />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em]"
              style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
              Tonight&apos;s Play
            </p>
            <p className="text-base font-bold leading-tight"
              style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
              Too tired to think?
            </p>
            <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-inter)" }}>
              Pick an age, get an activity. Done in 10 seconds.
            </p>
          </div>
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}
            className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
            style={{ color: "#555" }}>
            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* Daily Journal */}
        <section style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}>
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #1e2d40" }}>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
              Daily Journal
            </p>
            <h2 className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
              End of day. Be honest.
            </h2>
            <p className="text-sm mt-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              No one reads this but you.
            </p>
          </div>

          <div className="px-8 py-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold"
                style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                {todayPair.q1}
              </label>
              <textarea
                rows={4}
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                placeholder="Write it out."
                className="w-full px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#f97316]"
                style={taStyle}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold"
                style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                {todayPair.q2}
              </label>
              <textarea
                rows={4}
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                placeholder="Be specific."
                className="w-full px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#f97316]"
                style={taStyle}
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveJournal}
                disabled={!canSaveJournal || journalSaving}
                className="px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-30"
                style={{
                  fontFamily: "var(--font-inter)",
                  backgroundColor: "#f97316",
                  color: "#0a0f1a",
                  borderRadius: "8px",
                  minHeight: "48px",
                }}
              >
                {journalSaving ? "Saving…" : "Save Entry"}
              </button>
              {journalSaved && (
                <span className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
                  ✓ Saved
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Gratitude */}
        <section style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}>
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #1e2d40" }}>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
              Gratitude
            </p>
            <h2 className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
              {todayGratitudePrompt}
            </h2>
            <p className="text-sm mt-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Prompt rotates daily. One answer is enough.
            </p>
          </div>

          <div className="px-8 py-6">
            <input
              type="text"
              value={gratitudeAnswer}
              onChange={(e) => setGratitudeAnswer(e.target.value)}
              placeholder="Write your answer..."
              className="w-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#f97316]"
              style={inputStyle}
            />
          </div>
        </section>

        {/* Relationships — weekly challenge */}
        <section className="pb-28">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
            Relationships
          </p>

          <div style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}>
            <div className="px-8 py-6" style={{ borderBottom: "1px solid #1e2d40" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
                style={{ color: "#4a5568", fontFamily: "var(--font-inter)" }}>
                Week {weekChallengeIndex + 1} of {RELATIONSHIP_CHALLENGES.length} &mdash; Weekly Challenge
              </p>
              <h2 className="text-2xl font-bold uppercase leading-snug"
                style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
                The job takes from your family.
                <br />
                <span style={{ color: "#f97316" }}>Be intentional about giving back.</span>
              </h2>
            </div>

            <div className="px-8 py-7 flex flex-col gap-6">
              <div className="flex gap-5">
                <div className="w-1 shrink-0" style={{ backgroundColor: "#f97316", minHeight: "1rem" }} />
                <p className="text-base leading-relaxed"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  {weekChallenge}
                </p>
              </div>

              {challengeCompleted ? (
                <div
                  className="flex items-center gap-3 px-6 py-4 rounded-xl"
                  style={{ backgroundColor: "#0D1F0D", border: "1px solid #1C3A1C" }}
                >
                  <span className="text-lg" style={{ color: "#4CAF50" }}>✓</span>
                  <p className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
                    Challenge Complete This Week
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleCompleteChallenge}
                  disabled={challengeSaving}
                  className="self-start px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95 disabled:opacity-40"
                  style={{
                    fontFamily: "var(--font-inter)",
                    backgroundColor: "#f97316",
                    color: "#0a0f1a",
                    borderRadius: "8px",
                    minHeight: "48px",
                  }}
                >
                  {challengeSaving ? "Saving…" : "Mark Complete"}
                </button>
              )}
            </div>
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}
