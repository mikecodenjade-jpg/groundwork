"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 1 | 2 | 3 | 4 | 5;

// ─── Option Button ────────────────────────────────────────────────────────────

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
        padding: "18px 20px",
        backgroundColor: selected ? "rgba(249,115,22,0.12)" : "#111827",
        border: `2px solid ${selected ? "#f97316" : "#1f2937"}`,
        borderRadius: "10px",
        cursor: "pointer",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        gap: "4px",
        textAlign: "left",
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        marginBottom: "40px",
      }}
    >
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [role, setRole] = useState("");
  const [timePreference, setTimePreference] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [equipment, setEquipment] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      }
    });
  }, [router]);

  function toggleGoal(goal: string) {
    setGoals((prev) => {
      if (prev.includes(goal)) return prev.filter((g) => g !== goal);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, goal];
    });
  }

  async function finish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_profiles").upsert({
        id: user.id,
        role,
        time_preference: timePreference,
        priority_goals: goals,
        equipment_level: equipment,
        onboarding_completed: true,
      });
    }
    router.replace("/dashboard");
  }

  const containerStyle: React.CSSProperties = {
    backgroundColor: "#0a0f1a",
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    padding: "32px 24px 40px",
    maxWidth: "480px",
    margin: "0 auto",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "#f97316",
    marginBottom: "10px",
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: "var(--font-oswald)",
    fontSize: "clamp(30px, 7vw, 40px)",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#f9fafb",
    lineHeight: 1.05,
    marginBottom: "10px",
  };

  const subheadStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter)",
    fontSize: "14px",
    color: "#9ca3af",
    lineHeight: 1.55,
    marginBottom: "32px",
  };

  const nextBtnStyle: React.CSSProperties = {
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
    opacity: 0.35,
    cursor: "not-allowed",
  };

  // ── Screen 1: Role ─────────────────────────────────────────────────────────
  if (screen === 1) {
    const roles = [
      { label: "Superintendent" },
      { label: "Foreman / Field Lead" },
      { label: "Project Manager" },
      { label: "Other" },
    ];
    return (
      <main style={containerStyle}>
        <ProgressBar step={1} total={5} />
        <p style={labelStyle}>Step 1 of 5</p>
        <h1 style={headingStyle}>What&apos;s your role?</h1>
        <p style={subheadStyle}>So we know how to talk to you.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {roles.map(({ label }) => (
            <OptionBtn
              key={label}
              label={label}
              selected={role === label}
              onClick={() => setRole(label)}
            />
          ))}
        </div>
        <div style={nextBtnStyle}>
          <button
            onClick={() => setScreen(2)}
            style={role ? primaryBtn : disabledBtn}
            disabled={!role}
          >
            Next
          </button>
        </div>
      </main>
    );
  }

  // ── Screen 2: Time ─────────────────────────────────────────────────────────
  if (screen === 2) {
    const timeOptions = [
      { label: "15 min", sublabel: "I'm slammed" },
      { label: "30 min", sublabel: "I can make it work" },
      { label: "45 min", sublabel: "I'm committed" },
      { label: "60 min", sublabel: "Let's go" },
    ];
    return (
      <main style={containerStyle}>
        <ProgressBar step={2} total={5} />
        <p style={labelStyle}>Step 2 of 5</p>
        <h1 style={headingStyle}>How much time do you actually have?</h1>
        <p style={subheadStyle}>Be honest. We&apos;ll build your day around it.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {timeOptions.map(({ label, sublabel }) => (
            <OptionBtn
              key={label}
              label={label}
              sublabel={sublabel}
              selected={timePreference === label}
              onClick={() => setTimePreference(label)}
            />
          ))}
        </div>
        <div style={nextBtnStyle}>
          <button
            onClick={() => setScreen(3)}
            style={timePreference ? primaryBtn : disabledBtn}
            disabled={!timePreference}
          >
            Next
          </button>
          <button
            onClick={() => setScreen(1)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-inter)",
              fontSize: "12px",
              color: "#4b5563",
              textAlign: "center",
              padding: "8px",
            }}
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  // ── Screen 3: Goals ────────────────────────────────────────────────────────
  if (screen === 3) {
    const goalOptions = [
      "Get stronger",
      "Lose weight",
      "Sleep better",
      "Handle stress",
      "Be a better leader",
      "Show up better at home",
    ];
    return (
      <main style={containerStyle}>
        <ProgressBar step={3} total={5} />
        <p style={labelStyle}>Step 3 of 5</p>
        <h1 style={headingStyle}>What do you need right now?</h1>
        <p style={subheadStyle}>Pick what matters. Skip what doesn&apos;t. (Pick 1–3)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {goalOptions.map((goal) => (
            <OptionBtn
              key={goal}
              label={goal}
              selected={goals.includes(goal)}
              onClick={() => toggleGoal(goal)}
            />
          ))}
        </div>
        {goals.length >= 3 && (
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "12px",
              color: "#f97316",
              marginTop: "12px",
            }}
          >
            Max 3 selected
          </p>
        )}
        <div style={nextBtnStyle}>
          <button
            onClick={() => setScreen(4)}
            style={goals.length > 0 ? primaryBtn : disabledBtn}
            disabled={goals.length === 0}
          >
            Next
          </button>
          <button
            onClick={() => setScreen(2)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-inter)",
              fontSize: "12px",
              color: "#4b5563",
              textAlign: "center",
              padding: "8px",
            }}
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  // ── Screen 4: Equipment ────────────────────────────────────────────────────
  if (screen === 4) {
    const equipmentOptions = [
      { label: "Full gym", sublabel: "Access to commercial equipment" },
      { label: "Dumbbells at home", sublabel: "Home setup with weights" },
      { label: "Hotel room", sublabel: "Traveling — limited space" },
      { label: "Nothing but my body", sublabel: "Bodyweight only" },
    ];
    return (
      <main style={containerStyle}>
        <ProgressBar step={4} total={5} />
        <p style={labelStyle}>Step 4 of 5</p>
        <h1 style={headingStyle}>What equipment do you have?</h1>
        <p style={subheadStyle}>We&apos;ll program around it.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {equipmentOptions.map(({ label, sublabel }) => (
            <OptionBtn
              key={label}
              label={label}
              sublabel={sublabel}
              selected={equipment === label}
              onClick={() => setEquipment(label)}
            />
          ))}
        </div>
        <div style={nextBtnStyle}>
          <button
            onClick={() => setScreen(5)}
            style={equipment ? primaryBtn : disabledBtn}
            disabled={!equipment}
          >
            Next
          </button>
          <button
            onClick={() => setScreen(3)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-inter)",
              fontSize: "12px",
              color: "#4b5563",
              textAlign: "center",
              padding: "8px",
            }}
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  // ── Screen 5: Launch ───────────────────────────────────────────────────────
  return (
    <main
      style={{
        ...containerStyle,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        minHeight: "100dvh",
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
          marginBottom: "32px",
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

      <h1
        style={{
          fontFamily: "var(--font-oswald)",
          fontSize: "clamp(52px, 14vw, 80px)",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#f9fafb",
          lineHeight: 1,
          marginBottom: "20px",
        }}
      >
        Day 1.
      </h1>

      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "16px",
          color: "#9ca3af",
          lineHeight: 1.6,
          marginBottom: "48px",
          maxWidth: "320px",
        }}
      >
        Your plan is set.<br />Show up and we&apos;ll handle the rest.
      </p>

      <button
        onClick={finish}
        disabled={saving}
        style={{
          padding: "18px 52px",
          backgroundColor: "#f97316",
          color: "#0a0f1a",
          fontFamily: "var(--font-inter)",
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          borderRadius: "8px",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
          minHeight: "56px",
          minWidth: "200px",
        }}
      >
        {saving ? "Setting up..." : "Let's Go"}
      </button>
    </main>
  );
}
