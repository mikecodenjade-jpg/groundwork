// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeSlug =
  | "day-one" | "week-strong" | "iron-month" | "unbreakable"
  | "first-blood" | "ten-down" | "fifty-strong" | "century-club"
  | "head-right" | "open-book" | "fuel-smart"
  | "mile-marker" | "10-miler" | "marathon-man"
  | "phase-1-complete" | "halfway-there" | "program-graduate"
  | "full-send" | "perfect-week"
  // Construction milestone streak badges
  | "foundation-laid" | "first-floor-up" | "framing-complete"
  | "under-roof" | "fit-out" | "cert-of-occupancy";

export type BadgeDef = {
  slug: BadgeSlug;
  title: string;
  description: string;
  category: string;
};

export type ActivityData = {
  workoutDates: string[];
  checkinDates: string[];
  journalDates: string[];
  mealDates: string[];
  runLogs: { distance_miles: number; created_at: string }[];
  enrollments: { program_slug: string; current_week: number; status: string }[];
};

// ─── Badge definitions ────────────────────────────────────────────────────────

export const BADGE_DEFS: BadgeDef[] = [
  // Consistency
  { slug: "day-one",          title: "Day One",            description: "Complete your first activity — workout, check-in, or journal.",   category: "Consistency" },
  { slug: "week-strong",      title: "Week Strong",         description: "Maintain a 7-day activity streak.",                               category: "Consistency" },
  { slug: "iron-month",       title: "Iron Month",          description: "Maintain a 30-day streak. Most people quit before this.",         category: "Consistency" },
  { slug: "unbreakable",      title: "Unbreakable",         description: "90 days straight. You're not the same person you were.",         category: "Consistency" },
  // Training
  { slug: "first-blood",      title: "First Blood",         description: "Complete your first workout. Day one is the hardest.",           category: "Training"    },
  { slug: "ten-down",         title: "Ten Down",            description: "Complete 10 workouts. The habit is forming.",                    category: "Training"    },
  { slug: "fifty-strong",     title: "Fifty Strong",        description: "Complete 50 workouts. This is who you are now.",                 category: "Training"    },
  { slug: "century-club",     title: "Century Club",        description: "Complete 100 workouts. Not many people get here.",               category: "Training"    },
  // Mind & Fuel
  { slug: "head-right",       title: "Head Right",          description: "Complete 10 mood check-ins. Know where you're at.",              category: "Mind & Fuel" },
  { slug: "open-book",        title: "Open Book",           description: "Write 10 journal entries. Leaders who reflect, lead better.",    category: "Mind & Fuel" },
  { slug: "fuel-smart",       title: "Fuel Smart",          description: "Log meals for 7 consecutive days. Fuel the machine.",            category: "Mind & Fuel" },
  // Running
  { slug: "mile-marker",      title: "Mile Marker",         description: "Complete your first run. The first step is always the hardest.", category: "Running"     },
  { slug: "10-miler",         title: "10 Miler",            description: "Run a total of 10 miles. The engine is built.",                 category: "Running"     },
  { slug: "marathon-man",     title: "Marathon Man",        description: "Run a total of 26.2 miles. Most people never get close.",       category: "Running"     },
  // Programs
  { slug: "phase-1-complete", title: "Phase 1 Complete",    description: "Finish weeks 1–4 of any program. Foundation laid.",             category: "Programs"    },
  { slug: "halfway-there",    title: "Halfway There",       description: "Reach week 8 of the 16-week program. Keep going.",              category: "Programs"    },
  { slug: "program-graduate", title: "Program Graduate",    description: "Complete an entire structured program. See it through.",        category: "Programs"    },
  // Elite
  { slug: "full-send",           title: "Full Send",                description: "Score 100/100 on your daily score — all 4 pillars in one day.", category: "Elite"       },
  { slug: "perfect-week",        title: "Perfect Week",             description: "Score 100 every day for 7 days straight. Pure discipline.",     category: "Elite"       },
  // Streak Milestones
  { slug: "foundation-laid",   title: "3 Day Streak",  description: "3 days straight. You showed up. Keep going.",             category: "Streak Milestones" },
  { slug: "first-floor-up",    title: "1 Week Strong", description: "7 days in a row. One week done. The habit is forming.",   category: "Streak Milestones" },
  { slug: "framing-complete",  title: "2 Weeks",       description: "14 days straight. Two weeks in. You're serious.",         category: "Streak Milestones" },
  { slug: "under-roof",        title: "30 Days",       description: "30 days of showing up. Most people quit before this.",    category: "Streak Milestones" },
  { slug: "fit-out",           title: "60 Days",       description: "60 days strong. Two months. This is who you are now.",    category: "Streak Milestones" },
  { slug: "cert-of-occupancy", title: "90 Days",       description: "90 days straight. Not many people get here. You did.",   category: "Streak Milestones" },
];

export const BADGE_CATEGORIES = ["Streak Milestones", "Consistency", "Training", "Mind & Fuel", "Running", "Programs", "Elite"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function maxConsecutiveDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = Array.from(new Set(dates.map(toDateKey))).sort();
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

// ─── Main computation ─────────────────────────────────────────────────────────

export function computeEarnedSlugs(data: ActivityData): BadgeSlug[] {
  const { workoutDates, checkinDates, journalDates, mealDates, runLogs, enrollments } = data;
  const earned: BadgeSlug[] = [];

  // Consistency
  const allActivityDates = [...workoutDates, ...checkinDates, ...journalDates];
  if (allActivityDates.length > 0)           earned.push("day-one");

  const maxStreak = maxConsecutiveDays(allActivityDates);
  if (maxStreak >= 7)                        earned.push("week-strong");
  if (maxStreak >= 30)                       earned.push("iron-month");
  if (maxStreak >= 90)                       earned.push("unbreakable");

  // Build Milestones (construction-themed streak badges)
  if (maxStreak >= 3)                        earned.push("foundation-laid");
  if (maxStreak >= 7)                        earned.push("first-floor-up");
  if (maxStreak >= 14)                       earned.push("framing-complete");
  if (maxStreak >= 30)                       earned.push("under-roof");
  if (maxStreak >= 60)                       earned.push("fit-out");
  if (maxStreak >= 90)                       earned.push("cert-of-occupancy");

  // Training
  if (workoutDates.length >= 1)             earned.push("first-blood");
  if (workoutDates.length >= 10)            earned.push("ten-down");
  if (workoutDates.length >= 50)            earned.push("fifty-strong");
  if (workoutDates.length >= 100)           earned.push("century-club");

  // Mind & Fuel
  if (checkinDates.length >= 10)            earned.push("head-right");
  if (journalDates.length >= 10)            earned.push("open-book");
  if (maxConsecutiveDays(mealDates) >= 7)   earned.push("fuel-smart");

  // Running
  const totalMiles = runLogs.reduce((s, r) => s + (r.distance_miles ?? 0), 0);
  if (runLogs.length >= 1)                  earned.push("mile-marker");
  if (totalMiles >= 10)                     earned.push("10-miler");
  if (totalMiles >= 26.2)                   earned.push("marathon-man");

  // Programs
  if (enrollments.some((e) => e.current_week >= 5))
    earned.push("phase-1-complete");
  if (enrollments.some((e) => e.program_slug === "16-week-foundation" && e.current_week >= 8))
    earned.push("halfway-there");
  if (enrollments.some((e) => e.status === "completed"))
    earned.push("program-graduate");

  // Elite — Full Send: any day with all 4 activities
  const wSet = new Set(workoutDates.map(toDateKey));
  const cSet = new Set(checkinDates.map(toDateKey));
  const jSet = new Set(journalDates.map(toDateKey));
  const mSet = new Set(mealDates.map(toDateKey));

  const fullDays: string[] = [];
  for (const d of wSet) {
    if (cSet.has(d) && jSet.has(d) && mSet.has(d)) fullDays.push(d);
  }

  if (fullDays.length > 0) {
    earned.push("full-send");

    // Perfect Week: 7 consecutive full-send days
    if (fullDays.length >= 7) {
      const sorted = fullDays.slice().sort();
      let streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diff = Math.round(
          (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000
        );
        if (diff === 1) {
          streak++;
          if (streak >= 7) { earned.push("perfect-week"); break; }
        } else {
          streak = 1;
        }
      }
    }
  }

  return earned;
}
