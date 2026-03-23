"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

type ChallengeType = "steps" | "meditation" | "hydration" | "workouts";

interface Challenge {
  id: string;
  title: string;
  challenge_type: ChallengeType;
  target: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by: string;
  description: string | null;
  created_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<ChallengeType, string> = {
  steps: "#1E3A5F",
  meditation: "#2A1E3F",
  hydration: "#1E3A2A",
  workouts: "#3A1E1E",
};

const TYPE_LABELS: Record<ChallengeType, string> = {
  steps: "Steps",
  meditation: "Meditation",
  hydration: "Hydration",
  workouts: "Workouts",
};

const TARGET_LABELS: Record<ChallengeType, string> = {
  steps: "steps target",
  meditation: "minutes target",
  hydration: "glasses target",
  workouts: "workouts target",
};

const TARGET_UNITS: Record<ChallengeType, string> = {
  steps: "steps",
  meditation: "minutes",
  hydration: "glasses",
  workouts: "workouts",
};

// ─── Type icons ──────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: ChallengeType }) {
  const size = 16;
  switch (type) {
    case "steps":
      return (
        <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
          <path
            d="M9 4C9 4 7 6 7 8C7 10 9 11 9 11C9 11 7 12 7 14C7 16 9 18 9 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 6C15 6 13 8 13 10C13 12 15 13 15 13C15 13 13 14 13 16C13 18 15 20 15 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "meditation":
      return (
        <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
          <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
          <path
            d="M6 20C6 20 7 15 12 15C17 15 18 20 18 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M4 18C5 16 7 15 9 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M20 18C19 16 17 15 15 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "hydration":
      return (
        <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
          <path
            d="M12 3C12 3 6 10 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 10 12 3 12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 14C9 15.7 10.3 17 12 17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "workouts":
      return (
        <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
          <rect x="3" y="9" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="17" y="9" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
          <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTarget(value: number, type: ChallengeType) {
  const formatted = type === "steps" ? value.toLocaleString() : String(value);
  return `${formatted} ${TARGET_UNITS[type]}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChallengesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<ChallengeType>("steps");
  const [formDescription, setFormDescription] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  // ─── Load data ─────────────────────────────────────────────────────────────

  async function loadChallenges(uid: string) {
    const { data: challengeData } = await supabase
      .from("team_challenges")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const list: Challenge[] = challengeData ?? [];
    setChallenges(list);

    // Joined set
    const { data: joined } = await supabase
      .from("challenge_participants")
      .select("challenge_id")
      .eq("user_id", uid);

    const ids = new Set((joined ?? []).map((r: { challenge_id: string }) => r.challenge_id));
    setJoinedIds(ids);

    // Participant counts
    const counts: Record<string, number> = {};
    for (const c of list) {
      const { count } = await supabase
        .from("challenge_participants")
        .select("id", { count: "exact", head: true })
        .eq("challenge_id", c.id);
      counts[c.id] = count ?? 0;
    }
    setParticipantCounts(counts);
  }

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      await loadChallenges(user.id);
      setLoading(false);
    }
    load();
  }, []);

  // ─── Join challenge ────────────────────────────────────────────────────────

  async function handleJoin(challengeId: string) {
    if (!userId) return;
    setJoining(challengeId);
    await supabase.from("challenge_participants").upsert(
      { challenge_id: challengeId, user_id: userId, current_value: 0 },
      { onConflict: "challenge_id,user_id" }
    );
    setJoinedIds((prev) => new Set([...prev, challengeId]));
    setParticipantCounts((prev) => ({
      ...prev,
      [challengeId]: (prev[challengeId] ?? 0) + 1,
    }));
    setJoining(null);
  }

  // ─── Create challenge ──────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);

    await supabase.from("team_challenges").insert({
      title: formTitle,
      challenge_type: formType,
      description: formDescription || null,
      target: Number(formTarget),
      start_date: formStartDate,
      end_date: formEndDate,
      is_active: true,
      created_by: userId,
    });

    // Reset form
    setFormTitle("");
    setFormType("steps");
    setFormDescription("");
    setFormTarget("");
    setFormStartDate("");
    setFormEndDate("");
    setShowForm(false);

    // Refresh list
    await loadChallenges(userId);
    setSubmitting(false);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-8 pb-28">
        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px" }}
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
          <div className="flex-1">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Crew
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Challenges
            </h1>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs font-bold uppercase tracking-widest px-4"
            style={{
              backgroundColor: showForm ? "#161616" : "#C45B28",
              color: showForm ? "#9A9A9A" : "#0A0A0A",
              border: showForm ? "1px solid #252525" : "none",
              borderRadius: "8px",
              minHeight: "48px",
              fontFamily: "var(--font-inter)",
            }}
          >
            {showForm ? "Cancel" : "+ Create"}
          </button>
        </header>

        {/* ─── Create Form ────────────────────────────────────────────────── */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-4 p-5"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
            }}
          >
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              New Challenge
            </p>

            {/* Title */}
            <input
              type="text"
              placeholder="Challenge title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: "#0A0A0A",
                border: "1px solid #252525",
                borderRadius: "8px",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
              }}
            />

            {/* Type */}
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as ChallengeType)}
              className="w-full px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: "#0A0A0A",
                border: "1px solid #252525",
                borderRadius: "8px",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
              }}
            >
              <option value="steps">Steps</option>
              <option value="meditation">Meditation</option>
              <option value="hydration">Hydration</option>
              <option value="workouts">Workouts</option>
            </select>

            {/* Description */}
            <textarea
              placeholder="Description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-sm outline-none resize-none"
              style={{
                backgroundColor: "#0A0A0A",
                border: "1px solid #252525",
                borderRadius: "8px",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
              }}
            />

            {/* Target */}
            <div>
              <label
                className="block text-xs font-semibold tracking-[0.25em] uppercase mb-1.5"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                {TARGET_LABELS[formType]}
              </label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                required
                min={1}
                className="w-full px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #252525",
                  borderRadius: "8px",
                  color: "#E8E2D8",
                  fontFamily: "var(--font-inter)",
                }}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-semibold tracking-[0.25em] uppercase mb-1.5"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "#0A0A0A",
                    border: "1px solid #252525",
                    borderRadius: "8px",
                    color: "#E8E2D8",
                    fontFamily: "var(--font-inter)",
                    colorScheme: "dark",
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold tracking-[0.25em] uppercase mb-1.5"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "#0A0A0A",
                    border: "1px solid #252525",
                    borderRadius: "8px",
                    color: "#E8E2D8",
                    fontFamily: "var(--font-inter)",
                    colorScheme: "dark",
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full text-sm font-bold uppercase tracking-widest"
              style={{
                backgroundColor: "#C45B28",
                color: "#0A0A0A",
                borderRadius: "8px",
                minHeight: "48px",
                opacity: submitting ? 0.6 : 1,
                fontFamily: "var(--font-inter)",
              }}
            >
              {submitting ? "Creating..." : "Create Challenge"}
            </button>
          </form>
        )}

        {/* ─── Loading skeleton ───────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "12px",
                }}
              />
            ))}
          </div>
        )}

        {/* ─── Empty state ────────────────────────────────────────────────── */}
        {!loading && challenges.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            style={{ color: "#9A9A9A" }}
          >
            <svg viewBox="0 0 48 48" fill="none" width={48} height={48} className="mb-4 opacity-40">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
              <path d="M16 24H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M24 16V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p
              className="text-lg font-bold uppercase mb-1"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              No Challenges Yet
            </p>
            <p className="text-sm" style={{ fontFamily: "var(--font-inter)" }}>
              Be the first to create a challenge for your crew.
            </p>
          </div>
        )}

        {/* ─── Challenge cards ────────────────────────────────────────────── */}
        {!loading && challenges.length > 0 && (
          <div className="flex flex-col gap-4">
            {challenges.map((c) => {
              const isJoined = joinedIds.has(c.id);
              const count = participantCounts[c.id] ?? 0;

              return (
                <div
                  key={c.id}
                  className="relative flex flex-col gap-3 p-5"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "12px",
                  }}
                >
                  {/* Clickable overlay link */}
                  <Link
                    href={`/dashboard/challenges/${c.id}`}
                    className="absolute inset-0"
                    style={{ borderRadius: "12px" }}
                    aria-label={`View ${c.title}`}
                  />

                  {/* Type pill */}
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: TYPE_COLORS[c.challenge_type],
                        borderRadius: "999px",
                        color: "#E8E2D8",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      <TypeIcon type={c.challenge_type} />
                      {TYPE_LABELS[c.challenge_type]}
                    </span>
                  </div>

                  {/* Title + description */}
                  <div>
                    <h2
                      className="text-xl font-bold uppercase leading-tight"
                      style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                    >
                      {c.title}
                    </h2>
                    {c.description && (
                      <p
                        className="text-sm mt-1 line-clamp-2"
                        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                      >
                        {c.description}
                      </p>
                    )}
                  </div>

                  {/* Goal + dates */}
                  <div
                    className="flex flex-wrap gap-x-6 gap-y-1 text-sm"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    <span>
                      <span style={{ color: "#E8E2D8", fontWeight: 600 }}>Goal:</span>{" "}
                      {fmtTarget(c.target, c.challenge_type)}
                    </span>
                    <span>
                      {fmtDate(c.start_date)} &ndash; {fmtDate(c.end_date)}
                    </span>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className="text-xs"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {count} {count === 1 ? "participant" : "participants"}
                    </span>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isJoined) handleJoin(c.id);
                      }}
                      disabled={isJoined || joining === c.id}
                      className="relative z-10 text-xs font-bold uppercase tracking-widest px-5"
                      style={{
                        backgroundColor: isJoined ? "#161616" : "#C45B28",
                        color: isJoined ? "#9A9A9A" : "#0A0A0A",
                        border: isJoined ? "1px solid #252525" : "none",
                        borderRadius: "8px",
                        minHeight: "36px",
                        fontFamily: "var(--font-inter)",
                        opacity: joining === c.id ? 0.6 : 1,
                        cursor: isJoined ? "default" : "pointer",
                      }}
                    >
                      {joining === c.id ? "Joining..." : isJoined ? "Joined" : "Join"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
