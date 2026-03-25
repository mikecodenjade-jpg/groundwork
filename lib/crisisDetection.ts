// ─── On-Device Crisis Detection ───────────────────────────────────────────────
// Runs entirely client-side via regex. Zero server involvement.
// Call BEFORE sending any user text to a server.

const TIER_3_PATTERNS: RegExp[] = [
  /\bi\s+want\s+to\s+kill\s+myself\b/i,
  /\bi\s+want\s+to\s+die\b/i,
  /\bi(?:'m|'m|\s+am)\s+going\s+to\s+kill\s+myself\b/i,
  /\bi\s+have\s+a\s+plan\s+to\s+end\s+my\s+life\b/i,
  /\bi\s+have\s+a\s+plan\s+to\s+hurt\s+myself\b/i,
  /\bi(?:'m|'m|\s+am)\s+going\s+to\s+hurt\s+myself\b/i,
  /\bi\s+want\s+to\s+end\s+it\s+all\b/i,
  /\bsuicide\s+plan\b/i,
  /\bsuicide\s+note\b/i,
  /\bgoodbye\s+letter\b/i,
];

/**
 * Returns true if the text contains any Tier 3 crisis keyword.
 * Safe to call with empty strings — returns false.
 */
export function detectCrisisKeywords(text: string): boolean {
  if (!text) return false;
  return TIER_3_PATTERNS.some((re) => re.test(text));
}

/**
 * Given recent daily mood scores (1–5, newest first),
 * returns the passive support tier.
 *
 * Tier 2 — mood < 2 for 3+ consecutive days  (persistent low)
 * Tier 1 — latest mood < 3                   (rough stretch)
 * Tier 0 — no concern
 *
 * Tier 3 is triggered by keyword detection, not by scores.
 */
export function assessMoodTier(recentMoods: number[]): 0 | 1 | 2 {
  if (recentMoods.length === 0) return 0;
  if (
    recentMoods.length >= 3 &&
    recentMoods[0] < 2 &&
    recentMoods[1] < 2 &&
    recentMoods[2] < 2
  ) {
    return 2;
  }
  if (recentMoods[0] < 3) return 1;
  return 0;
}
