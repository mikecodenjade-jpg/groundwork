"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 1 | 2 | 3 | 4 | 5;

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROLES = [
  "Apprentice",
  "Journeyman",
  "Foreman",
  "Project Manager",
  "Office Staff",
];

const PILLARS = [
  { id: "Train", emoji: "💪", desc: "Physical strength & fitness" },
  { id: "Mind", emoji: "🧠", desc: "Mental health & focus" },
  { id: "Fuel", emoji: "🍽️", desc: "Nutrition & energy" },
  { id: "Heart", emoji: "❤️", desc: "Family & relationships" },
  { id: "Lead", emoji: "🏗️", desc: "Leadership & crew" },
];

const MOODS = [
  { label: "Locked In", dot: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "#22c55e" },
  { label: "Solid", dot: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "#3b82f6" },
  { label: "Alright", dot: "#eab308", bg: "rgba(234,179,8,0.12)", border: "#eab308" },
  { label: "Running Low", dot: "#f97316", bg: "rgba(249,115,22,0.12)", border: "#f97316" },
  { label: "Struggling", dot: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "#ef4444" },
];

const TIPS: Record<string, string> = {
  Train: "Start your first session today — even 10 minutes builds the habit.",
  Mind: "Take 5 minutes before your next shift to breathe and reset.",
  Fuel: "Track what you eat today — awareness is the first step.",
  Heart: "Call someone you care about tonight, even just for 2 minutes.",
  Lead: "Give one specific compliment to someone on your crew today.",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "6px", marginBottom: "36px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "3px",
            borderRadius: "2px",
            backgroundColor: i < step ? "#f97316" : "#1f2937",
            transition: "background-color 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}

function OptionBtn({
  label,
  sublabel,
  selected,
  onClick,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        width: "100%",
        padding: "16px 20px",
        backgroundColor: selected ? "rgba(249,115,22,0.12)" : "#111827",
        border: `2px solid ${selected ? "#f97316" : "#1f2937"}`,
        borderRadius: "10px",
        cursor: "pointer",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        gap: "4px",
        textAlign: "left",
        minHeight: "52px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "15px",
          fontWeight: 600,
          color: selected ? "#f9fafb" : "#d1d5db",
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "12px",
            color: selected ? "#9ca3af" : "#4b5563",
            lineHeight: 1.3,
          }}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(1);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("");
  const [pillars, setPillars] = useState<string[]>([]);
  const [mood, setMood] = useState("");

  // Auth check + skip if already onboarded
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("id", data.session.user.id)
        .single();
      if (profile?.onboarding_completed) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  function togglePillar(id: string) {
    setPillars((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  async function finish() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_profiles").upsert({
        id: user.id,
        full_name: firstName.trim(),
        role,
        priority_goals: pillars,
        initial_mood: mood,
        onboarding_completed: true,
      });
    }
    router.replace("/dashboard");
  }

  // Shared styles
  const container: React.CSSProperties = {
    backgroundColor: "#0a0f1a",
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    padding: "32px 24px 40px",
    maxWidth: "480px",
    margin: "0 auto",
    width: "100%",
  };

  const stepLabel: React.CSSProperties = {
    fontFamily: "var(--font-inter)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "#f97316",
    marginBottom: "10px",
  };

  const heading: React.CSSProperties = {
    fontFamily: "var(--font-oswald)",
    fontSize: "clamp(28px, 7vw, 38px)",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#f9fafb",
    lineHeight: 1.05,
    marginBottom: "10px",
  };

  const subhead: React.CSSProperties = {
    fontFamily: "var(--font-inter)",
    fontSize: "14px",
    color: "#9ca3af",
    lineHeight: 1.55,
    marginBottom: "28px",
  };

  const actions: React.CSSProperties = {
    marginTop: "auto",
    paddingTop: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const primaryBtn: React.CSSProperties = {
    width: "100%",
    padding: "18px",
    backgroundColor: "#f97316",
    color: "#0a0f1a",
    fontFamily: "var(--font-inter)",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    minHeight: "52px",
  };

  const disabledBtn: React.CSSProperties = {
    ...primaryBtn,
    opacity: 0.3,
    cursor: "not-allowed",
  };

  const backBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-inter)",
    fontSize: "12px",
    color: "#4b5563",
    textAlign: "center",
    padding: "8px",
  };

  if (checking) {
    return (
      <main
        style={{
          ...container,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "2px solid #1f2937",
            borderTopColor: "#f97316",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  // ── Screen 1: Welcome ─────────────────────────────────────────────────────
  if (screen === 1) {
    const canContinue = firstName.trim().length > 0;
    return (
      <main style={container}>
        <ProgressBar step={1} total={5} />
        <p style={stepLabel}>Step 1 of 5</p>
        <h1 style={heading}>Build your groundwork.</h1>
        <p style={subhead}>A few quick questions to personalize your experience.</p>

        <label
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#6b7280",
            marginBottom: "8px",
            display: "block",
          }}
        >
          First Name
        </label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canContinue && setScreen(2)}
          placeholder="Your first name"
          autoFocus
          autoComplete="given-name"
          style={{
            width: "100%",
            padding: "16px 20px",
            backgroundColor: "#111827",
            border: `2px solid ${firstName.trim() ? "#f97316" : "#1f2937"}`,
            borderRadius: "10px",
            color: "#f9fafb",
            fontFamily: "var(--font-inter)",
            fontSize: "16px",
            fontWeight: 500,
            outline: "none",
            transition: "border-color 0.15s ease",
            minHeight: "52px",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "20px",
            padding: "14px 16px",
            backgroundColor: "rgba(249,115,22,0.06)",
            border: "1px solid rgba(249,115,22,0.2)",
            borderRadius: "8px",
          }}
        >
          <svg
            width="14"
            height="16"
            viewBox="0 0 14 16"
            fill="none"
            style={{ flexShrink: 0 }}
          >
            <rect
              x="1"
              y="6"
              width="12"
              height="9"
              rx="2"
              stroke="#f97316"
              strokeWidth="1.5"
            />
            <path
              d="M4 6V4.5a3 3 0 016 0V6"
              stroke="#f97316"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "12px",
              color: "#9ca3af",
              lineHeight: 1.4,
            }}
          >
            <strong style={{ color: "#f97316" }}>Your employer never sees your data.</strong>{" "}
            This is yours alone.
          </span>
        </div>

        <div style={actions}>
          <button
            onClick={() => setScreen(2)}
            style={canContinue ? primaryBtn : disabledBtn}
            disabled={!canContinue}
          >
            Next
          </button>
        </div>
      </main>
    );
  }

  // ── Screen 2: Role ────────────────────────────────────────────────────────
  if (screen === 2) {
    return (
      <main style={container}>
        <ProgressBar step={2} total={5} />
        <p style={stepLabel}>Step 2 of 5</p>
        <h1 style={heading}>What&apos;s your role?</h1>
        <p style={subhead}>So we know how to talk to you, {firstName.trim()}.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {ROLES.map((r) => (
            <OptionBtn
              key={r}
              label={r}
              selected={role === r}
              onClick={() => setRole(r)}
            />
          ))}
        </div>
        <div style={actions}>
          <button
            onClick={() => setScreen(3)}
            style={role ? primaryBtn : disabledBtn}
            disabled={!role}
          >
            Next
          </button>
          <button onClick={() => setScreen(1)} style={backBtn}>
            Back
          </button>
        </div>
      </main>
    );
  }

  // ── Screen 3: Pillars ─────────────────────────────────────────────────────
  if (screen === 3) {
    return (
      <main style={container}>
        <ProgressBar step={3} total={5} />
        <p style={stepLabel}>Step 3 of 5</p>
        <h1 style={heading}>What matters most right now?</h1>
        <p style={subhead}>Pick 1–2 areas. We&apos;ll build around them.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {PILLARS.map(({ id, emoji, desc }) => (
            <button
              key={id}
              onClick={() => togglePillar(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                width: "100%",
                padding: "16px 20px",
                backgroundColor: pillars.includes(id)
                  ? "rgba(249,115,22,0.12)"
                  : "#111827",
                border: `2px solid ${pillars.includes(id) ? "#f97316" : "#1f2937"}`,
                borderRadius: "10px",
                cursor:
                  !pillars.includes(id) && pillars.length >= 2
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  !pillars.includes(id) && pillars.length >= 2 ? 0.4 : 1,
                transition:
                  "border-color 0.15s ease, background-color 0.15s ease, opacity 0.15s ease",
                textAlign: "left",
                minHeight: "64px",
              }}
            >
              <span style={{ fontSize: "24px", flexShrink: 0 }}>{emoji}</span>
              <span>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-inter)",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: pillars.includes(id) ? "#f9fafb" : "#d1d5db",
                  }}
                >
                  {id}
                </span>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-inter)",
                    fontSize: "12px",
                    color: pillars.includes(id) ? "#9ca3af" : "#4b5563",
                  }}
                >
                  {desc}
                </span>
              </span>
              {pillars.includes(id) && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ marginLeft: "auto", flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="10" fill="#f97316" />
                  <path
                    d="M7 12l4 4 6-6"
                    stroke="#0a0f1a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div style={actions}>
          <button
            onClick={() => setScreen(4)}
            style={pillars.length > 0 ? primaryBtn : disabledBtn}
            disabled={pillars.length === 0}
          >
            Next
          </button>
          <button onClick={() => setScreen(2)} style={backBtn}>
            Back
          </button>
        </div>
      </main>
    );
  }

  // ── Screen 4: Mood check-in ───────────────────────────────────────────────
  if (screen === 4) {
    return (
      <main style={container}>
        <ProgressBar step={4} total={5} />
        <p style={stepLabel}>Step 4 of 5</p>
        <h1 style={heading}>How are you showing up today?</h1>
        <p style={subhead}>Be real. No judgment here.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {MOODS.map(({ label, dot, bg, border }) => (
            <button
              key={label}
              onClick={() => setMood(label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                width: "100%",
                padding: "16px 20px",
                backgroundColor: mood === label ? bg : "#111827",
                border: `2px solid ${mood === label ? border : "#1f2937"}`,
                borderRadius: "10px",
                cursor: "pointer",
                transition:
                  "border-color 0.15s ease, background-color 0.15s ease",
                textAlign: "left",
                minHeight: "56px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: dot,
                  flexShrink: 0,
                  boxShadow: mood === label ? `0 0 8px ${dot}` : "none",
                  transition: "box-shadow 0.15s ease",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: mood === label ? "#f9fafb" : "#d1d5db",
                }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
        <div style={actions}>
          <button
            onClick={() => setScreen(5)}
            style={mood ? primaryBtn : disabledBtn}
            disabled={!mood}
          >
            Next
          </button>
          <button onClick={() => setScreen(3)} style={backBtn}>
            Back
          </button>
        </div>
      </main>
    );
  }

  // ── Screen 5: Done ────────────────────────────────────────────────────────
  const primaryPillar = pillars[0] ?? "Train";
  const tip = TIPS[primaryPillar];

  return (
    <main
      style={{
        ...container,
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "rgba(249,115,22,0.15)",
          border: "2px solid #f97316",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "28px",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12l5 5L20 7"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#f97316",
          marginBottom: "12px",
        }}
      >
        Step 5 of 5
      </p>

      <h1
        style={{
          fontFamily: "var(--font-oswald)",
          fontSize: "clamp(26px, 7vw, 36px)",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#f9fafb",
          lineHeight: 1.1,
          marginBottom: "16px",
        }}
      >
        Your first piece of groundwork is done.
      </h1>

      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "14px",
          color: "#9ca3af",
          lineHeight: 1.6,
          marginBottom: "28px",
          maxWidth: "320px",
        }}
      >
        Good to have you, {firstName.trim()}.
      </p>

      {/* Personalized tip */}
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          padding: "20px",
          backgroundColor: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.25)",
          borderRadius: "12px",
          marginBottom: "24px",
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#f97316",
            marginBottom: "8px",
          }}
        >
          Your first move — {primaryPillar}
        </p>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
            color: "#d1d5db",
            lineHeight: 1.6,
          }}
        >
          {tip}
        </p>
      </div>

      {/* Add to home screen hint */}
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          padding: "14px 16px",
          backgroundColor: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "32px",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <rect
            x="5"
            y="2"
            width="14"
            height="20"
            rx="2"
            stroke="#6b7280"
            strokeWidth="1.5"
          />
          <path
            d="M12 6v6m0 0l-2-2m2 2l2-2"
            stroke="#6b7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "12px",
            color: "#6b7280",
            lineHeight: 1.4,
          }}
        >
          Add to your home screen for quick access — tap{" "}
          <strong style={{ color: "#9ca3af" }}>Share → Add to Home Screen</strong>
        </span>
      </div>

      <button
        onClick={finish}
        disabled={saving}
        style={{
          width: "100%",
          maxWidth: "360px",
          padding: "18px 52px",
          backgroundColor: "#f97316",
          color: "#0a0f1a",
          fontFamily: "var(--font-inter)",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          borderRadius: "8px",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
          minHeight: "52px",
        }}
      >
        {saving ? "Setting up..." : "Let's Go"}
      </button>
    </main>
  );
}
