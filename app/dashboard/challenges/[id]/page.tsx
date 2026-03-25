"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

type Challenge = {
  id: string;
  title: string;
  challenge_type: "steps" | "meditation" | "hydration" | "workouts";
  target: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by: string;
  description: string | null;
};

type Participant = {
  id: string;
  challenge_id: string;
  user_id: string;
  current_value: number;
  joined_at: string;
  updated_at: string;
  user_profiles: { full_name: string | null } | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const UNIT_MAP: Record<Challenge["challenge_type"], string> = {
  steps: "steps",
  meditation: "minutes",
  hydration: "glasses",
  workouts: "workouts",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTarget(value: number, type: Challenge["challenge_type"]) {
  if (type === "steps") return value.toLocaleString();
  return String(value);
}

function rankColor(rank: number): string {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return "#9A9A9A";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressInput, setProgressInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [joining, setJoining] = useState(false);

  const loadParticipants = useCallback(async () => {
    const { data } = await supabase
      .from("challenge_participants")
      .select("*, user_profiles(full_name)")
      .eq("challenge_id", id)
      .order("current_value", { ascending: false });
    if (data) setParticipants(data as Participant[]);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: challengeData } = await supabase
        .from("team_challenges")
        .select("*")
        .eq("id", id)
        .single();

      if (challengeData) setChallenge(challengeData as Challenge);

      await loadParticipants();
      setLoading(false);
    }

    load();
  }, [id, loadParticipants]);

  // Derived state
  const myRecord = participants.find((p) => p.user_id === userId) ?? null;
  const unit = challenge ? UNIT_MAP[challenge.challenge_type] : "";
  const isEnded = challenge
    ? new Date(challenge.end_date) < new Date()
    : false;

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleUpdateProgress() {
    if (!userId || !challenge || updating) return;
    const newValue = Number(progressInput);
    if (isNaN(newValue) || newValue < 0) return;

    setUpdating(true);
    await supabase
      .from("challenge_participants")
      .update({ current_value: newValue })
      .eq("challenge_id", challenge.id)
      .eq("user_id", userId);

    await loadParticipants();
    setProgressInput("");
    setUpdating(false);
  }

  async function handleJoin() {
    if (!userId || !challenge || joining) return;

    setJoining(true);
    await supabase.from("challenge_participants").insert({
      challenge_id: challenge.id,
      user_id: userId,
      current_value: 0,
    });

    await loadParticipants();
    setJoining(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen flex flex-col px-4 py-8"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-6 pb-28">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex items-center gap-4">
          <Link
            href="/dashboard/challenges"
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{
              border: "1px solid #252525",
              color: "#9A9A9A",
              borderRadius: "6px",
            }}
            aria-label="Back to challenges"
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
            {challenge && (
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                {challenge.challenge_type}
              </p>
            )}
            {challenge && (
              <h1
                className="text-3xl font-bold uppercase leading-tight"
                style={{
                  fontFamily: "var(--font-oswald)",
                  color: "#E8E2D8",
                }}
              >
                {challenge.title}
              </h1>
            )}
          </div>
        </header>

        {/* ── Loading skeleton ────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col gap-4">
            <div
              className="h-9 w-3/4 animate-pulse rounded-lg"
              style={{ backgroundColor: "#161616" }}
            />
            <div
              className="h-32 w-full animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
            <div
              className="h-24 w-full animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
            <div
              className="h-64 w-full animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
          </div>
        )}

        {/* ── Challenge loaded ────────────────────────────────────────── */}
        {!loading && challenge && (
          <>
            {/* ── Info card ──────────────────────────────────────────── */}
            <div
              className="p-5 rounded-xl flex flex-col gap-4"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
              }}
            >
              {challenge.description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "#9A9A9A",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {challenge.description}
                </p>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                    style={{
                      color: "#C45B28",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    Goal
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: "#E8E2D8",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {formatTarget(challenge.target, challenge.challenge_type)}{" "}
                    {unit}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                    style={{
                      color: "#C45B28",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    Start
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: "#E8E2D8",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {formatDate(challenge.start_date)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                    style={{
                      color: "#C45B28",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    End
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: "#E8E2D8",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {formatDate(challenge.end_date)}
                  </p>
                </div>
              </div>

              <div>
                {isEnded ? (
                  <span
                    className="inline-block text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: "rgba(154,154,154,0.1)",
                      color: "#9A9A9A",
                      border: "1px solid #2A2A2A",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    Ended
                  </span>
                ) : (
                  <span
                    className="inline-block text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: "rgba(196,91,40,0.12)",
                      color: "#C45B28",
                      border: "1px solid rgba(196,91,40,0.25)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* ── User progress section ──────────────────────────────── */}
            {myRecord && (
              <div
                className="p-5 rounded-xl flex flex-col gap-4"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "12px",
                }}
              >
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase"
                  style={{
                    color: "#C45B28",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Your Progress
                </p>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: "#E8E2D8",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {myRecord.current_value.toLocaleString()} /{" "}
                      {challenge.target.toLocaleString()} {unit}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: "#9A9A9A",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {Math.min(
                        100,
                        Math.round(
                          (myRecord.current_value / challenge.target) * 100
                        )
                      )}
                      %
                    </span>
                  </div>
                  <div
                    className="w-full h-3 rounded-full overflow-hidden"
                    style={{ backgroundColor: "#252525" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (myRecord.current_value / challenge.target) * 100
                        )}%`,
                        backgroundColor: "#C45B28",
                      }}
                    />
                  </div>
                </div>

                {/* Update form */}
                {!isEnded && (
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min={0}
                      placeholder={`New ${unit} value`}
                      value={progressInput}
                      onChange={(e) => setProgressInput(e.target.value)}
                      className="flex-1 px-4 py-3 text-sm rounded-lg outline-none"
                      style={{
                        backgroundColor: "#0A0A0A",
                        border: "1px solid #252525",
                        color: "#E8E2D8",
                        fontFamily: "var(--font-inter)",
                        borderRadius: "8px",
                        minHeight: "48px",
                      }}
                    />
                    <button
                      onClick={handleUpdateProgress}
                      disabled={updating || !progressInput}
                      className="px-5 font-bold uppercase tracking-widest text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{
                        backgroundColor: "#C45B28",
                        color: "#0A0A0A",
                        borderRadius: "8px",
                        border: "none",
                        minHeight: "48px",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {updating ? "Saving..." : "Update Progress"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Join button (if not a participant) ─────────────────── */}
            {!myRecord && userId && !isEnded && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-4 font-bold uppercase tracking-widest text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                  borderRadius: "8px",
                  border: "none",
                  minHeight: "48px",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {joining ? "Joining..." : "Join this Challenge"}
              </button>
            )}

            {/* ── Leaderboard ────────────────────────────────────────── */}
            <div
              className="p-5 rounded-xl flex flex-col gap-4"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
              }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase"
                  style={{
                    color: "#C45B28",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Leaderboard
                </p>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: "#9A9A9A",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {participants.length} participant
                  {participants.length !== 1 ? "s" : ""}
                </span>
              </div>

              {participants.length === 0 && (
                <p
                  className="text-sm text-center py-6"
                  style={{
                    color: "#9A9A9A",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Be the first one in. Invite your crew.
                </p>
              )}

              <div className="flex flex-col gap-2">
                {participants.map((p, idx) => {
                  const rank = idx + 1;
                  const isMe = p.user_id === userId;
                  const pct = Math.min(
                    100,
                    (p.current_value / challenge.target) * 100
                  );
                  const name =
                    p.user_profiles?.full_name || "Anonymous";

                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor: isMe ? "#1A0A00" : "transparent",
                        borderLeft: isMe
                          ? "3px solid #C45B28"
                          : "3px solid transparent",
                      }}
                    >
                      {/* Rank */}
                      <span
                        className="text-sm font-bold w-6 text-center flex-shrink-0"
                        style={{
                          color: rankColor(rank),
                          fontFamily: "var(--font-oswald)",
                        }}
                      >
                        {rank}
                      </span>

                      {/* Name + progress bar */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate mb-1"
                          style={{
                            color: "#E8E2D8",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          {name}
                        </p>
                        <div
                          className="w-full h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: "#252525" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: rankColor(rank),
                            }}
                          />
                        </div>
                      </div>

                      {/* Value */}
                      <span
                        className="text-xs font-semibold flex-shrink-0 text-right"
                        style={{
                          color: "#9A9A9A",
                          fontFamily: "var(--font-inter)",
                          minWidth: "60px",
                        }}
                      >
                        {p.current_value.toLocaleString()} {unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Not found ───────────────────────────────────────────────── */}
        {!loading && !challenge && (
          <div className="text-center py-16">
            <p
              className="text-sm mb-3"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Challenge not found.
            </p>
            <Link
              href="/dashboard/challenges"
              className="text-sm font-semibold"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              &larr; Back to challenges
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
