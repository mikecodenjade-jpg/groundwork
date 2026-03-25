"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CrisisScreen from "@/components/CrisisScreen";
import { detectCrisisKeywords } from "@/lib/crisisDetection";

// ─── Constants ─────────────────────────────────────────────────────────────────

const MOOD_OPTS = [
  { v: 1, label: "In the Mud",  color: "#ef4444" },
  { v: 2, label: "Struggling",  color: "#f97316" },
  { v: 3, label: "Getting By",  color: "#eab308" },
  { v: 4, label: "Good to Go",  color: "#84cc16" },
  { v: 5, label: "Rock Solid",  color: "#22c55e" },
];

const SLEEP_OPTS = [
  { v: 1, label: "Didn't Sleep",     color: "#ef4444" },
  { v: 2, label: "Rough Night",      color: "#f97316" },
  { v: 3, label: "Got By",           color: "#eab308" },
  { v: 4, label: "Decent Rest",      color: "#84cc16" },
  { v: 5, label: "Slept Like a Log", color: "#22c55e" },
];

const ENERGY_OPTS = [
  { v: 1, label: "Running on Empty", color: "#ef4444" },
  { v: 2, label: "Low Tank",         color: "#f97316" },
  { v: 3, label: "Half Charge",      color: "#eab308" },
  { v: 4, label: "Charged Up",       color: "#84cc16" },
  { v: 5, label: "Full Battery",     color: "#22c55e" },
];

// ─── Streak updater ────────────────────────────────────────────────────────────

async function updateStreakRecord(userId: string) {
  const today = new Date().toLocaleDateString("en-CA");

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(95);

  if (!checkins) return;

  const dates = Array.from(
    new Set(checkins.map((c) => new Date(c.created_at).toLocaleDateString("en-CA")))
  ).sort((a, b) => b.localeCompare(a));

  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
  let current = 0;

  if (dates[0] === today || dates[0] === yesterday) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevMs = new Date(dates[i - 1]).getTime();
      const curMs = new Date(dates[i]).getTime();
      if (Math.round((prevMs - curMs) / 86400000) === 1) current++;
      else break;
    }
  }

  let longest = current;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const prevMs = new Date(dates[i - 1]).getTime();
    const curMs = new Date(dates[i]).getTime();
    if (Math.round((prevMs - curMs) / 86400000) === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  await supabase.from("checkin_streaks").upsert(
    {
      user_id: userId,
      current_streak: current,
      longest_streak: longest,
      last_checkin_date: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

// ─── Picker Row ────────────────────────────────────────────────────────────────

type Opt = { v: number; label: string; color: string };

function PickerRow({
  opts,
  selected,
  onSelect,
}: {
  opts: Opt[];
  selected: number | null;
  onSelect: (v: number) => void;
}) {
  const selectedOpt = opts.find((o) => o.v === selected) ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {opts.map((opt) => {
          const active = selected === opt.v;
          return (
            <button
              key={opt.v}
              onClick={() => onSelect(opt.v)}
              style={{
                flex: 1,
                minHeight: 56,
                border: active ? `2px solid ${opt.color}` : "2px solid #252525",
                borderRadius: 10,
                backgroundColor: active ? `${opt.color}22` : "#161616",
                color: active ? opt.color : "#9A9A9A",
                fontFamily: "var(--font-oswald)",
                fontSize: 22,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {opt.v}
            </button>
          );
        })}
      </div>
      <div
        style={{
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selectedOpt ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: selectedOpt.color,
              fontFamily: "var(--font-inter)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            {selectedOpt.label}
          </span>
        ) : (
          <span
            style={{
              fontSize: 11,
              color: "#3A3A3A",
              fontFamily: "var(--font-inter)",
            }}
          >
            tap to select
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Section Label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-inter)",
        fontSize: 11,
        fontWeight: 600,
        color: "#E8E2D8",
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DailyCheckinModal() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [isLateNight, setIsLateNight] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [simplified, setSimplified] = useState(false);

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setReady(true);
        return;
      }
      setUserId(user.id);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("daily_checkins")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString())
        .limit(1);

      if (!data || data.length === 0) {
        setVisible(true);
      }
      setReady(true);

      // Detect late-night login
      const hour = new Date().getHours();
      setIsLateNight(hour >= 22 || hour <= 4);

      // Detect returning after 3+ day absence
      const lastKey = "gw_checkin_last_date";
      const lastDate = localStorage.getItem(lastKey);
      if (lastDate) {
        const diffDays = Math.floor(
          (Date.now() - new Date(lastDate).getTime()) / 86400000
        );
        if (diffDays >= 3) setIsReturning(true);
      }

      // Tier 2: simplify check-in to mood only
      const tier = parseInt(localStorage.getItem("gw_support_tier") ?? "0", 10);
      if (tier >= 2) setSimplified(true);
    }
    check();
  }, []);

  async function handleSubmit() {
    if (!mood || !sleep || !energy || !userId) return;

    // Crisis detection runs before any server call.
    // If crisis keywords found in note, skip saving the note and surface resources.
    if (note.trim() && detectCrisisKeywords(note)) {
      setShowCrisis(true);
      return;
    }

    setSaving(true);

    await supabase.from("daily_checkins").insert({
      user_id: userId,
      mood,
      sleep: simplified ? null : sleep,
      energy: simplified ? null : energy,
      note: note.trim() || null,
    });

    // Record completion date for returning-user detection
    try {
      localStorage.setItem("gw_checkin_last_date", new Date().toISOString());
    } catch {}

    updateStreakRecord(userId).catch(() => {});
    setSaving(false);
    setDone(true);

    // Auto-dismiss only for normal mood — tier 1 users see support content first
    if (mood >= 3) {
      setTimeout(() => setVisible(false), 1800);
    }
  }

  if (showCrisis) return <CrisisScreen onDismiss={() => { setShowCrisis(false); setVisible(false); }} />;
  if (!ready || !visible) return null;

  // ── Done state ──────────────────────────────────────────────────────────────

  if (done) {
    // Tier 1: mood < 3 — gentle support
    if (mood !== null && mood < 3) {
      const isSleepTool = isLateNight;
      const toolHref = isSleepTool
        ? "/dashboard/mind?tool=sleep-protocol"
        : "/dashboard/mind?tool=box-breathing";
      const toolLabel = isSleepTool ? "Sleep Protocol" : "Box Breathing";

      const headline = isReturning
        ? "Welcome back. No pressure. Just glad you are here."
        : isLateNight
        ? "Late night. Your mind needs rest."
        : "Rough stretch. Here is a quick reset.";

      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "#0a0f1a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: "40px 28px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: 26,
              fontWeight: 700,
              color: "#E8E2D8",
              textTransform: "uppercase",
              lineHeight: 1.2,
              maxWidth: 320,
            }}
          >
            {headline}
          </p>
          <Link
            href={toolHref}
            onClick={() => setVisible(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: 320,
              minHeight: 56,
              backgroundColor: "#f97316",
              borderRadius: 12,
              fontFamily: "var(--font-inter)",
              fontSize: 14,
              fontWeight: 700,
              color: "#0a0f1a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textDecoration: "none",
            }}
          >
            {toolLabel} — Start Now
          </Link>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              color: "#9A9A9A",
              maxWidth: 280,
              lineHeight: 1.6,
            }}
          >
            Everything here is private. Your employer never sees this.
            This is just for you.
          </p>
          <button
            onClick={() => setVisible(false)}
            style={{
              background: "none",
              border: "none",
              color: "#3A3A3A",
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 0",
              marginTop: 4,
            }}
          >
            Continue
          </button>
        </div>
      );
    }

    // Normal done state (mood >= 3)
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          backgroundColor: "#0a0f1a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 64 }}>🔥</div>
        <p
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: 32,
            fontWeight: 700,
            color: "#f97316",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Logged.
        </p>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            color: "#9A9A9A",
          }}
        >
          Now get after it.
        </p>
      </div>
    );
  }

  const canSubmit = mood !== null && (simplified || (sleep !== null && energy !== null));

  // ── Form ────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "#0a0f1a",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "52px 24px 56px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 10,
              fontWeight: 600,
              color: "#f97316",
              textTransform: "uppercase",
              letterSpacing: "0.3em",
            }}
          >
            Groundwork
          </p>
          <h1
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: 34,
              fontWeight: 700,
              color: "#E8E2D8",
              textTransform: "uppercase",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Daily Check-In
          </h1>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              color: "#9A9A9A",
              marginTop: 2,
            }}
          >
            30 seconds. Then get to work.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "#1A1A1A" }} />

        {/* Mood */}
        <div>
          <SectionLabel>How&apos;s Your Head</SectionLabel>
          <PickerRow opts={MOOD_OPTS} selected={mood} onSelect={setMood} />
        </div>

        {/* Sleep — hidden in simplified (Tier 2) mode */}
        {!simplified && (
          <div>
            <SectionLabel>Shut Eye Last Night</SectionLabel>
            <PickerRow opts={SLEEP_OPTS} selected={sleep} onSelect={setSleep} />
          </div>
        )}

        {/* Energy — hidden in simplified (Tier 2) mode */}
        {!simplified && (
          <div>
            <SectionLabel>Tank Level</SectionLabel>
            <PickerRow opts={ENERGY_OPTS} selected={energy} onSelect={setEnergy} />
          </div>
        )}

        {/* Privacy note in Tier 2 */}
        {simplified && (
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              color: "#9A9A9A",
              lineHeight: 1.6,
            }}
          >
            Everything here is private. Your employer never sees this.
            This is just for you.
          </p>
        )}

        {/* Note */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              fontWeight: 600,
              color: "#E8E2D8",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: 10,
            }}
          >
            Anything on Your Mind?{" "}
            <span style={{ color: "#9A9A9A", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              (optional)
            </span>
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="One line. What's on your mind today?"
            maxLength={200}
            rows={2}
            style={{
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: 10,
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
              fontSize: 14,
              padding: "12px 14px",
              resize: "none",
              outline: "none",
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Submit */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            style={{
              width: "100%",
              height: 60,
              backgroundColor: canSubmit && !saving ? "#f97316" : "#1A0D00",
              border: "none",
              borderRadius: 12,
              color: canSubmit && !saving ? "#0a0f1a" : "#4A2800",
              fontFamily: "var(--font-oswald)",
              fontSize: 18,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: canSubmit && !saving ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
            }}
          >
            {saving ? "Logging…" : "Log It"}
          </button>

          <button
            onClick={() => setVisible(false)}
            style={{
              background: "none",
              border: "none",
              color: "#3A3A3A",
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 0",
              textAlign: "center",
              width: "100%",
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
