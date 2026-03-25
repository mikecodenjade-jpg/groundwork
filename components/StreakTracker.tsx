"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  STREAK_MILESTONES,
  isReturningAfterBreak,
} from "@/lib/streaks";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const unique = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");

  let current = 0;
  if (unique[0] === today || unique[0] === yesterday) {
    current = 1;
    for (let i = 1; i < unique.length; i++) {
      const diff = Math.round(
        (new Date(unique[i - 1]).getTime() - new Date(unique[i]).getTime()) / 86400000
      );
      if (diff === 1) current++;
      else break;
    }
  }

  let longest = current;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const diff = Math.round(
      (new Date(unique[i - 1]).getTime() - new Date(unique[i]).getTime()) / 86400000
    );
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  return { current, longest };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function StreakTracker() {
  const [current, setCurrent] = useState(0);
  const [longest, setLongest] = useState(0);
  const [checkedDays, setCheckedDays] = useState<Set<string>>(new Set());
  const [returning, setReturning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const cutoff = new Date(Date.now() - 95 * 86400000).toISOString();

      const [checkins, workouts, journals, meals] = await Promise.all([
        supabase
          .from("daily_checkins")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", cutoff),
        supabase
          .from("workout_logs")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", cutoff),
        supabase
          .from("journal_entries")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", cutoff),
        supabase
          .from("meal_logs")
          .select("logged_at")
          .eq("user_id", user.id)
          .gte("logged_at", cutoff),
      ]);

      const allTimestamps = [
        ...(checkins.data ?? []).map((r) => r.created_at),
        ...(workouts.data ?? []).map((r) => r.created_at),
        ...(journals.data ?? []).map((r) => r.created_at),
        ...(meals.data ?? []).map((r) => r.logged_at),
      ];

      const dateDates = allTimestamps.map((ts) =>
        new Date(ts).toLocaleDateString("en-CA")
      );

      const { current: c, longest: l } = calcStreak(dateDates);
      setCurrent(c);
      setLongest(l);
      setCheckedDays(new Set(dateDates));
      setReturning(isReturningAfterBreak(allTimestamps));
      setLoading(false);
    }
    load();
  }, []);

  // Last 30 calendar days (oldest → newest)
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString("en-CA");
  });

  const today = new Date().toLocaleDateString("en-CA");
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > current) ?? null;

  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: "1px solid #252525",
        borderRadius: 12,
        padding: "20px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 10,
            fontWeight: 600,
            color: "#C45B28",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
          }}
        >
          Activity Streak
        </p>
        <Link
          href="/dashboard/mind/trends"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            color: "#9A9A9A",
            textDecoration: "none",
          }}
        >
          View trends →
        </Link>
      </div>

      {/* Welcome back banner */}
      {!loading && returning && (
        <div
          style={{
            backgroundColor: "#0D1A0D",
            border: "1px solid #1A3A1A",
            borderRadius: 8,
            padding: "12px 14px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              color: "#6BBF6B",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Welcome back. No pressure. Just glad you are here.
          </p>
        </div>
      )}

      {/* Streak count + next milestone */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!loading && current > 0 && (
            <span style={{ fontSize: 28, lineHeight: 1 }} role="img" aria-label="fire">
              🔥
            </span>
          )}
          <div>
            <p
              style={{
                fontFamily: "var(--font-oswald)",
                fontSize: 52,
                fontWeight: 700,
                color: "#f97316",
                lineHeight: 1,
                margin: 0,
              }}
            >
              {loading ? "–" : current}
            </p>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 10,
                color: "#9A9A9A",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginTop: 2,
              }}
            >
              {current === 1 ? "day straight" : "days straight"}
            </p>
          </div>
        </div>

        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {longest > 0 && (
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  color: "#9A9A9A",
                }}
              >
                Best:{" "}
                <span style={{ color: "#E8E2D8", fontWeight: 600 }}>{longest}d</span>
              </p>
            )}
            {nextMilestone && current > 0 && (
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  color: "#9A9A9A",
                }}
              >
                Next:{" "}
                <span style={{ color: "#f97316", fontWeight: 600 }}>
                  {nextMilestone.days - current}d to {nextMilestone.name}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Milestone badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STREAK_MILESTONES.map((m) => {
          const earned = longest >= m.days;
          const active = current >= m.days;
          return (
            <div
              key={m.days}
              title={m.tagline}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 20,
                border: `1px solid ${active ? "#f97316" : earned ? "#3A2010" : "#1A1A1A"}`,
                backgroundColor: active ? "#1A0A00" : "transparent",
                opacity: loading ? 0.4 : 1,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 10,
                  fontWeight: 600,
                  color: active ? "#f97316" : earned ? "#5A3020" : "#2A2A2A",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {m.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* 30-day dot calendar */}
      <div>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 9,
            color: "#3A3A3A",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: 10,
          }}
        >
          Last 30 Days
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: 5,
          }}
        >
          {last30.map((dateStr, i) => {
            const done = !loading && checkedDays.has(dateStr);
            const isToday = dateStr === today;
            return (
              <div
                key={i}
                title={dateStr}
                style={{
                  aspectRatio: "1",
                  borderRadius: 4,
                  backgroundColor: done ? "#f97316" : "#1A1A1A",
                  border: isToday
                    ? `2px solid ${done ? "#f97316" : "#3A3A3A"}`
                    : "2px solid transparent",
                  opacity: loading ? 0.3 : done ? 1 : 0.5,
                  transition: "all 0.2s ease",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Empty state nudge */}
      {!loading && current === 0 && !returning && (
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 12,
            color: "#9A9A9A",
            textAlign: "center",
            padding: "0 8px",
          }}
        >
          No streak yet. Any activity today starts one.
        </p>
      )}
    </div>
  );
}
