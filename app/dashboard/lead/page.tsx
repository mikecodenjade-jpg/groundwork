"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ── Data ──────────────────────────────────────────────────────────────────────

const CREW_SCRIPTS = [
  {
    title: "Difficult Conversation",
    tag: "Performance",
    desc: "How to address underperformance without torching the relationship. Lead with the work, not the person.",
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
  {
    title: "Addressing Consistent Tardiness",
    tag: "Accountability",
    desc: "How to have the talk without being a jerk. Keep it about the work and the crew, not a personal attack.",
    script: [
      "\"I've noticed you've been late a few times this week. That puts me in a bind and it's not fair to the rest of the crew who are here on time.\"",
      "\"I'm not looking to write you up — I need you to tell me if something's going on that I should know about.\"",
      "\"Starting tomorrow, I need you here at [time]. If there's something blocking that, let's figure it out now.\"",
    ],
  },
  {
    title: "Shutting Down Gossip on Site",
    tag: "Culture",
    desc: "Quick, direct, doesn't make it worse. Address it without turning it into a bigger deal than it needs to be.",
    script: [
      "\"I'm going to stop you right there. That kind of talk doesn't help us and it doesn't belong on this site.\"",
      "\"If you've got a real issue with someone, bring it to me. I'll help sort it out — this isn't the way.\"",
      "\"Let's get back to work. We've got a job to finish.\"",
    ],
  },
  {
    title: "Asking for More Resources",
    tag: "Upward",
    desc: "How to make the ask from your PM without coming across as complaining. Come with data, not frustration.",
    script: [
      "\"I want to flag something before it becomes a problem. We're running [X days] behind on [task] and here's exactly why.\"",
      "\"To keep the schedule, I need [specific resource] by [specific date]. Without it, here's what slips.\"",
      "\"I've already tried [what you've done]. This is the gap I can't close without your help.\"",
    ],
  },
  {
    title: "Recognizing a Crew Member Publicly",
    tag: "Recognition",
    desc: "How to give praise that actually lands with the guys on your crew. Specific beats generic every time.",
    script: [
      "\"Before we wrap up, I want to call something out. [Name] — what you did today on [specific thing] was exactly what we needed.\"",
      "\"That's not a small thing. That kind of work is what keeps this crew moving forward.\"",
      "\"I see it, and I appreciate it. That's how we do things here.\"",
    ],
  },
  {
    title: "Handling a Personal Crisis",
    tag: "Support",
    desc: "When a crew member is going through something off-site. Keep it brief, genuine, and make them feel like a person — not a liability.",
    script: [
      "\"Hey — I heard you're going through something right now. You don't have to get into it if you don't want to.\"",
      "\"I just want you to know I'm not going to pile on. We'll figure out what you need from me today.\"",
      "\"If it gets to where you need some time, come talk to me first. We'll work it out.\"",
    ],
  },
];

const LEADERSHIP_CHALLENGES = [
  "Give one specific piece of praise to a crew member today. Not 'good job.' Tell them exactly what they did right.",
  "Before you react to the next problem, take 10 seconds. Then respond.",
  "Ask your newest crew member how their first weeks have been. Actually listen.",
  "Delegate one thing today you'd normally just do yourself.",
  "Walk the site and find one safety issue before someone else does.",
  "Tell your crew the 'why' behind today's schedule. Not just the 'what.'",
  "End the day by telling your crew one thing that went well. Out loud.",
  "Have a 2-minute conversation with someone you don't usually talk to on site.",
  "Write down the three biggest risks on your project right now. Do you have a plan for each?",
  "Ask yourself: would I want to work for me today? Be honest.",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDailyIndex(total: number): number {
  const msPerDay = 86400000;
  const epoch = new Date(2026, 0, 1).getTime();
  const days = Math.floor((Date.now() - epoch) / msPerDay);
  return ((days % total) + total) % total;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TransitionPlan = {
  twoYearGoal: string;
  blocking: string;
  skill1: string;
  skill2: string;
  skill3: string;
  whoCanHelp: string;
  nextMove: string;
  nextMoveDate: string;
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadPage() {
  const challengeIndex = getDailyIndex(LEADERSHIP_CHALLENGES.length);
  const todaysChallenge = LEADERSHIP_CHALLENGES[challengeIndex];

  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [openScript, setOpenScript] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [plan, setPlan] = useState<TransitionPlan>({
    twoYearGoal: "",
    blocking: "",
    skill1: "",
    skill2: "",
    skill3: "",
    whoCanHelp: "",
    nextMove: "",
    nextMoveDate: "",
  });
  const [planSaving, setPlanSaving] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  useEffect(() => {
    // Restore challenge completion for today
    try {
      const stored = localStorage.getItem("lead_challenge");
      if (stored) {
        const { date, index } = JSON.parse(stored);
        if (date === new Date().toDateString() && index === challengeIndex) {
          setChallengeCompleted(true);
        }
      }
    } catch {
      // ignore
    }

    // Load saved transition plan
    async function loadPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("transition_plans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPlan({
          twoYearGoal: data.two_year_goal ?? "",
          blocking: data.blocking ?? "",
          skill1: data.skill_1 ?? "",
          skill2: data.skill_2 ?? "",
          skill3: data.skill_3 ?? "",
          whoCanHelp: data.who_can_help ?? "",
          nextMove: data.next_move ?? "",
          nextMoveDate: data.next_move_date ?? "",
        });
      }
    }
    loadPlan();
  }, [challengeIndex]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function toggleChallenge() {
    const next = !challengeCompleted;
    setChallengeCompleted(next);
    if (next) {
      localStorage.setItem(
        "lead_challenge",
        JSON.stringify({ date: new Date().toDateString(), index: challengeIndex })
      );
    } else {
      localStorage.removeItem("lead_challenge");
    }
  }

  async function savePlan() {
    setPlanSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("transition_plans").upsert(
        {
          user_id: user.id,
          two_year_goal: plan.twoYearGoal || null,
          blocking: plan.blocking || null,
          skill_1: plan.skill1 || null,
          skill_2: plan.skill2 || null,
          skill_3: plan.skill3 || null,
          who_can_help: plan.whoCanHelp || null,
          next_move: plan.nextMove || null,
          next_move_date: plan.nextMoveDate || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }
    setPlanSaving(false);
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 3000);
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#111827",
    border: "1px solid #252525",
    borderRadius: "8px",
    color: "#E8E2D8",
    fontFamily: "var(--font-inter)",
    resize: "none" as const,
  };

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0a0f1a", color: "#E8E2D8" }}
    >
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 z-50 px-5 py-3 text-sm font-semibold rounded-xl shadow-lg"
          style={{
            transform: "translateX(-50%)",
            backgroundColor: "#1a2535",
            border: "1px solid #2a3545",
            color: "#E8E2D8",
            fontFamily: "var(--font-inter)",
          }}
        >
          {toast}
        </div>
      )}

      <div className="max-w-3xl w-full mx-auto flex flex-col gap-12">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "4px" }}
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
              Lead
            </h1>
          </div>
        </header>

        {/* Crew Hub */}
        <section>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
            Crew Hub
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/challenges"
              className="flex flex-col gap-3 px-5 py-5 transition-all duration-150 hover:opacity-80"
              style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}
            >
              <div className="w-10 h-10 flex items-center justify-center"
                style={{ backgroundColor: "#1A0A00", border: "1px solid #3A1A00", borderRadius: "8px", color: "#f97316" }}>
                <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                  <path d="M12 4L14.5 9H20L15.5 12.5L17.5 18L12 14.5L6.5 18L8.5 12.5L4 9H9.5L12 4Z"
                    stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold uppercase leading-tight"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Team Challenges
                </p>
                <p className="text-xs mt-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Compete with your crew
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/crew"
              className="flex flex-col gap-3 px-5 py-5 transition-all duration-150 hover:opacity-80"
              style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}
            >
              <div className="w-10 h-10 flex items-center justify-center"
                style={{ backgroundColor: "#001A1A", border: "1px solid #003A3A", borderRadius: "8px", color: "#2AB5B5" }}>
                <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                  <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M3 19C3 16.2 5.7 14 9 14C12.3 14 15 16.2 15 19"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M17 14C19.2 14 21 15.8 21 18"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold uppercase leading-tight"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Crew Wall
                </p>
                <p className="text-xs mt-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Share wins and grinds
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Daily Leadership Challenge */}
        <section style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}>
          <div className="px-8 py-6" style={{ borderBottom: "1px solid #1e2d40" }}>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
              Daily Leadership Challenge
            </p>
            <h2 className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
              Today&apos;s Challenge
            </h2>
            <p className="text-xs mt-1" style={{ color: "#4a5568", fontFamily: "var(--font-inter)" }}>
              {challengeIndex + 1} of {LEADERSHIP_CHALLENGES.length} &mdash; rotates daily
            </p>
          </div>

          <div className="px-8 py-7 flex flex-col gap-6">
            <div className="flex gap-5">
              <div className="w-1 shrink-0" style={{ backgroundColor: "#f97316", minHeight: "1rem" }} />
              <p className="text-base leading-relaxed" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                {todaysChallenge}
              </p>
            </div>

            <button
              onClick={toggleChallenge}
              className="self-start px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
              style={{
                fontFamily: "var(--font-inter)",
                backgroundColor: challengeCompleted ? "#111827" : "#f97316",
                color: challengeCompleted ? "#f97316" : "#0a0f1a",
                border: challengeCompleted ? "1px solid #f97316" : "1px solid transparent",
                borderRadius: "8px",
                minHeight: "48px",
              }}
            >
              {challengeCompleted ? "✓ Done" : "Mark Complete"}
            </button>
          </div>
        </section>

        {/* Crew Scripts */}
        <section>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
            style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
            Crew Scripts
          </p>
          <p className="text-sm mb-5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Real language for hard moments. Use it, adapt it, make it yours.
          </p>
          <div className="flex flex-col gap-4">
            {CREW_SCRIPTS.map((s) => (
              <ScriptCard
                key={s.title}
                {...s}
                isOpen={openScript === s.title}
                onToggle={() => setOpenScript(openScript === s.title ? null : s.title)}
                onToast={showToast}
              />
            ))}
          </div>
        </section>

        {/* Transition Plan */}
        <section className="pb-28">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
            Transition Plan
          </p>

          <div style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}>
            <div className="px-8 py-6" style={{ borderBottom: "1px solid #1e2d40" }}>
              <h2 className="text-2xl font-bold uppercase leading-snug"
                style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
                Build something beyond
                <br />
                <span style={{ color: "#f97316" }}>the hard hat.</span>
              </h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Most construction leaders spend decades building things for everyone else and never stop to plan
                their own next move. That move doesn&apos;t happen by accident.
              </p>
            </div>

            <div className="px-8 py-7 flex flex-col gap-6">
              {/* Where I want to be in 2 years */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Where I want to be in 2 years
                </label>
                <textarea
                  rows={3}
                  value={plan.twoYearGoal}
                  onChange={(e) => setPlan((p) => ({ ...p, twoYearGoal: e.target.value }))}
                  placeholder="Ownership, PM role, consulting, something else — write it out."
                  className="w-full px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#f97316]"
                  style={inputStyle}
                />
              </div>

              {/* What's blocking me */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  What&apos;s blocking me right now
                </label>
                <textarea
                  rows={3}
                  value={plan.blocking}
                  onChange={(e) => setPlan((p) => ({ ...p, blocking: e.target.value }))}
                  placeholder="Be honest. Time, money, confidence, not knowing the next step..."
                  className="w-full px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#f97316]"
                  style={inputStyle}
                />
              </div>

              {/* 3 skills to develop */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  3 skills I need to develop
                </label>
                {[
                  { key: "skill1" as const, ph: "e.g. Estimating, P&L reading, public speaking" },
                  { key: "skill2" as const, ph: "e.g. Managing up, contract negotiation" },
                  { key: "skill3" as const, ph: "e.g. Hiring, delegation, running meetings" },
                ].map(({ key, ph }, i) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm font-bold w-5 shrink-0 text-center"
                      style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={plan[key]}
                      onChange={(e) => setPlan((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={ph}
                      className="flex-1 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#f97316]"
                      style={{ ...inputStyle, resize: undefined }}
                    />
                  </div>
                ))}
              </div>

              {/* Who can help */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Who can help me get there
                </label>
                <input
                  type="text"
                  value={plan.whoCanHelp}
                  onChange={(e) => setPlan((p) => ({ ...p, whoCanHelp: e.target.value }))}
                  placeholder="A mentor, a former boss, someone who made a similar move..."
                  className="w-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#f97316]"
                  style={{ ...inputStyle, resize: undefined }}
                />
              </div>

              {/* Next move */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  My next move by
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={plan.nextMove}
                    onChange={(e) => setPlan((p) => ({ ...p, nextMove: e.target.value }))}
                    placeholder="One concrete action you can take..."
                    className="flex-1 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#f97316]"
                    style={{ ...inputStyle, resize: undefined }}
                  />
                  <input
                    type="date"
                    value={plan.nextMoveDate}
                    onChange={(e) => setPlan((p) => ({ ...p, nextMoveDate: e.target.value }))}
                    className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#f97316]"
                    style={{ ...inputStyle, resize: undefined, minWidth: "140px", colorScheme: "dark" }}
                  />
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={savePlan}
                  disabled={planSaving}
                  className="px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{
                    fontFamily: "var(--font-inter)",
                    backgroundColor: "#f97316",
                    color: "#0a0f1a",
                    borderRadius: "8px",
                    minHeight: "48px",
                  }}
                >
                  {planSaving ? "Saving…" : "Save Plan"}
                </button>
                {planSaved && (
                  <span className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
                    ✓ Saved
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}

// ── Script Card ───────────────────────────────────────────────────────────────

function ScriptCard({
  title, tag, desc, script, isOpen, onToggle, onToast,
}: {
  title: string;
  tag: string;
  desc: string;
  script: string[];
  isOpen: boolean;
  onToggle: () => void;
  onToast: (msg: string) => void;
}) {
  const storageKey = `custom_script_${title.replace(/\s+/g, "_")}`;
  const [customizing, setCustomizing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [customText, setCustomText] = useState<string | null>(null);

  useEffect(() => {
    setCustomText(localStorage.getItem(storageKey));
  }, [storageKey]);

  function handleCopy() {
    const text = customText ?? script.join("\n\n");
    navigator.clipboard.writeText(text).then(() => onToast("Copied to clipboard"));
  }

  function handleCustomize() {
    setEditValue(customText ?? script.join("\n\n"));
    setCustomizing(true);
  }

  function handleSaveCustom() {
    localStorage.setItem(storageKey, editValue);
    setCustomText(editValue);
    setCustomizing(false);
    onToast("Your version saved");
  }

  function handleReset() {
    localStorage.removeItem(storageKey);
    setCustomText(null);
    setCustomizing(false);
    onToast("Reset to original");
  }

  return (
    <div
      style={{
        backgroundColor: "#111827",
        border: `1px solid ${isOpen ? "#f97316" : "#1e2d40"}`,
        borderRadius: "12px",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-8 py-6 flex items-start justify-between gap-4"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
              {title}
            </h3>
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
              style={{ color: "#9A9A9A", border: "1px solid #252525", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
            >
              {tag}
            </span>
            {customText && (
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
                style={{ color: "#f97316", border: "1px solid #f9731640", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
              >
                Custom
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {desc}
          </p>
        </div>
        <span
          className="text-lg shrink-0 mt-1"
          style={{
            color: "#f97316",
            display: "inline-block",
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ▶
        </span>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-8 pb-7 flex flex-col gap-4" style={{ borderTop: "1px solid #1e2d40" }}>

          {/* Action buttons */}
          <div className="flex gap-3 pt-5">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-150 hover:opacity-80"
              style={{
                backgroundColor: "#0a0f1a",
                border: "1px solid #1e2d40",
                borderRadius: "6px",
                color: "#9A9A9A",
                fontFamily: "var(--font-inter)",
              }}
            >
              Copy
            </button>
            <button
              onClick={customizing ? () => setCustomizing(false) : handleCustomize}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-150 hover:opacity-80"
              style={{
                backgroundColor: customizing ? "#1a2535" : "#0a0f1a",
                border: `1px solid ${customizing ? "#f97316" : "#1e2d40"}`,
                borderRadius: "6px",
                color: customizing ? "#f97316" : "#9A9A9A",
                fontFamily: "var(--font-inter)",
              }}
            >
              {customizing ? "Cancel" : "Customize"}
            </button>
            {customText && !customizing && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-150 hover:opacity-80"
                style={{
                  backgroundColor: "#0a0f1a",
                  border: "1px solid #1e2d40",
                  borderRadius: "6px",
                  color: "#666",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Customize editor */}
          {customizing ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
                Edit your version
              </p>
              <textarea
                rows={8}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#f97316]"
                style={{
                  backgroundColor: "#0a0f1a",
                  border: "1px solid #1e2d40",
                  borderRadius: "8px",
                  color: "#E8E2D8",
                  fontFamily: "var(--font-inter)",
                  resize: "vertical",
                }}
              />
              <button
                onClick={handleSaveCustom}
                className="self-start px-6 py-2 text-xs font-bold uppercase tracking-widest"
                style={{
                  backgroundColor: "#f97316",
                  color: "#0a0f1a",
                  borderRadius: "6px",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Save My Version
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                {customText ? "Your version" : "What to say"}
              </p>
              {customText ? (
                <p className="text-sm leading-relaxed italic whitespace-pre-wrap"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  {customText}
                </p>
              ) : (
                script.map((line, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-xs font-bold shrink-0 mt-0.5"
                      style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm leading-relaxed italic"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      {line}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
