// ─── Equipment settings ──────────────────────────────────────────────────────

export type EquipmentSetting = "gym" | "home" | "hotel" | "nothing";

export const EQUIPMENT_OPTIONS: { value: EquipmentSetting; label: string }[] = [
  { value: "gym",     label: "Gym" },
  { value: "home",    label: "Home" },
  { value: "hotel",   label: "Hotel" },
  { value: "nothing", label: "Nothing" },
];

// Keywords that indicate an exercise requires specific equipment.
// If an exercise name or note contains any of these, it needs that tier.
const GYM_ONLY_KEYWORDS = [
  "barbell", "cable", "smith machine", "lat pulldown", "leg press",
  "leg curl", "leg extension", "hack squat", "pec deck", "machine",
  "rack", "plates", "bar ",
];

const HOME_KEYWORDS = [
  // Everything bodyweight + these
  "dumbbell", "db ", "resistance band", "band", "pull-up bar",
  "pull up bar", "kettlebell", "kb ",
];

// These exercises are always bodyweight — no equipment needed
const BODYWEIGHT_KEYWORDS = [
  "bodyweight", "push-up", "pushup", "push up", "pull-up", "pullup",
  "pull up", "squat", "lunge", "plank", "burpee", "dip", "crunch",
  "sit-up", "sit up", "mountain climber", "jump", "jog", "run",
  "walk", "sprint", "stretch", "yoga", "warm-up", "warm up",
  "cool-down", "cool down", "dynamic", "foam roll", "mobility",
  "stride", "tempo", "hill repeat", "breathing", "calf raise",
  "glute bridge", "hip thrust", "step-up", "step up",
];

/**
 * Determine the minimum equipment tier an exercise needs.
 * Returns "nothing" (bodyweight), "home" (dumbbells/bands), or "gym" (full gym).
 */
function exerciseTier(name: string, note?: string): EquipmentSetting {
  const text = `${name} ${note ?? ""}`.toLowerCase();

  // Check gym-only first (most restrictive)
  if (GYM_ONLY_KEYWORDS.some((kw) => text.includes(kw))) return "gym";

  // Check home equipment
  if (HOME_KEYWORDS.some((kw) => text.includes(kw))) return "home";

  // Everything else is bodyweight
  return "nothing";
}

/** Equipment tiers ordered from most restrictive to least */
const TIER_LEVEL: Record<EquipmentSetting, number> = {
  gym: 3,
  home: 2,
  hotel: 1,  // hotel = dumbbells only, subset of home
  nothing: 0,
};

/**
 * Check if an exercise is available given the user's equipment setting.
 */
export function exerciseMatchesEquipment(
  exerciseName: string,
  exerciseNote: string | undefined,
  setting: EquipmentSetting,
): boolean {
  if (setting === "gym") return true; // gym has everything

  const needed = exerciseTier(exerciseName, exerciseNote);

  if (setting === "nothing") {
    return needed === "nothing";
  }

  if (setting === "hotel") {
    // Hotel: bodyweight + dumbbells only (no pull-up bar, no bands, no kettlebell)
    if (needed === "gym") return false;
    if (needed === "home") {
      const text = `${exerciseName} ${exerciseNote ?? ""}`.toLowerCase();
      // Allow dumbbells in hotel, block everything else home-tier
      return text.includes("dumbbell") || text.includes("db ");
    }
    return true; // bodyweight is fine
  }

  // home: allow nothing + home tier, block gym
  return TIER_LEVEL[needed] <= TIER_LEVEL.home;
}

/**
 * Categories that should be hidden entirely based on equipment.
 */
const CATEGORY_EQUIPMENT: Record<string, EquipmentSetting> = {
  weightlifting: "gym",
  bodybuilding: "gym",
};

/**
 * Filter categories based on equipment setting.
 */
export function categoryAvailable(slug: string, setting: EquipmentSetting): boolean {
  if (setting === "gym") return true;
  const needed = CATEGORY_EQUIPMENT[slug];
  if (!needed) return true; // category has no equipment restriction
  return TIER_LEVEL[setting] >= TIER_LEVEL[needed];
}
