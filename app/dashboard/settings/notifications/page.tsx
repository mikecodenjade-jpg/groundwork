"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationPrefs = {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  hydration_reminder_time: string;
  meditation_reminder_time: string;
  workout_reminder_time: string;
  shift_start_time: string;
  shift_end_time: string;
};

const DEFAULT_PREFS: NotificationPrefs = {
  push_enabled: false,
  email_enabled: false,
  sms_enabled: false,
  hydration_reminder_time: "",
  meditation_reminder_time: "",
  workout_reminder_time: "",
  shift_start_time: "",
  shift_end_time: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setPrefs({
          push_enabled: data.push_enabled ?? false,
          email_enabled: data.email_enabled ?? false,
          sms_enabled: data.sms_enabled ?? false,
          hydration_reminder_time: data.hydration_reminder_time ?? "",
          meditation_reminder_time: data.meditation_reminder_time ?? "",
          workout_reminder_time: data.workout_reminder_time ?? "",
          shift_start_time: data.shift_start_time ?? "",
          shift_end_time: data.shift_end_time ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [router]);

  function updatePref<K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K]
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      ...prefs,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-28">
        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{
              border: "1px solid #252525",
              color: "#9A9A9A",
              borderRadius: "8px",
            }}
            aria-label="Back to settings"
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
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Settings
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{
                fontFamily: "var(--font-oswald)",
                color: "#E8E2D8",
              }}
            >
              Notifications
            </h1>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl"
                style={{ backgroundColor: "#161616" }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Notification Channels */}
            <section>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                style={{
                  color: "#C45B28",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Channels
              </p>
              <div
                className="flex flex-col"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <ToggleRow
                  icon={
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      width={16}
                      height={16}
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  }
                  label="Push Notifications"
                  enabled={prefs.push_enabled}
                  onToggle={(v) => updatePref("push_enabled", v)}
                />
                <div style={{ borderTop: "1px solid #252525" }} />
                <ToggleRow
                  icon={
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      width={16}
                      height={16}
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  }
                  label="Email Notifications"
                  enabled={prefs.email_enabled}
                  onToggle={(v) => updatePref("email_enabled", v)}
                />
                <div style={{ borderTop: "1px solid #252525" }} />
                <ToggleRow
                  icon={
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      width={16}
                      height={16}
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  }
                  label="SMS Notifications"
                  enabled={prefs.sms_enabled}
                  onToggle={(v) => updatePref("sms_enabled", v)}
                />
              </div>
            </section>

            {/* Reminder Times */}
            <section>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                style={{
                  color: "#C45B28",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Reminder Times
              </p>
              <div
                className="px-7 py-6 flex flex-col gap-5"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "12px",
                }}
              >
                <TimeInputRow
                  label="Hydration Reminder"
                  value={prefs.hydration_reminder_time}
                  onChange={(v) =>
                    updatePref("hydration_reminder_time", v)
                  }
                />
                <TimeInputRow
                  label="Meditation Reminder"
                  value={prefs.meditation_reminder_time}
                  onChange={(v) =>
                    updatePref("meditation_reminder_time", v)
                  }
                />
                <TimeInputRow
                  label="Workout Reminder"
                  value={prefs.workout_reminder_time}
                  onChange={(v) =>
                    updatePref("workout_reminder_time", v)
                  }
                />
              </div>
            </section>

            {/* Shift Schedule */}
            <section>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                style={{
                  color: "#C45B28",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Shift Schedule
              </p>
              <div
                className="px-7 py-6 grid grid-cols-2 gap-5"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "12px",
                }}
              >
                <TimeInputRow
                  label="Shift Start"
                  value={prefs.shift_start_time}
                  onChange={(v) => updatePref("shift_start_time", v)}
                />
                <TimeInputRow
                  label="Shift End"
                  value={prefs.shift_end_time}
                  onChange={(v) => updatePref("shift_end_time", v)}
                />
              </div>
            </section>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "#C45B28",
                color: "#0A0A0A",
                borderRadius: "12px",
                fontFamily: "var(--font-inter)",
                fontWeight: 700,
                minHeight: "56px",
              }}
            >
              {saving ? "Saving..." : saved ? "\u2713 Saved" : "Save Preferences"}
            </button>
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function ToggleRow({
  icon,
  label,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-7 py-5">
      <div className="flex items-center gap-3">
        <span style={{ color: "#9A9A9A" }}>{icon}</span>
        <span
          className="text-sm font-semibold"
          style={{
            color: "#E8E2D8",
            fontFamily: "var(--font-inter)",
          }}
        >
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className="relative shrink-0 transition-colors duration-200"
        style={{
          width: "44px",
          height: "24px",
          borderRadius: "12px",
          backgroundColor: enabled ? "#C45B28" : "#252525",
        }}
        aria-label={`Toggle ${label}`}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200"
          style={{
            backgroundColor: enabled ? "#0A0A0A" : "#9A9A9A",
            left: enabled ? "24px" : "4px",
          }}
        />
      </button>
    </div>
  );
}

// ─── Time Input Row ───────────────────────────────────────────────────────────

function TimeInputRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs uppercase tracking-widest"
        style={{
          color: "#9A9A9A",
          fontFamily: "var(--font-inter)",
        }}
      >
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
        style={{
          backgroundColor: "#161616",
          border: "1px solid #252525",
          color: "#E8E2D8",
          borderRadius: "8px",
          fontFamily: "var(--font-inter)",
        }}
      />
    </div>
  );
}
