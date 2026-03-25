import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StreakMilestone = {
  days: number;
  name: string;
  tagline: string;
  phase: string;
};

// ─── Construction milestones ──────────────────────────────────────────────────

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3,  name: "3 Day Streak",   tagline: "You showed up three days straight. Keep going.",      phase: "3-Day"  },
  { days: 7,  name: "1 Week Strong",  tagline: "One week in. The habit is forming.",                  phase: "7-Day"  },
  { days: 14, name: "2 Weeks",        tagline: "Two weeks in. You're serious about this.",            phase: "14-Day" },
  { days: 30, name: "30 Days",        tagline: "A full month. Most people quit before this.",         phase: "30-Day" },
  { days: 60, name: "60 Days",        tagline: "Two months. This is who you are now.",                phase: "60-Day" },
  { days: 90, name: "90 Days",        tagline: "90 days straight. Not many people get here.",         phase: "90-Day" },
];

// ─── Milestone helpers ────────────────────────────────────────────────────────

/** Highest milestone the user has reached (or null if below 3 days). */
export function getCurrentMilestone(streak: number): StreakMilestone | null {
  let result: StreakMilestone | null = null;
  for (const m of STREAK_MILESTONES) {
    if (streak >= m.days) result = m;
  }
  return result;
}

/** The next milestone the user is working toward (or null if at max). */
export function getNextMilestone(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m.days > streak) ?? null;
}

/** Days remaining until the next milestone. */
export function daysToNextMilestone(streak: number): number {
  const next = getNextMilestone(streak);
  return next ? next.days - streak : 0;
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

/**
 * Returns a 30-element boolean array where index 0 = 29 days ago and
 * index 29 = today. true means the user had at least one activity that day.
 */
export function get30DayGrid(activityDates: string[]): boolean[] {
  const dateSet = new Set(
    activityDates.map((d) => new Date(d).toLocaleDateString("en-CA"))
  );
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return dateSet.has(d.toLocaleDateString("en-CA"));
  });
}

// ─── Streak calculation ───────────────────────────────────────────────────────

/** Current consecutive-day streak from today or yesterday. */
export function calcCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = Array.from(
    new Set(dates.map((d) => new Date(d).toLocaleDateString("en-CA")))
  ).sort((a, b) => (a > b ? -1 : 1));

  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const diff = Math.round(
      (new Date(unique[i - 1]).getTime() - new Date(unique[i]).getTime()) / 86400000
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

/** Maximum consecutive-day streak across all history. */
export function calcMaxStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = Array.from(
    new Set(dates.map((d) => new Date(d).toLocaleDateString("en-CA")))
  ).sort();
  let max = 1;
  let cur = 1;
  for (let i = 1; i < unique.length; i++) {
    const diff = Math.round(
      (new Date(unique[i]).getTime() - new Date(unique[i - 1]).getTime()) / 86400000
    );
    if (diff === 1) {
      cur++;
      if (cur > max) max = cur;
    } else {
      cur = 1;
    }
  }
  return max;
}

// ─── Returning-after-break detection ─────────────────────────────────────────

/**
 * Returns true if the user has activity today but their most-recent prior
 * activity was more than 1 day ago (i.e. they missed at least one day).
 * Used to show "Welcome back" instead of punishing them for the gap.
 */
export function isReturningAfterBreak(dates: string[]): boolean {
  if (dates.length === 0) return false;
  const unique = Array.from(
    new Set(dates.map((d) => new Date(d).toLocaleDateString("en-CA")))
  ).sort((a, b) => (a > b ? -1 : 1));

  const today = new Date().toLocaleDateString("en-CA");
  if (unique[0] !== today) return false;  // no activity today
  if (unique.length < 2) return false;    // first activity ever

  const diff = Math.round(
    (new Date(today).getTime() - new Date(unique[1]).getTime()) / 86400000
  );
  return diff > 1;
}

// ─── Any-activity streak updater ──────────────────────────────────────────────

/**
 * Queries all engagement tables, recalculates the streak, writes it to
 * user_streaks, and returns whether the user is returning after a break.
 * Call this after any activity is logged (check-in, workout, meal, journal).
 */
export async function updateActivityStreak(
  userId: string
): Promise<{ isReturning: boolean }> {
  const cutoff = new Date(Date.now() - 95 * 86400000).toISOString();

  const [checkins, workouts, journals, meals] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", cutoff),
    supabase
      .from("workout_logs")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", cutoff),
    supabase
      .from("journal_entries")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", cutoff),
    supabase
      .from("meal_logs")
      .select("logged_at")
      .eq("user_id", userId)
      .gte("logged_at", cutoff),
  ]);

  const allDates = [
    ...(checkins.data ?? []).map((r) => r.created_at),
    ...(workouts.data ?? []).map((r) => r.created_at),
    ...(journals.data ?? []).map((r) => r.created_at),
    ...(meals.data ?? []).map((r) => r.logged_at),
  ];

  const current = calcCurrentStreak(allDates);
  const longest = calcMaxStreak(allDates);
  const returning = isReturningAfterBreak(allDates);
  const today = new Date().toLocaleDateString("en-CA");

  await supabase.from("user_streaks").upsert(
    {
      user_id: userId,
      current_streak: current,
      longest_streak: longest,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return { isReturning: returning };
}
