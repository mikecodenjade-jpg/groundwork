"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { updateActivityStreak } from "@/lib/streaks";

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
  const [isReturning, setIsReturning] = useState(false);

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
    }
    check();
  }, []);

  async function handleSubmit() {
    if (!mood || !sleep || !energy || !userId) return;
    setSaving(true);

    await supabase.from("daily_checkins").insert({
      user_id: userId,
      mood,
      sleep,
      energy,
      note: note.trim() || null,
    });

    updateActivityStreak(userId)
      .then(({ isReturning: r }) => setIsReturning(r))
      .catch(() => {});
    setSaving(false);
    setDone(true);
    setTimeout(() => setVisible(false), 2400);
  }

  if (!ready || !visible) return null;

  // ── Done state ──────────────────────────────────────────────────────────────

  if (done) {
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
          padding: "0 32px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 64 }}>{isReturning ? "👋" : "🔥"}</div>
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
          {isReturning ? "Welcome Back." : "Logged."}
        </p>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            color: "#9A9A9A",
            lineHeight: 1.6,
          }}
        >
          {isReturning
            ? "No pressure. Just glad you are here."
            : "Now get after it."}
        </p>
      </div>
    );
  }

  const canSubmit = mood !== null && sleep !== null && energy !== null;

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

        {/* Sleep */}
        <div>
          <SectionLabel>Shut Eye Last Night</SectionLabel>
          <PickerRow opts={SLEEP_OPTS} selected={sleep} onSelect={setSleep} />
        </div>

        {/* Energy */}
        <div>
          <SectionLabel>Tank Level</SectionLabel>
          <PickerRow opts={ENERGY_OPTS} selected={energy} onSelect={setEnergy} />
        </div>

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
