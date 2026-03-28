"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ── Design System ────────────────────────────────────────────────────────────

const DS = {
  bg: "#0A0A0A",
  card: "#161616",
  border: "#252525",
  orange: "#C45B28",
  orangeGlow: "rgba(196,91,40,0.15)",
  orangeDim: "rgba(196,91,40,0.4)",
  text: "#E8E2D8",
  secondary: "#9A9A9A",
  muted: "#5A5A5A",
  success: "#3D8B37",
  successBg: "rgba(61,139,55,0.12)",
  successBorder: "rgba(61,139,55,0.25)",
} as const;

// ── Data ─────────────────────────────────────────────────────────────────────

const JOURNAL_PAIRS = [
  { q1: "What drained you today?", q2: "What recharged you?" },
  { q1: "What conversation are you avoiding?", q2: "What would happen if you just had it?" },
  { q1: "Who are you carrying right now?", q2: "Who\u2019s carrying you?" },
  { q1: "What would your crew say about you today?", q2: "What do you wish they\u2019d say?" },
  { q1: "What did you sacrifice this week for work?", q2: "Was it worth it?" },
];

const GRATITUDE_PROMPTS = [
  "Name a crew member who showed up and handled it today.",
  "What\u2019s one thing on this project you\u2019re actually proud of?",
  "Who made your day easier today \u2014 even a little?",
  "What\u2019s something at home that\u2019s going right, even if work isn\u2019t?",
  "Name a moment this week where you kept your cool when you didn\u2019t have to.",
  "What\u2019s a skill you have that most people take for granted?",
  "Who trusted you with something important recently?",
];

const RELATIONSHIP_CHALLENGES = [
  "Put your phone in another room for dinner. Every night this week.",
  "Ask your partner: \u2018What\u2019s one thing I can do better this week?\u2019 Don\u2019t defend. Just listen.",
  "Plan one thing this weekend that isn\u2019t errands or chores.",
  "Send a text right now to someone you haven\u2019t talked to in a month.",
  "When you get home tonight, ask your kids about their day \u2014 then actually stay in the room.",
  "Tell someone at home what you appreciate about them. Say it out loud, not in a text.",
  "Leave work at work for one full evening. No phone calls, no job emails after dinner.",
  "Do one thing this week that your partner has been asking for. Don\u2019t wait to be asked again.",
  "Put your kids to bed yourself tonight. No shortcuts. The whole routine.",
  "Take 10 minutes to sit with your partner \u2014 no phones, no TV. Just talk.",
  "Write down three things your family does well. Read it when the job is getting to you.",
  "Cancel something work-related that isn\u2019t critical. Use that time for your family instead.",
];

const CONNECTION_LABELS = [
  { score: 1, label: "Isolated" },
  { score: 2, label: "Off" },
  { score: 3, label: "Okay" },
  { score: 4, label: "Connected" },
  { score: 5, label: "Solid" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon({ size = 16, color = DS.success }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size}>
      <path d="M4 10.5L8 14.5L16 6.5" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight({ color = DS.muted }: { color?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" width={16} height={16} style={{ color, flexShrink: 0 }}>
      <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 100,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
        opacity: visible ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        backgroundColor: DS.card,
        border: `1px solid ${DS.successBorder}`,
        borderRadius: "12px",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        zIndex: 1000,
        pointerEvents: "none",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <CheckIcon size={18} />
      <span style={{ fontSize: "14px", fontWeight: 600, color: DS.text, fontFamily: "var(--font-inter)" }}>
        {message}
      </span>
    </div>
  );
}

// ── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, message, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.7)", padding: "24px",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: DS.card, border: `1px solid ${DS.border}`,
          borderRadius: "16px", padding: "28px", maxWidth: "360px", width: "100%",
          animation: "scaleIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: DS.text, fontFamily: "var(--font-oswald)", marginBottom: "8px", textTransform: "uppercase" }}>
          {title}
        </h3>
        <p style={{ fontSize: "14px", color: DS.secondary, lineHeight: 1.6, fontFamily: "var(--font-inter)", marginBottom: "24px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px", fontSize: "14px", fontWeight: 600,
              fontFamily: "var(--font-inter)", backgroundColor: "transparent",
              border: `1px solid ${DS.border}`, borderRadius: "8px", color: DS.secondary, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "12px", fontSize: "14px", fontWeight: 600,
              fontFamily: "var(--font-inter)", backgroundColor: DS.orange,
              border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer",
            }}
          >
            Yes, I did it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Journal History Entry ────────────────────────────────────────────────────

interface JournalEntry {
  id: string;
  created_at: string;
  pissed_off: string | null;
  handled_well: string | null;
  gratitude_1: string | null;
}

function JournalHistoryItem({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = entry.pissed_off || entry.handled_well || entry.gratitude_1;
  if (!hasContent) return null;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      style={{
        width: "100%", textAlign: "left",
        backgroundColor: expanded ? "rgba(255,255,255,0.02)" : "transparent",
        border: "none", borderBottom: `1px solid ${DS.border}`,
        padding: "14px 0", cursor: "pointer", transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: DS.secondary, fontFamily: "var(--font-inter)" }}>
          {formatDate(entry.created_at)}
        </span>
        <svg viewBox="0 0 20 20" fill="none" width={14} height={14}
          style={{ color: DS.muted, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {expanded && (
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {entry.pissed_off && (
            <p style={{ fontSize: "13px", color: DS.text, lineHeight: 1.5, fontFamily: "var(--font-inter)" }}>
              {entry.pissed_off}
            </p>
          )}
          {entry.handled_well && (
            <p style={{ fontSize: "13px", color: DS.secondary, lineHeight: 1.5, fontFamily: "var(--font-inter)", fontStyle: "italic" }}>
              {entry.handled_well}
            </p>
          )}
          {entry.gratitude_1 && (
            <p style={{ fontSize: "12px", color: DS.orange, fontFamily: "var(--font-inter)" }}>
              Grateful for: {entry.gratitude_1}
            </p>
          )}
        </div>
      )}
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

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

  const [connectionScore, setConnectionScore] = useState<number | null>(null);
  const [connectionSaving, setConnectionSaving] = useState(false);

  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeSaving, setChallengeSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [toast, setToast] = useState({ message: "", visible: false });

  const [journalHistory, setJournalHistory] = useState<JournalEntry[]>([]);
  const [connectionHistory, setConnectionHistory] = useState<{ score: number; created_at: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }, []);

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: challengeData } = await supabase
        .from("relationship_challenge_completions")
        .select("week_number")
        .eq("user_id", user.id);
      if (challengeData) {
        const weeks = challengeData.map((c: { week_number: number }) => c.week_number);
        setCompletedWeeks(weeks);
        if (weeks.includes(weekChallengeIndex)) setChallengeCompleted(true);
      }

      const { data: journalData } = await supabase
        .from("journal_entries")
        .select("id, created_at, pissed_off, handled_well, gratitude_1")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(7);
      if (journalData) setJournalHistory(journalData);

      const { data: connData } = await supabase
        .from("connection_checkins")
        .select("score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(7);
      if (connData) setConnectionHistory(connData);
    }
    loadData();
  }, [weekChallengeIndex]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const canSaveJournal = answer1.trim() || answer2.trim() || gratitudeAnswer.trim();

  async function handleSaveJournal() {
    if (!canSaveJournal) return;
    setJournalSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: newEntry, error: journalError } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        entry: [answer1.trim(), answer2.trim()].filter(Boolean).join(" | ") || "\u2013",
        pissed_off: answer1.trim() || null,
        handled_well: answer2.trim() || null,
        gratitude_1: gratitudeAnswer.trim() || null,
        gratitude_2: null,
        gratitude_3: null,
      }).select("id, created_at, pissed_off, handled_well, gratitude_1").single();

      if (journalError) {
        console.error("Failed to save journal entry:", journalError);
        setJournalSaving(false);
        showToast("Error saving entry. Please try again.");
        return;
      }

      if (gratitudeAnswer.trim()) {
        const { error: gratitudeError } = await supabase.from("gratitude_entries").insert({
          user_id: user.id,
          prompt: todayGratitudePrompt,
          entry: gratitudeAnswer.trim(),
        });

        if (gratitudeError) {
          console.error("Failed to save gratitude entry:", gratitudeError);
        }
      }

      if (newEntry) {
        setJournalHistory((prev) => [newEntry, ...prev].slice(0, 7));
      }
    }

    setJournalSaving(false);
    setAnswer1("");
    setAnswer2("");
    setGratitudeAnswer("");
    showToast("Entry saved");
  }

  async function handleConnectionScore(score: number) {
    setConnectionScore(score);
    setConnectionSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const now = new Date();
      const { error } = await supabase.from("connection_checkins").insert({ user_id: user.id, score });
      if (error) {
        console.error("Failed to log connection score:", error);
        setConnectionSaving(false);
        showToast("Error logging connection. Please try again.");
        return;
      }
      setConnectionHistory((prev) => [{ score, created_at: now.toISOString() }, ...prev].slice(0, 7));
    }
    setConnectionSaving(false);
    showToast("Connection logged");
  }

  async function handleCompleteChallenge() {
    if (challengeCompleted || challengeSaving) return;
    setChallengeSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("relationship_challenge_completions").upsert(
        { user_id: user.id, week_number: weekChallengeIndex },
        { onConflict: "user_id,week_number" }
      );
      if (error) {
        console.error("Failed to mark challenge complete:", error);
        setChallengeSaving(false);
        showToast("Error saving. Please try again.");
        return;
      }
    }
    setChallengeSaving(false);
    setChallengeCompleted(true);
    setCompletedWeeks((prev) => [...prev, weekChallengeIndex]);
    setConfirmOpen(false);
    showToast("Challenge complete");
  }

  // ── Shared Styles ──────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    backgroundColor: DS.card, border: `1px solid ${DS.border}`, borderRadius: "12px",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "24px 24px 20px", borderBottom: `1px solid ${DS.border}`,
  };

  const cardBodyStyle: React.CSSProperties = { padding: "24px" };

  const taStyle: React.CSSProperties = {
    backgroundColor: DS.bg, border: `1.5px solid ${DS.border}`,
    borderRadius: "8px", color: DS.text, fontFamily: "var(--font-inter)",
    resize: "none", width: "100%", padding: "12px 16px",
    fontSize: "14px", lineHeight: "1.6", outline: "none", transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "14px", fontWeight: 600, color: DS.text,
    fontFamily: "var(--font-inter)", marginBottom: "8px", display: "block",
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em",
    textTransform: "uppercase" as const, color: DS.orange,
    fontFamily: "var(--font-inter)", marginBottom: "4px",
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter)", color: DS.text,
    fontSize: "20px", fontWeight: 700, lineHeight: 1.3,
  };

  const subTextStyle: React.CSSProperties = {
    fontSize: "13px", color: DS.secondary,
    fontFamily: "var(--font-inter)", marginTop: "4px",
  };

  const btnPrimary: React.CSSProperties = {
    fontFamily: "var(--font-inter)", backgroundColor: DS.orange,
    color: "#fff", borderRadius: "8px", minHeight: "48px",
    border: "none", padding: "0 28px", fontSize: "13px", fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase" as const,
    cursor: "pointer", transition: "opacity 0.15s, transform 0.1s",
  };

  const focusHandler = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    e.currentTarget.style.borderColor = DS.orange;
  };
  const blurHandler = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    e.currentTarget.style.borderColor = DS.border;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen flex flex-col px-5 py-8 pb-32"
      style={{ backgroundColor: DS.bg, color: DS.text }}
    >
      <div className="max-w-lg w-full mx-auto flex flex-col gap-6">

        {/* Header */}
        <header className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10 transition-opacity hover:opacity-60 active:scale-95"
            style={{ border: `1px solid ${DS.border}`, color: DS.secondary, borderRadius: "8px" }}
            aria-label="Back to dashboard"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p style={sectionLabelStyle}>Pillar</p>
            <h1 style={{
              fontFamily: "var(--font-oswald)", color: DS.text,
              fontSize: "32px", fontWeight: 700, lineHeight: 1, textTransform: "uppercase",
            }}>
              Heart
            </h1>
          </div>
        </header>

        {/* Intro */}
        <div style={{ ...cardStyle, padding: "20px 24px", textAlign: "center", borderColor: DS.orangeDim }}>
          <p style={{ fontSize: "14px", color: DS.secondary, fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
            This is your space. No judgment.
          </p>
          <p style={{ fontSize: "13px", color: DS.muted, fontFamily: "var(--font-inter)", marginTop: "4px" }}>
            Scroll to your journal, check your connection, or pick a family activity below.
          </p>
        </div>

        {/* Tonight's Play */}
        <Link
          href="/dashboard/heart/play"
          className="flex items-center gap-4 transition-all duration-150 group active:scale-[0.98]"
          style={{ ...cardStyle, padding: "16px 20px" }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg"
            style={{ backgroundColor: DS.orangeGlow, border: "1px solid rgba(196,91,40,0.25)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
              <path d="M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12"
                stroke={DS.orange} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M17 3L21 7M21 3L17 7" stroke={DS.orange} strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="9" cy="12" r="1.5" fill={DS.orange} />
              <circle cx="12" cy="12" r="1.5" fill={DS.orange} />
              <circle cx="15" cy="12" r="1.5" fill={DS.orange} />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <p style={{ ...sectionLabelStyle, fontSize: "10px", marginBottom: 0 }}>
              Tonight&apos;s Play
            </p>
            <p style={{ fontSize: "15px", fontWeight: 600, color: DS.text, fontFamily: "var(--font-inter)", lineHeight: 1.3 }}>
              Too tired to think?
            </p>
            <p style={{ fontSize: "13px", color: DS.muted, fontFamily: "var(--font-inter)" }}>
              Pick an age, get an activity. Done in 10 seconds.
            </p>
          </div>
          <ChevronRight />
        </Link>

        {/* Daily Journal */}
        <section style={cardStyle}>
          <div style={cardHeaderStyle}>
            <p style={sectionLabelStyle}>Daily Journal</p>
            <h2 style={headingStyle}>End of day. Be honest.</h2>
            <p style={subTextStyle}>No one reads this but you.</p>
          </div>

          <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={labelStyle}>{todayPair.q1}</label>
              <textarea
                rows={3} value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                placeholder="Write it out."
                style={taStyle}
                onFocus={focusHandler} onBlur={blurHandler}
              />
            </div>

            <div>
              <label style={labelStyle}>{todayPair.q2}</label>
              <textarea
                rows={3} value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                placeholder="Be specific."
                style={taStyle}
                onFocus={focusHandler} onBlur={blurHandler}
              />
            </div>

            {/* Gratitude inline */}
            <div style={{ borderTop: `1px solid ${DS.border}`, paddingTop: "20px" }}>
              <p style={{ ...sectionLabelStyle, marginBottom: "8px" }}>Gratitude</p>
              <label style={{ ...labelStyle, fontSize: "13px", fontWeight: 500 }}>
                {todayGratitudePrompt}
              </label>
              <input
                type="text" value={gratitudeAnswer}
                onChange={(e) => setGratitudeAnswer(e.target.value)}
                placeholder="One answer is enough."
                style={{ ...taStyle, padding: "10px 16px" }}
                onFocus={focusHandler} onBlur={blurHandler}
              />
            </div>

            <button
              onClick={handleSaveJournal}
              disabled={!canSaveJournal || journalSaving}
              className="self-start active:scale-95"
              style={{ ...btnPrimary, opacity: (!canSaveJournal || journalSaving) ? 0.3 : 1 }}
            >
              {journalSaving ? "Saving\u2026" : "Save Entry"}
            </button>
          </div>

          {/* Journal history */}
          {journalHistory.length > 0 && (
            <div style={{ borderTop: `1px solid ${DS.border}` }}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between", padding: "14px 24px",
                  border: "none", backgroundColor: "transparent", cursor: "pointer",
                }}
              >
                <span style={{
                  fontSize: "12px", fontWeight: 600, color: DS.secondary,
                  fontFamily: "var(--font-inter)", letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  Recent entries ({journalHistory.length})
                </span>
                <svg viewBox="0 0 20 20" fill="none" width={14} height={14}
                  style={{ color: DS.muted, transform: showHistory ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {showHistory && (
                <div style={{ padding: "0 24px 16px" }}>
                  {journalHistory.map((entry) => (
                    <JournalHistoryItem key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Connection Check */}
        <section style={cardStyle}>
          <div style={cardHeaderStyle}>
            <p style={sectionLabelStyle}>Connection Check</p>
            <h2 style={headingStyle}>How connected do you feel today?</h2>
            <p style={subTextStyle}>1 = Isolated. 5 = Solid.</p>
          </div>
          <div style={cardBodyStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
              {CONNECTION_LABELS.map(({ score, label }) => {
                const selected = connectionScore === score;
                return (
                  <button
                    key={score}
                    onClick={() => handleConnectionScore(score)}
                    disabled={connectionSaving}
                    className="active:scale-95"
                    style={{
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: "4px", padding: "14px 4px",
                      backgroundColor: selected ? DS.orangeGlow : DS.bg,
                      border: `1.5px solid ${selected ? DS.orange : DS.border}`,
                      borderRadius: "10px",
                      cursor: connectionSaving ? "default" : "pointer",
                      transition: "all 0.15s", minHeight: "68px",
                    }}
                  >
                    <span style={{
                      fontFamily: "var(--font-oswald)", fontSize: "22px",
                      fontWeight: 700, color: selected ? DS.orange : DS.muted, transition: "color 0.15s",
                    }}>
                      {score}
                    </span>
                    <span style={{
                      fontSize: "9px", fontWeight: 600, textTransform: "uppercase",
                      letterSpacing: "0.05em", color: selected ? DS.orange : DS.muted,
                      fontFamily: "var(--font-inter)", lineHeight: 1.2,
                      textAlign: "center", transition: "color 0.15s",
                    }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Connection trend */}
            {connectionHistory.length > 1 && (
              <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: DS.muted, fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
                  Last 7:
                </span>
                <div style={{ display: "flex", gap: "4px", alignItems: "flex-end" }}>
                  {[...connectionHistory].reverse().map((c, i) => (
                    <div
                      key={i}
                      style={{
                        width: "20px",
                        height: `${(c.score / 5) * 28 + 4}px`,
                        backgroundColor: c.score >= 4 ? DS.success : c.score >= 3 ? DS.orange : DS.orangeDim,
                        borderRadius: "3px", transition: "height 0.3s",
                      }}
                      title={`${c.score}/5 - ${formatDate(c.created_at)}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Relationships */}
        <section>
          <p style={{ ...sectionLabelStyle, marginBottom: "12px" }}>Relationships</p>

          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: DS.muted, fontFamily: "var(--font-inter)", marginBottom: "6px" }}>
                Week {weekChallengeIndex + 1} of {RELATIONSHIP_CHALLENGES.length}
              </p>

              {/* 12-week progress dots */}
              <div style={{ display: "flex", gap: "5px", marginBottom: "14px" }}>
                {RELATIONSHIP_CHALLENGES.map((_, i) => {
                  const done = completedWeeks.includes(i);
                  const current = i === weekChallengeIndex;
                  return (
                    <div
                      key={i}
                      style={{
                        width: current ? "20px" : "8px", height: "8px", borderRadius: "4px",
                        backgroundColor: done ? DS.success : current ? DS.orange : DS.border,
                        transition: "all 0.2s",
                      }}
                      title={`Week ${i + 1}${done ? " (done)" : current ? " (this week)" : ""}`}
                    />
                  );
                })}
              </div>

              <h2 style={headingStyle}>The job takes from your family.</h2>
              <p style={{ ...headingStyle, color: DS.orange, marginTop: "2px" }}>
                Be intentional about giving back.
              </p>
            </div>

            <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                <div style={{ width: "3px", flexShrink: 0, backgroundColor: DS.orange, borderRadius: "2px", minHeight: "1rem" }} />
                <p style={{ fontSize: "15px", lineHeight: 1.6, color: DS.text, fontFamily: "var(--font-inter)" }}>
                  {weekChallenge}
                </p>
              </div>

              {challengeCompleted ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "14px 18px", borderRadius: "10px",
                  backgroundColor: DS.successBg, border: `1px solid ${DS.successBorder}`,
                }}>
                  <CheckIcon size={18} />
                  <p style={{
                    fontSize: "13px", fontWeight: 700, color: DS.success,
                    fontFamily: "var(--font-inter)", textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    Challenge complete this week
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={challengeSaving}
                  className="self-start active:scale-95"
                  style={{ ...btnPrimary, opacity: challengeSaving ? 0.4 : 1 }}
                >
                  {challengeSaving ? "Saving\u2026" : "Mark Complete"}
                </button>
              )}
            </div>
          </div>
        </section>

      </div>

      <Toast message={toast.message} visible={toast.visible} />
      <ConfirmDialog
        open={confirmOpen}
        title="Complete This Challenge?"
        message="You can only mark this once per week. Did you follow through on this week's challenge?"
        onConfirm={handleCompleteChallenge}
        onCancel={() => setConfirmOpen(false)}
      />
      <BottomNav />
    </main>
  );
}
