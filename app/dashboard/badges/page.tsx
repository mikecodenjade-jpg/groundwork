"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import BadgeToast, { type ToastBadge } from "@/components/BadgeToast";
import { supabase } from "@/lib/supabase";
import {
  BADGE_DEFS,
  BADGE_CATEGORIES,
  computeEarnedSlugs,
  type BadgeSlug,
  type BadgeDef,
} from "@/lib/badges";

// ─── Badge icons ──────────────────────────────────────────────────────────────

const BADGE_ICONS: Record<BadgeSlug, React.ReactNode> = {
  "day-one": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <circle cx="16" cy="16" r="4" fill="currentColor" />
      <line x1="16" y1="4" x2="16" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="24" x2="16" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="7.8" y1="7.8" x2="10.6" y2="10.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="21.4" y1="21.4" x2="24.2" y2="24.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="24.2" y1="7.8" x2="21.4" y2="10.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="10.6" y1="21.4" x2="7.8" y2="24.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "week-strong": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M16 4C16 4 10 10 10 17C10 20.3 12.7 23 16 23C19.3 23 22 20.3 22 17C22 10 16 4 16 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 17C13 18.7 14.3 20 16 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="23" x2="16" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="28" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "iron-month": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M16 4L4 10V20L16 28L28 20V10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11 16L14.5 19.5L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "unbreakable": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M4 24L11 10L16 18L21 10L28 24H4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11 10L16 4L21 10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  "first-blood": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <circle cx="6" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="26" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="16" x2="23" y2="16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="14" y1="11" x2="14" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="11" x2="18" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  "ten-down": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <line x1="6" y1="8" x2="6" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="10" y="8" width="8" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
      <line x1="22" y1="8" x2="22" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26" y1="8" x2="26" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  "fifty-strong": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M16 6L18.5 12H25L19.5 16L22 22L16 18L10 22L12.5 16L7 12H13.5L16 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="10" y1="26" x2="22" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "century-club": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M8 14L4 11L8 8H24L28 11L24 14H8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 14L10 22H22L24 14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="8" y1="26" x2="24" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
    </svg>
  ),
  "head-right": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M19 5L13 16H18L13 27L23 14H17L19 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  "open-book": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M16 8V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 8C16 8 12 6 6 8V26C12 24 16 26 16 26" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 8C16 8 20 6 26 8V26C20 24 16 26 16 26" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  "fuel-smart": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M16 4C16 4 8 12 8 19C8 23.4 11.6 27 16 27C20.4 27 24 23.4 24 19C24 12 16 4 16 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 20C13 21.7 14.3 23 16 23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 16C19 16 22 18 20 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "mile-marker": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M16 4C12.1 4 9 7.1 9 11C9 17 16 27 16 27C16 27 23 17 23 11C23 7.1 19.9 4 16 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="16" cy="11" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  "10-miler": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <circle cx="21" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 11L19 17L14 20L18 23L17 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 17L25 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 14L18 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "marathon-man": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <line x1="6" y1="16" x2="26" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="22" y1="10" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 10L28 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="16" r="3" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="22" cy="16" r="3" fill="currentColor" />
    </svg>
  ),
  "phase-1-complete": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" />
      <path d="M10 16L14 20L22 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "halfway-there": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M5 16C5 9.9 9.9 5 16 5C22.1 5 27 9.9 27 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M5 16C5 22.1 9.9 27 16 27C22.1 27 27 22.1 27 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  ),
  "program-graduate": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M16 7L4 13L16 19L28 13L16 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M22 16V22C19.5 24 16 25 16 25C16 25 12.5 24 10 22V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="28" y1="13" x2="28" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "full-send": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  ),
  "perfect-week": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const angle = (i / 6) * Math.PI - Math.PI / 2;
        const r = 10;
        const cx = 16 + r * Math.cos(angle);
        const cy = 16 + r * Math.sin(angle);
        return <circle key={i} cx={cx} cy={cy} r={2.5} fill="currentColor" opacity={0.4 + i * 0.09} />;
      })}
      <circle cx="16" cy="16" r="2" fill="currentColor" />
    </svg>
  ),
  // Build Milestone icons — construction phases
  "foundation-laid": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <rect x="4" y="22" width="24" height="4" rx="1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="8" y="18" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="12" y1="26" x2="12" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="26" x2="20" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="22" x2="6" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="22" x2="26" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "first-floor-up": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <rect x="6" y="18" width="20" height="10" rx="1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="6" y1="18" x2="6" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="18" x2="26" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="8" x2="26" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="18" x2="13" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  "framing-complete": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <line x1="8" y1="28" x2="8" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="28" x2="24" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8" y1="10" x2="16" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="10" x2="16" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8" y1="28" x2="24" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8" y1="19" x2="24" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  "under-roof": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <path d="M4 14L16 4L28 14" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="7" y="14" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="13" y="20" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="16" y1="4" x2="16" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  "fit-out": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <rect x="5" y="5" width="22" height="22" rx="2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="5" y1="12" x2="27" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="14" y1="12" x2="14" y2="27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M9 18L12 21L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "cert-of-occupancy": (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
      <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="10" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="19" x2="17" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22" cy="22" r="5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19.5 22L21.2 23.7L24.5 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BadgesPage() {
  const [earnedMap, setEarnedMap] = useState<Map<BadgeSlug, string>>(new Map()); // slug → earned_at
  const [newToasts, setNewToasts] = useState<ToastBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch all activity data + saved badges in parallel
      const [
        workoutsRes, checkinsRes, journalsRes, mealsRes,
        runsRes, enrollmentsRes, savedBadgesRes,
      ] = await Promise.all([
        supabase.from("workout_logs").select("created_at").eq("user_id", user.id),
        supabase.from("mood_checkins").select("created_at").eq("user_id", user.id),
        supabase.from("journal_entries").select("created_at").eq("user_id", user.id),
        supabase.from("meal_logs").select("created_at").eq("user_id", user.id),
        supabase.from("run_logs").select("distance_miles, created_at").eq("user_id", user.id),
        supabase.from("program_enrollments").select("program_slug, current_week, status").eq("user_id", user.id),
        supabase.from("badges").select("badge_slug, earned_at").eq("user_id", user.id),
      ]);

      const savedBadges = (savedBadgesRes.data ?? []) as { badge_slug: string; earned_at: string }[];
      const savedSlugs = new Set(savedBadges.map((b) => b.badge_slug));

      // Compute what should be earned now
      const computedSlugs = computeEarnedSlugs({
        workoutDates: (workoutsRes.data ?? []).map((r) => r.created_at),
        checkinDates: (checkinsRes.data ?? []).map((r) => r.created_at),
        journalDates: (journalsRes.data ?? []).map((r) => r.created_at),
        mealDates: (mealsRes.data ?? []).map((r) => r.created_at),
        runLogs: (runsRes.data ?? []) as { distance_miles: number; created_at: string }[],
        enrollments: (enrollmentsRes.data ?? []) as { program_slug: string; current_week: number; status: string }[],
      });

      // New badges not yet in DB
      const newSlugs = computedSlugs.filter((s) => !savedSlugs.has(s));

      // Save new badges
      if (newSlugs.length > 0) {
        await supabase.from("badges").upsert(
          newSlugs.map((slug) => ({ user_id: user.id, badge_slug: slug })),
          { onConflict: "user_id,badge_slug" }
        );
      }

      // Build earned map (slug → earned_at)
      const now = new Date().toISOString();
      const map = new Map<BadgeSlug, string>();
      for (const b of savedBadges) map.set(b.badge_slug as BadgeSlug, b.earned_at);
      for (const slug of newSlugs) map.set(slug as BadgeSlug, now);

      setEarnedMap(map);

      // Queue toasts for newly earned badges
      if (newSlugs.length > 0) {
        setNewToasts(
          newSlugs.map((slug) => ({
            slug,
            title: BADGE_DEFS.find((b) => b.slug === slug)?.title ?? slug,
          }))
        );
      }

      setLoading(false);
    }
    load();
  }, []);

  const totalEarned = earnedMap.size;

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      {/* Toast */}
      <BadgeToast badges={newToasts} />

      <div className="max-w-2xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back to dashboard"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
              Progress
            </p>
            <h1 className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
              Milestones
            </h1>
          </div>
          {!loading && (
            <div className="ml-auto text-right">
              <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}>
                {totalEarned}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest block"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                / {BADGE_DEFS.length} earned
              </span>
            </div>
          )}
        </header>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl"
                style={{ backgroundColor: "#161616", border: "1px solid #1E1E1E" }} />
            ))}
          </div>
        ) : (
          /* Categories */
          <div className="flex flex-col gap-10">
            {BADGE_CATEGORIES.map((category) => {
              const defs = BADGE_DEFS.filter((b) => b.category === category);
              return (
                <section key={category}>
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                    style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                    {category}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {defs.map((badge) => (
                      <BadgeCard
                        key={badge.slug}
                        badge={badge}
                        earnedAt={earnedMap.get(badge.slug) ?? null}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

// ─── Badge Card ───────────────────────────────────────────────────────────────

function BadgeCard({ badge, earnedAt }: { badge: BadgeDef; earnedAt: string | null }) {
  const earned = !!earnedAt;

  return (
    <div
      className="flex flex-col items-center gap-3 px-4 py-5 text-center transition-all duration-200"
      style={{
        backgroundColor: "#161616",
        border: `1px solid ${earned ? "#C45B28" : "#252525"}`,
        borderRadius: "12px",
        opacity: earned ? 1 : 0.3,
        boxShadow: earned ? "0 0 16px rgba(196, 91, 40, 0.18)" : "none",
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-12 h-12 rounded-xl"
        style={{
          backgroundColor: earned ? "#1A0A00" : "#0A0A0A",
          border: `1px solid ${earned ? "#3A1A00" : "#1A1A1A"}`,
          color: earned ? "#C45B28" : "#9A9A9A",
        }}
      >
        {BADGE_ICONS[badge.slug]}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold uppercase leading-tight"
          style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
          {badge.title}
        </span>
        <span className="text-[11px] leading-relaxed"
          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          {badge.description}
        </span>
      </div>

      {/* Earned date or locked */}
      {earned && earnedAt ? (
        <span className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
          {new Date(earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ) : (
        <span className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}>
          Locked
        </span>
      )}
    </div>
  );
}
