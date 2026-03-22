// ─── Body-part → exercise keyword mapping ────────────────────────────────────
// If an exercise name or muscle string contains any of these keywords,
// it's associated with that body part.

const BODY_PART_KEYWORDS: Record<string, string[]> = {
  chest: [
    "bench press", "chest fly", "cable fly", "dumbbell bench", "incline bench",
    "decline bench", "pushup", "push-up", "push up", "dip", "chest", "pec",
  ],
  shoulders: [
    "overhead press", "shoulder press", "military press", "lateral raise",
    "front raise", "face pull", "shoulders", "deltoid", "delt",
  ],
  back: [
    "row", "deadlift", "pull-up", "pullup", "pull up", "lat pulldown",
    "back", "lats", "traps",
  ],
  knees: [
    "squat", "lunge", "leg press", "leg extension", "leg curl",
    "quads", "quadricep", "hamstring",
  ],
  wrists: [
    "curl", "pushup", "push-up", "push up", "wrist",
  ],
  elbows: [
    "tricep extension", "skull crusher", "tricep pushdown",
    "curl", "tricep", "bicep", "elbow",
  ],
  ankles: [
    "running", "run", "jump", "calf raise", "calf", "ankle",
    "jog", "sprint", "hill repeat", "stride interval",
  ],
  neck: [
    "shrug", "neck", "trap",
  ],
  hips: [
    "squat", "deadlift", "hip thrust", "hip", "glute", "lunge",
  ],
};

export type Injury = {
  id: string;
  body_part: string;
  pain_level: number;
  injury_type: string;
  avoid_or_modify: "avoid" | "modify";
  created_at: string;
  resolved_at: string | null;
};

/**
 * Check if an exercise (by name + muscle string) is affected by an injury.
 * Returns "avoid" | "modify" | null.
 */
export function checkExercise(
  exerciseName: string,
  muscles: string,
  injuries: Injury[],
): "avoid" | "modify" | null {
  const combined = `${exerciseName} ${muscles}`.toLowerCase();
  let worst: "avoid" | "modify" | null = null;

  for (const injury of injuries) {
    if (injury.resolved_at) continue;
    const keywords = BODY_PART_KEYWORDS[injury.body_part] ?? [];
    const hit = keywords.some((kw) => combined.includes(kw));
    if (hit) {
      if (injury.avoid_or_modify === "avoid") return "avoid";
      worst = "modify";
    }
  }

  return worst;
}

/**
 * Get all body parts that currently have "modify" injuries (for banner display).
 */
export function getModifyParts(injuries: Injury[]): string[] {
  return injuries
    .filter((i) => !i.resolved_at && i.avoid_or_modify === "modify")
    .map((i) => i.body_part);
}

/**
 * Get all body parts that currently have "avoid" injuries.
 */
export function getAvoidParts(injuries: Injury[]): string[] {
  return injuries
    .filter((i) => !i.resolved_at && i.avoid_or_modify === "avoid")
    .map((i) => i.body_part);
}
