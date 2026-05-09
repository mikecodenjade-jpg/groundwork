// ─── On-Device Crisis Detection ───────────────────────────────────────────────
// Runs entirely client-side via regex. Zero server involvement.
// Call BEFORE sending any user free-text to a server, AND before persisting it.
//
// Coverage matters more than precision here: the consequence of a false
// negative (a real distress signal slipping through) is much worse than a
// false positive (showing the crisis screen when the user wasn't in crisis).

const CRISIS_PATTERNS: RegExp[] = [
  // Explicit suicidal language
  /\bsuicid/i,
  /\bkill\s+(my)?self\b/i,
  /\bi\s+want\s+to\s+kill\s+myself\b/i,
  /\bi(?:'m|'m|\s+am)\s+going\s+to\s+kill\s+myself\b/i,
  /\bend\s+(it|my\s+life|it\s+all)\b/i,
  /\bi\s+want\s+to\s+end\s+it\s+all\b/i,
  /\bsuicide\s+plan\b/i,
  /\bsuicide\s+note\b/i,
  /\bgoodbye\s+letter\b/i,

  // Wanting to die / not wanting to be here
  /\b(want|going)\s+to\s+die\b/i,
  /\bi\s+want\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(be\s+here|live)\b/i,
  /\bno\s+reason\s+to\s+(live|go\s+on)\b/i,
  /\bcan'?t\s+(go\s+on|do\s+this\s+anymore)\b/i,
  /\bgive\s+up\s+on\s+(life|everything)\b/i,

  // Self-harm
  /\bhurt\s+(my)?self\b/i,
  /\bi(?:'m|'m|\s+am)\s+going\s+to\s+hurt\s+myself\b/i,
  /\bi\s+have\s+a\s+plan\s+to\s+(end\s+my\s+life|hurt\s+myself)\b/i,
  /\bself.?harm\b/i,
];

export const CRISIS_RESPONSE = `This sounds heavy. I want you to talk to someone who can really help right now.

Call or text **988** (Suicide & Crisis Lifeline) — available 24/7.

Text **HOME to 741741** (Crisis Text Line) — free, confidential, 24/7.

You don't have to carry this alone. Please reach out.`;

/**
 * Returns true if the text contains any crisis keyword.
 * Safe to call with empty/undefined/null — returns false.
 */
export function detectCrisisKeywords(text: string | null | undefined): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

/**
 * Convenience helper: scans multiple free-text fields and returns true if
 * ANY of them trip the detector. Use this on forms with multiple prompts
 * (e.g. Today: pissed_off + handled_well; Heart: entry + gratitude_1).
 */
export function detectCrisisInFields(
  ...fields: Array<string | null | undefined>
): boolean {
  return fields.some((f) => detectCrisisKeywords(f));
}

/**
 * Given recent daily mood scores (1–5, newest first),
 * returns the passive support tier.
 *
 * Tier 2 — mood < 2 for 3+ consecutive days  (persistent low)
 * Tier 1 — latest mood < 3                   (rough stretch)
 * Tier 0 — no concern
 *
 * The crisis-keyword tier is triggered by detectCrisisKeywords, not by scores.
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
