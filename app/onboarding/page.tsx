"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Constants ──────────────────────────────────────────────────────────────

const ROLES = [
  "Superintendent",
  "Foreman",
  "Laborer",
  "Operator",
  "Project Manager",
  "Project Engineer",
  "Safety Officer",
  "Other",
];

const GOAL_OPTIONS = [
  "Get Stronger",
  "Manage Stress",
  "Sleep Better",
  "Eat Better",
  "Lead My Crew",
  "Build Consistency",
];

const WEARABLE_DEVICES = [
  {
    name: "Fitbit",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={32} height={32}>
        <rect x="6" y="2" width="12" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="6" width="6" height="4" rx="1" fill="currentColor" opacity={0.3} />
        <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="9" y1="15.5" x2="13" y2="15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Garmin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={32} height={32}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1" opacity={0.4} />
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Google Fit",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={32} height={32}>
        <path d="M12 4L8 8l4 4-4 4 4 4 4-4-4-4 4-4-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2" fill="currentColor" opacity={0.3} />
      </svg>
    ),
  },
];

// ─── Value Prop Icons ───────────────────────────────────────────────────────

function StrengthIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={28} height={28}>
      <rect x="1" y="9" width="4" height="6" rx="0.5" stroke="#C45B28" strokeWidth="1.5" />
      <rect x="5" y="10" width="2" height="4" rx="0.25" fill="#C45B28" />
      <rect x="7" y="11" width="10" height="2" fill="#C45B28" />
      <rect x="17" y="10" width="2" height="4" rx="0.25" fill="#C45B28" />
      <rect x="19" y="9" width="4" height="6" rx="0.5" stroke="#C45B28" strokeWidth="1.5" />
    </svg>
  );
}

function ClarityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={28} height={28}>
      <path
        d="M12 4C8.5 4 6 6.5 6 10C6 12 7 13.5 8.5 14.5V17H15.5V14.5C17 13.5 18 12 18 10C18 6.5 15.5 4 12 4Z"
        stroke="#C45B28" strokeWidth="1.5" strokeLinejoin="round"
      />
      <line x1="9" y1="19" x2="15" y2="19" stroke="#C45B28" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="21" x2="14" y2="21" stroke="#C45B28" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CrewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={28} height={28}>
      <circle cx="8" cy="8" r="3" stroke="#C45B28" strokeWidth="1.5" />
      <circle cx="16" cy="8" r="3" stroke="#C45B28" strokeWidth="1.5" />
      <path d="M2 20C2 16 5 14 8 14C9.5 14 10.8 14.5 12 15.3C13.2 14.5 14.5 14 16 14C19 14 22 16 22 20" stroke="#C45B28" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Checkmark SVG ──────────────────────────────────────────────────────────

function CheckmarkSVG({ size = 64 }: { size?: number }) {
  return (
    <div className="success-checkmark">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" stroke="#C45B28" strokeWidth="3" />
        <polyline
          points="20,34 28,42 44,24"
          stroke="#C45B28"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const inputStyle = {
  backgroundColor: "#161616",
  border: "1px solid #252525",
  borderRadius: "8px",
  color: "#E8E2D8",
  fontFamily: "var(--font-inter)",
};

const primaryBtnStyle = {
  backgroundColor: "#C45B28",
  color: "#0A0A0A",
  borderRadius: "8px",
  fontFamily: "var(--font-inter)",
  fontWeight: 600 as const,
};

const cardStyle = {
  backgroundColor: "#161616",
  border: "1px solid #252525",
  borderRadius: "12px",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Profile
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Step 3: Wearable
  const [wearableMsg, setWearableMsg] = useState<string | null>(null);

  // Step 4: Notifications
  const [shiftStart, setShiftStart] = useState("06:00");
  const [endOfDay, setEndOfDay] = useState(true);
  const [weeklyCheckin, setWeeklyCheckin] = useState(true);

  // Step 5: Quick Win
  const [quickWinDone, setQuickWinDone] = useState(false);
  const [hydrationLogged, setHydrationLogged] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  async function saveProfile() {
    setError(null);
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setSaving(false);
      return false;
    }

    const { error: dbError } = await supabase.from("user_profiles").upsert({
      id: user.id,
      full_name: fullName.trim(),
      role,
      wellness_goals: selectedGoals,
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return false;
    }

    setSaving(false);
    return true;
  }

  async function saveNotifications() {
    setError(null);
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setSaving(false);
      return false;
    }

    const { error: dbError } = await supabase.from("user_profiles").upsert({
      id: user.id,
      notification_prefs: {
        shift_start: shiftStart,
        end_of_day: endOfDay,
        weekly_checkin: weeklyCheckin,
      },
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return false;
    }

    setSaving(false);
    return true;
  }

  async function completeOnboarding() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_profiles").upsert({
      id: user.id,
      onboarding_completed: true,
    });
  }

  async function logHydration() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("hydration_logs").insert({
      user_id: user.id,
      amount_ml: 237, // ~8 oz glass
    });

    setHydrationLogged(true);
    handleQuickWinComplete();
  }

  function handleQuickWinComplete() {
    setQuickWinDone(true);
    completeOnboarding();
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  }

  function goNext() {
    setError(null);
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  // ── Progress Bar ────────────────────────────────────────────────────────

  const progressPct = (step / 5) * 100;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-8"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      {/* Progress bar */}
      <div
        className="w-full max-w-md mx-auto mb-8"
        style={{ height: 4, backgroundColor: "#252525", borderRadius: 2, overflow: "hidden" }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            backgroundColor: "#C45B28",
            borderRadius: 2,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            style={{
              width: s === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: s <= step ? "#C45B28" : "#252525",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">

        {/* ─── Step 1: Welcome ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-fade-up">
            <p
              className="text-2xl font-bold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
            >
              GROUNDWORK
            </p>

            <h1
              className="text-3xl sm:text-4xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Built for the People Who Build Everything.
            </h1>

            <p
              className="text-sm max-w-sm"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Whole-person wellness for construction crews. Not corporate fluff — real tools for real work.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
              <div className="flex items-center gap-4">
                <div style={{ flexShrink: 0 }}><StrengthIcon /></div>
                <p className="text-sm text-left" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Physical strength for the long haul
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div style={{ flexShrink: 0 }}><ClarityIcon /></div>
                <p className="text-sm text-left" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Mental clarity under pressure
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div style={{ flexShrink: 0 }}><CrewIcon /></div>
                <p className="text-sm text-left" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Crew culture that sticks
                </p>
              </div>
            </div>

            <button
              onClick={goNext}
              className="w-full mt-6 py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 press-scale animate-fade-up stagger-2"
              style={primaryBtnStyle}
            >
              Let&apos;s Get Started &rarr;
            </button>
          </div>
        )}

        {/* ─── Step 2: Profile ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col gap-6" style={{ animation: "slideInRight 0.3s ease-out" }}>
            <div>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Step 2 of 5
              </p>
              <h2
                className="text-3xl font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Your Profile
              </h2>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fullName"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Mike Johnson"
                className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                style={inputStyle}
              />
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="role"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Role
              </label>
              <select
                id="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28] appearance-none"
                style={{ ...inputStyle, color: role ? "#E8E2D8" : "#9A9A9A" }}
              >
                <option value="" disabled>Select your role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r} style={{ backgroundColor: "#161616", color: "#E8E2D8" }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Goals multi-select pills */}
            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Goals
              </label>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((goal) => {
                  const active = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className="px-4 py-2.5 text-sm font-semibold transition-all duration-150 press-scale"
                      style={{
                        backgroundColor: active ? "#C45B28" : "#161616",
                        color: active ? "#0A0A0A" : "#9A9A9A",
                        border: `1px solid ${active ? "#C45B28" : "#252525"}`,
                        borderRadius: "20px",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p
                className="text-sm px-4 py-3 border-l-4"
                style={{ borderColor: "#C45B28", backgroundColor: "#1A0E09", color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
              >
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-auto pt-4">
              <button
                onClick={goBack}
                className="px-6 py-4 text-sm font-semibold uppercase tracking-widest transition-opacity hover:opacity-70 press-scale"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", border: "1px solid #252525", borderRadius: "8px", backgroundColor: "transparent" }}
              >
                Back
              </button>
              <button
                onClick={async () => {
                  if (!fullName.trim() || !role) {
                    setError("Please fill in your name and role.");
                    return;
                  }
                  const ok = await saveProfile();
                  if (ok) goNext();
                }}
                disabled={saving}
                className="flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 press-scale"
                style={primaryBtnStyle}
              >
                {saving ? "Saving..." : "Next: Connect a Device \u2192"}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Wearable ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col gap-6" style={{ animation: "slideInRight 0.3s ease-out" }}>
            <div>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Step 3 of 5
              </p>
              <h2
                className="text-3xl font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Connect Your Gear
              </h2>
              <p className="text-sm mt-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Track your stats automatically. Skip this — you can add it later.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {WEARABLE_DEVICES.map((device) => (
                <button
                  key={device.name}
                  onClick={() => setWearableMsg(`Coming soon \u2014 we're working on ${device.name} integration!`)}
                  className="flex items-center gap-4 px-5 py-4 transition-all duration-150 card-hover press-scale"
                  style={{
                    ...cardStyle,
                    color: "#E8E2D8",
                    textAlign: "left" as const,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ color: "#C45B28", flexShrink: 0 }}>
                    {device.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-inter)" }}>
                      {device.name}
                    </span>
                    <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      Tap to connect
                    </span>
                  </div>
                  <svg viewBox="0 0 20 20" fill="none" width={16} height={16} className="ml-auto" style={{ color: "#9A9A9A" }}>
                    <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>

            {wearableMsg && (
              <div
                className="px-4 py-3 text-sm animate-scale-in"
                style={{ backgroundColor: "#0D1B2A", border: "1px solid #1E3A5F", borderRadius: "8px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                {wearableMsg}
              </div>
            )}

            <div className="flex flex-col gap-3 mt-auto pt-4">
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="px-6 py-4 text-sm font-semibold uppercase tracking-widest transition-opacity hover:opacity-70 press-scale"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", border: "1px solid #252525", borderRadius: "8px", backgroundColor: "transparent" }}
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 press-scale"
                  style={primaryBtnStyle}
                >
                  Continue &rarr;
                </button>
              </div>
              <button
                onClick={goNext}
                className="text-xs font-semibold uppercase tracking-widest text-center transition-opacity hover:opacity-70 py-2"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", background: "none", border: "none" }}
              >
                Skip for Now &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Notifications ────────────────────────────────────── */}
        {step === 4 && (
          <div className="flex-1 flex flex-col gap-6" style={{ animation: "slideInRight 0.3s ease-out" }}>
            <div>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Step 4 of 5
              </p>
              <h2
                className="text-3xl font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Set Your Reminders
              </h2>
            </div>

            {/* Shift start time */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="shiftStart"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Shift Start Time
              </label>
              <input
                id="shiftStart"
                type="time"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                style={inputStyle}
              />
            </div>

            {/* End of day toggle */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={cardStyle}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  End of Day Reminder
                </span>
                <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  A nudge to log your day before you clock out
                </span>
              </div>
              <button
                onClick={() => setEndOfDay(!endOfDay)}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: endOfDay ? "#C45B28" : "#252525",
                  transition: "background-color 0.2s ease",
                  position: "relative",
                  flexShrink: 0,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "#E8E2D8",
                    position: "absolute",
                    top: 3,
                    left: endOfDay ? 23 : 3,
                    transition: "left 0.2s ease",
                  }}
                />
              </button>
            </div>

            {/* Weekly check-in toggle */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={cardStyle}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Weekly Check-in
                </span>
                <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Quick weekly reflection to track your progress
                </span>
              </div>
              <button
                onClick={() => setWeeklyCheckin(!weeklyCheckin)}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: weeklyCheckin ? "#C45B28" : "#252525",
                  transition: "background-color 0.2s ease",
                  position: "relative",
                  flexShrink: 0,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "#E8E2D8",
                    position: "absolute",
                    top: 3,
                    left: weeklyCheckin ? 23 : 3,
                    transition: "left 0.2s ease",
                  }}
                />
              </button>
            </div>

            {error && (
              <p
                className="text-sm px-4 py-3 border-l-4"
                style={{ borderColor: "#C45B28", backgroundColor: "#1A0E09", color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
              >
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-auto pt-4">
              <button
                onClick={goBack}
                className="px-6 py-4 text-sm font-semibold uppercase tracking-widest transition-opacity hover:opacity-70 press-scale"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", border: "1px solid #252525", borderRadius: "8px", backgroundColor: "transparent" }}
              >
                Back
              </button>
              <button
                onClick={async () => {
                  const ok = await saveNotifications();
                  if (ok) goNext();
                }}
                disabled={saving}
                className="flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 press-scale"
                style={primaryBtnStyle}
              >
                {saving ? "Saving..." : "Next \u2192"}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 5: Quick Win ─────────────────────────────────────────── */}
        {step === 5 && (
          <div className="flex-1 flex flex-col gap-6" style={{ animation: "slideInRight 0.3s ease-out" }}>
            {!quickWinDone ? (
              <>
                <div>
                  <p
                    className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
                    style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                  >
                    Step 5 of 5
                  </p>
                  <h2
                    className="text-3xl font-bold uppercase"
                    style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                  >
                    Your First Move
                  </h2>
                  <p className="text-sm mt-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    Do one thing right now to start your streak.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Log Your Mood - most prominent */}
                  <Link
                    href="/dashboard/mind"
                    onClick={() => {
                      completeOnboarding();
                    }}
                    className="flex items-center gap-4 px-5 py-5 transition-all duration-150 press-scale"
                    style={{
                      backgroundColor: "#C45B28",
                      borderRadius: "12px",
                      color: "#0A0A0A",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width={28} height={28} style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-base font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-inter)" }}>
                        Log Your Mood
                      </span>
                      <span className="text-xs opacity-80" style={{ fontFamily: "var(--font-inter)" }}>
                        Quick check-in to start your journey
                      </span>
                    </div>
                    <svg viewBox="0 0 20 20" fill="none" width={16} height={16} className="ml-auto">
                      <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>

                  {/* Drink a Glass of Water */}
                  <button
                    onClick={() => {
                      if (!hydrationLogged) logHydration();
                    }}
                    disabled={hydrationLogged}
                    className="flex items-center gap-4 px-5 py-5 transition-all duration-150 press-scale text-left"
                    style={{
                      ...cardStyle,
                      color: "#E8E2D8",
                      cursor: hydrationLogged ? "default" : "pointer",
                      opacity: hydrationLogged ? 0.7 : 1,
                    }}
                  >
                    {hydrationLogged ? (
                      <svg viewBox="0 0 24 24" fill="none" width={28} height={28} style={{ flexShrink: 0, color: "#C45B28" }}>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                        <polyline points="8,12 11,15 16,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" width={28} height={28} style={{ flexShrink: 0, color: "#C45B28" }}>
                        <path d="M12 3C12 3 6 10 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 10 12 3 12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M9 14C9 15.7 10.3 17 12 17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold" style={{ fontFamily: "var(--font-inter)" }}>
                        {hydrationLogged ? "Water Logged!" : "Drink a Glass of Water"}
                      </span>
                      <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                        {hydrationLogged ? "Great start to your day" : "Hydrate and build the habit"}
                      </span>
                    </div>
                  </button>

                  {/* Box Breathing */}
                  <Link
                    href="/dashboard/mind?tool=box-breathing"
                    onClick={() => {
                      completeOnboarding();
                    }}
                    className="flex items-center gap-4 px-5 py-5 transition-all duration-150 press-scale"
                    style={{
                      ...cardStyle,
                      color: "#E8E2D8",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width={28} height={28} style={{ flexShrink: 0, color: "#C45B28" }}>
                      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4 12H8M16 12H20M12 4V8M12 16V20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold" style={{ fontFamily: "var(--font-inter)" }}>
                        Try 2-Min Box Breathing
                      </span>
                      <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                        A quick reset for your mind
                      </span>
                    </div>
                    <svg viewBox="0 0 20 20" fill="none" width={16} height={16} className="ml-auto" style={{ color: "#9A9A9A" }}>
                      <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>

                <button
                  onClick={() => {
                    handleQuickWinComplete();
                  }}
                  className="text-xs font-semibold uppercase tracking-widest text-center transition-opacity hover:opacity-70 py-2 mt-auto"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Go to Dashboard &rarr;
                </button>
              </>
            ) : (
              /* ── Success State ─────────────────────────────────────────── */
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-scale-in">
                <CheckmarkSVG size={80} />
                <h2
                  className="text-3xl font-bold uppercase"
                  style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                >
                  You&apos;re all set.
                </h2>
                <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Welcome to the crew.
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="mt-4 px-8 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 press-scale"
                  style={primaryBtnStyle}
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
