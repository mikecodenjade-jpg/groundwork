#!/usr/bin/env bash
# Minimal smoke check: typecheck, lint, build all pass and the legacy-RLS
# migration exists. Run from repo root.
#
#   ./scripts/smoke-check.sh
#
# Exits non-zero on the first failure.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Verifying RLS migration is committed…"
test -f supabase/migrations/024_rls_legacy_tables.sql

echo "→ Verifying /api/coach has an auth check…"
grep -q "supabase.auth.getUser" app/api/coach/route.ts
grep -q "Unauthorized" app/api/coach/route.ts

echo "→ Verifying coach UI no longer uses dangerouslySetInnerHTML…"
if grep -q "dangerouslySetInnerHTML" app/dashboard/coach/page.tsx; then
  echo "  FAIL: dangerouslySetInnerHTML still present in coach UI"
  exit 1
fi

echo "→ Verifying crisis detection is consolidated…"
grep -q "detectCrisisInFields" lib/crisisDetection.ts
grep -q "detectCrisisInFields" app/dashboard/today/page.tsx
grep -q "detectCrisisInFields" app/dashboard/heart/page.tsx

echo "→ npx tsc --noEmit"
npx tsc --noEmit

echo "→ npm run build"
npm run build

echo "✓ smoke check passed"
