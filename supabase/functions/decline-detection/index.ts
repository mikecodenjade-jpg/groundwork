// ─── Decline Detection Edge Function ─────────────────────────────────────────
// Called after each mood check-in. Queries the last 30 days of daily_checkins
// and user engagement data, computes a 0-100 risk score, stores it in
// decline_scores, and returns the tier + recommended client actions.
//
// Risk tiers:
//   0–30  green  — normal fluctuation
//  31–60  yellow — gentle nudge (breathing exercise, check-in prompt)
//  61–80  orange — proactive outreach (surface crisis resources subtly)
//  81–100 red    — crisis resources front and center (mirrors client Tier 3)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RequestBody {
  user_id: string
  /** Current check-in mood score 1–5. Optional — history is pulled from DB. */
  mood_score?: number
  /** Human-readable label for logging ("thriving" | "good" | "okay" | "struggling" | "low") */
  mood_label?: string
  /** Recent Coach conversation text — reserved for future NLP pass. */
  coach_context?: string
}

interface Factors {
  consecutive_low_days: number  // leading streak of mood ≤ 2 (most recent first)
  dips_7day: number             // check-ins with mood ≤ 2 in last 7 days
  dips_30day: number            // check-ins with mood ≤ 2 in last 30 days
  engagement_drop: boolean      // streak == 0 or no activity in 3+ days
  streak_days: number           // current engagement streak length
}

interface DeclineResult {
  score: number
  tier: 'green' | 'yellow' | 'orange' | 'red'
  factors: Factors
  actions: string[]
}

type Checkin = { mood: number; created_at: string }
type StreakRow = { current_streak: number; last_activity_date: string | null }

// ── Scoring ───────────────────────────────────────────────────────────────────

/**
 * Converts engagement/mood factors into a 0–100 risk score.
 *
 * Weights:
 *   consecutive low mood  0–40 pts  (each day = 10 pts, capped at 4 days)
 *   7-day dip frequency   0–30 pts  (dips/7 × 30)
 *   30-day pattern        0–15 pts  (dips/30 × 15)
 *   engagement drop       0–15 pts  (flat bonus when disengaged)
 */
function computeScore(f: Factors): number {
  const consecutive = Math.min(f.consecutive_low_days * 10, 40)
  const freq7        = Math.min((f.dips_7day  / 7)  * 30, 30)
  const freq30       = Math.min((f.dips_30day / 30) * 15, 15)
  const engagement   = f.engagement_drop ? 15 : 0
  return Math.round(consecutive + freq7 + freq30 + engagement)
}

function scoreToTier(score: number): DeclineResult['tier'] {
  if (score <= 30) return 'green'
  if (score <= 60) return 'yellow'
  if (score <= 80) return 'orange'
  return 'red'
}

function actionsForTier(tier: DeclineResult['tier']): string[] {
  switch (tier) {
    case 'yellow':
      return ['suggest_breathing_exercise', 'show_checkin_prompt']
    case 'orange':
      return [
        'coach_initiates_checkin',
        'surface_crisis_resources_subtle',
        'suggest_breathing_exercise',
      ]
    case 'red':
      return [
        'crisis_resources_front_and_center',
        'crisis_hotline_visible',
        'coach_initiates_checkin',
      ]
    default:
      return []
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const body: RequestBody = await req.json()
    const { user_id, mood_label } = body

    if (!user_id) {
      return json({ error: 'user_id is required' }, 400)
    }

    // Service role client — bypasses RLS so the function can write decline_scores
    // without needing the user's JWT.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // ── Fetch mood history ──────────────────────────────────────────────────
    const { data: checkins, error: checkinsErr } = await supabase
      .from('daily_checkins')
      .select('mood, created_at')
      .eq('user_id', user_id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (checkinsErr) {
      console.error('[decline-detection] checkins fetch error:', checkinsErr)
      throw checkinsErr
    }

    const rows: Checkin[] = checkins ?? []

    // ── Fetch engagement streak ─────────────────────────────────────────────
    const { data: streakRow } = await supabase
      .from('user_streaks')
      .select('current_streak, last_activity_date')
      .eq('user_id', user_id)
      .maybeSingle<StreakRow>()

    // ── Compute factors ─────────────────────────────────────────────────────

    // Consecutive low mood (rows are newest-first)
    let consecutiveLow = 0
    for (const row of rows) {
      if (row.mood <= 2) consecutiveLow++
      else break
    }

    const dips7  = rows.filter(r => r.mood <= 2 && new Date(r.created_at) >= sevenDaysAgo).length
    const dips30 = rows.filter(r => r.mood <= 2).length

    const lastActive = streakRow?.last_activity_date
      ? new Date(streakRow.last_activity_date)
      : null
    const daysSinceActive = lastActive
      ? Math.floor((now.getTime() - lastActive.getTime()) / 86_400_000)
      : 99
    const engagementDrop =
      (streakRow?.current_streak ?? 0) === 0 || daysSinceActive > 3

    const factors: Factors = {
      consecutive_low_days: consecutiveLow,
      dips_7day:            dips7,
      dips_30day:           dips30,
      engagement_drop:      engagementDrop,
      streak_days:          streakRow?.current_streak ?? 0,
    }

    const score   = computeScore(factors)
    const tier    = scoreToTier(score)
    const actions = actionsForTier(tier)

    // ── Persist result ──────────────────────────────────────────────────────
    const { error: insertErr } = await supabase.from('decline_scores').insert({
      user_id,
      score,
      tier,
      factors,
      calculated_at: now.toISOString(),
    })

    if (insertErr) {
      console.error('[decline-detection] insert error:', insertErr)
      throw insertErr
    }

    console.log(
      `[decline-detection] user=${user_id} mood=${mood_label ?? '?'} ` +
      `score=${score} tier=${tier} consecutive=${consecutiveLow} ` +
      `dips7=${dips7} dips30=${dips30} streak=${streakRow?.current_streak ?? 0}`,
    )

    const result: DeclineResult = { score, tier, factors, actions }
    return json(result, 200)
  } catch (err) {
    console.error('[decline-detection] unhandled error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
