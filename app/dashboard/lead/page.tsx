"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ── Data ──────────────────────────────────────────────────────────────────────

const CREW_SCRIPTS = [
  {
    title: "Hey, you seem off today",
    tag: "Check-In",
    situation: "Someone on your crew isn't acting like themselves. They're quiet, distracted, or short-tempered. You don't know what's going on — but you notice.",
    whatToSay: [
      "\"Hey, got a minute? I wanted to check in — you seem a little off today. Everything good?\"",
      "\"Look, I'm not prying. But if something's going on, I've got time to listen. You don't have to carry it alone.\"",
      "\"Even if it's nothing, I'd rather ask than not.\"",
    ],
    notToSay: [
      "\"What's your problem today?\"",
      "\"You need to get it together.\"",
      "\"Just leave it at home — this is work.\"",
    ],
    followUp: [
      "Give them space if they don't open up. The fact that you asked matters.",
      "Follow up the next day — a nod, a quick check-in, nothing forced.",
      "If something serious comes up, connect them to support privately.",
    ],
  },
  {
    title: "Let's talk about what happened",
    tag: "Incident",
    situation: "There was a safety incident or a near-miss. People are shaken. You need to address it without shutting anyone down or making them defensive.",
    whatToSay: [
      "\"I want to walk through what happened — not to put anyone on the spot, but so we all understand and it doesn't happen again.\"",
      "\"Nobody's in trouble. We're trying to figure out what broke down so we can fix it.\"",
      "\"What did you see? What was going through your head? Help me understand it from your position.\"",
    ],
    notToSay: [
      "\"How did you not see that coming?\"",
      "\"Somebody's getting written up for this.\"",
      "\"We'll deal with this later\" — and then not deal with it.",
    ],
    followUp: [
      "Follow up with the crew the next morning — brief, direct, no drama.",
      "Document what changed. Let the crew see the result.",
      "Check in privately with anyone who was directly involved.",
    ],
  },
  {
    title: "I noticed you've been quiet",
    tag: "Withdrawal",
    situation: "Someone has pulled back. Still showing up, still doing the work — but something's different. They're not talking, not engaging, not themselves.",
    whatToSay: [
      "\"I've noticed you've been kind of quiet lately. That's not like you. What's going on?\"",
      "\"You don't have to tell me anything. I just wanted you to know I see it — and I'm not going to pretend I don't.\"",
      "\"If you need time or if there's something I can help with, just say the word.\"",
    ],
    notToSay: [
      "\"You've got to leave your personal stuff at home.\"",
      "\"You need to be more of a team player.\"",
      "\"If you can't be here mentally, maybe you need time off\" — said as a threat, not an offer.",
    ],
    followUp: [
      "Don't hover — give them space, but keep the line open.",
      "One more check-in the following week if nothing changes.",
      "Know the warning signs: giving away gear, saying goodbye like it means more than it should, talking about being a burden.",
    ],
  },
  {
    title: "It's okay to not be okay",
    tag: "Mental Health",
    situation: "Someone admitted they're struggling, or you want to normalize asking for help on your crew before it's a crisis.",
    whatToSay: [
      "\"I want to say something and I mean it — it's okay to not be okay. We all go through hard stretches.\"",
      "\"Asking for help isn't weakness. I've been there. A lot of guys on this crew have been there.\"",
      "\"If you're carrying something you can't put down, there are people who can help. That's not a sign you can't handle this job.\"",
    ],
    notToSay: [
      "\"Don't be so sensitive.\"",
      "\"Everybody's got problems.\"",
      "\"You can't let that stuff affect your work.\"",
    ],
    followUp: [
      "Know your company's EAP number before you need it.",
      "Follow up privately — not in front of the crew.",
      "If someone is in immediate danger, don't leave them alone. Call 988.",
    ],
  },
  {
    title: "I've been there too",
    tag: "Vulnerability",
    situation: "You want to connect with someone who's struggling — and the most powerful thing you have isn't authority, it's your own story.",
    whatToSay: [
      "\"I'm going to tell you something I don't usually talk about — because I think it might help.\"",
      "\"There was a stretch where I wasn't okay. I kept pushing through alone and it made everything worse.\"",
      "\"What changed for me was [your honest answer]. I'm not saying it'll be the same for you — but you don't have to figure it out alone.\"",
    ],
    notToSay: [
      "\"I had it worse and I figured it out.\"",
      "\"My story proves you need to toughen up.\"",
      "\"I'm only telling you this\" — and then immediately pivoting to performance expectations.",
    ],
    followUp: [
      "Sharing your story once is enough — don't repeat it for effect.",
      "Ask them: 'What do you need right now?'",
      "Stay in their corner. One conversation isn't the finish line.",
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
    // Check challenge completion for today
    async function loadChallengeStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("leadership_challenges_completed")
        .select("id")
        .eq("user_id", user.id)
        .eq("challenge_index", challengeIndex)
        .eq("completed_date", today)
        .maybeSingle();
      if (data) setChallengeCompleted(true);
    }
    loadChallengeStatus();

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

  async function toggleChallenge() {
    const next = !challengeCompleted;
    setChallengeCompleted(next);
    if (next) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const today = new Date().toISOString().split("T")[0];
        await supabase.from("leadership_challenges_completed").upsert(
          { user_id: user.id, challenge_index: challengeIndex, completed_date: today },
          { onConflict: "user_id,challenge_index,completed_date" }
        );
      }
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

        {/* Team Pulse */}
        <section>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
            Team Pulse
          </p>
          <div
            className="flex items-center gap-5 px-7 py-6"
            style={{ backgroundColor: "#111827", border: "1px solid #1e2d40", borderRadius: "12px" }}
          >
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl"
              style={{ backgroundColor: "#1A0A00", border: "1px solid #2A1A00" }}>
              <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
                <path d="M3 12H7L9 6L12 18L15 10L17 14H21"
                  stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold uppercase leading-tight"
                style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                Anonymous Team Mood Check
              </p>
              <p className="text-sm mt-1" style={{ color: "#4a5568", fontFamily: "var(--font-inter)" }}>
                Coming soon
              </p>
            </div>
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
                title={s.title}
                tag={s.tag}
                situation={s.situation}
                whatToSay={s.whatToSay}
                notToSay={s.notToSay}
                followUp={s.followUp}
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
  title, tag, situation, whatToSay, notToSay, followUp, isOpen, onToggle, onToast,
}: {
  title: string;
  tag: string;
  situation: string;
  whatToSay: string[];
  notToSay: string[];
  followUp: string[];
  isOpen: boolean;
  onToggle: () => void;
  onToast: (msg: string) => void;
}) {
  function handleCopy() {
    const text = whatToSay.join("\n\n");
    navigator.clipboard.writeText(text).then(() => onToast("Copied to clipboard"));
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
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {situation}
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
        <div className="px-8 pb-7 flex flex-col gap-6" style={{ borderTop: "1px solid #1e2d40" }}>

          {/* What to say */}
          <div className="flex flex-col gap-3 pt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
                What to say
              </p>
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-150 hover:opacity-80"
                style={{
                  backgroundColor: "#0a0f1a",
                  border: "1px solid #1e2d40",
                  borderRadius: "6px",
                  color: "#9A9A9A",
                  fontFamily: "var(--font-inter)",
                  minHeight: "36px",
                }}
              >
                Copy
              </button>
            </div>
            {whatToSay.map((line, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-xs font-bold shrink-0 mt-0.5"
                  style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-relaxed italic"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  {line}
                </p>
              </div>
            ))}
          </div>

          {/* What NOT to say */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#e05c7a", fontFamily: "var(--font-inter)" }}>
              What NOT to say
            </p>
            {notToSay.map((line, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-xs font-bold shrink-0 mt-0.5"
                  style={{ color: "#e05c7a", fontFamily: "var(--font-inter)" }}>
                  ✕
                </span>
                <p className="text-sm leading-relaxed"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  {line}
                </p>
              </div>
            ))}
          </div>

          {/* Follow-up actions */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#4a5568", fontFamily: "var(--font-inter)" }}>
              Follow-up
            </p>
            {followUp.map((line, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-xs font-bold shrink-0 mt-0.5"
                  style={{ color: "#4a5568", fontFamily: "var(--font-inter)" }}>
                  →
                </span>
                <p className="text-sm leading-relaxed"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  {line}
                </p>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
