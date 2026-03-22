"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getProgramBySlug, getDays, getWeeks, type DayWorkout } from "@/lib/programs";
import BottomNav from "@/components/BottomNav";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function WeekPage({
  params,
}: {
  params: Promise<{ slug: string; weekNum: string }>;
}) {
  const { slug, weekNum: weekNumStr } = use(params);
  const weekNum = Number(weekNumStr);

  const program = getProgramBySlug(slug);
  const days = program ? getDays(slug, weekNum) : [];
  const allWeeks = program ? getWeeks(slug) : [];
  const week = allWeeks.find((w) => w.num === weekNum);

  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<number | null>(null);
  const [weekAdvanced, setWeekAdvanced] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("program_progress")
        .select("day_num")
        .eq("user_id", user.id)
        .eq("program_slug", slug)
        .eq("week_num", weekNum);

      const done = new Set<number>((data ?? []).map((r: { day_num: number }) => r.day_num));
      setCompletedDays(done);
      setLoading(false);
    }
    load();
  }, [slug, weekNum]);

  const markDayComplete = useCallback(
    async (dayNum: number) => {
      if (completedDays.has(dayNum) || marking !== null) return;
      setMarking(dayNum);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMarking(null); return; }

      // Insert progress row (ignore if already exists)
      await supabase
        .from("program_progress")
        .upsert(
          { user_id: user.id, program_slug: slug, week_num: weekNum, day_num: dayNum },
          { onConflict: "user_id,program_slug,week_num,day_num" }
        );

      const newCompleted = new Set(completedDays).add(dayNum);
      setCompletedDays(newCompleted);

      // If all 5 days done, advance enrollment week
      if (newCompleted.size >= days.length && days.length > 0 && program?.totalWeeks) {
        const { data: enrollment } = await supabase
          .from("program_enrollments")
          .select("id, current_week")
          .eq("user_id", user.id)
          .eq("program_slug", slug)
          .single();

        if (enrollment && enrollment.current_week === weekNum) {
          const nextWeek = weekNum + 1;
          const isLastWeek = nextWeek > (program.totalWeeks ?? 0);

          await supabase
            .from("program_enrollments")
            .update({
              current_week: isLastWeek ? weekNum : nextWeek,
              status: isLastWeek ? "completed" : "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);

          setWeekAdvanced(true);
        }
      }

      setMarking(null);
    },
    [completedDays, marking, slug, weekNum, days.length, program]
  );

  if (!program || !week) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
        <p style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Week not found.</p>
      </main>
    );
  }

  const allDone = completedDays.size >= days.length && days.length > 0;
  const nextWeekNum = weekNum + 1;
  const hasNextWeek = program.totalWeeks ? nextWeekNum <= program.totalWeeks : false;

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href={`/dashboard/body/programs/${slug}`}
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back to program"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
              {program.name} · {week.phase}
            </p>
            <h1 className="text-3xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
              Week {weekNum}: {week.title}
            </h1>
          </div>
        </header>

        {/* Week description */}
        <div
          className="px-6 py-4 flex items-start gap-3"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "10px" }}
        >
          <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ backgroundColor: "#C45B28" }} />
          <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {week.description}
          </p>
        </div>

        {/* Progress bar */}
        {!loading && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Week Progress
              </span>
              <span className="text-xs font-bold"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                {completedDays.size}/{days.length} days
              </span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: "4px", backgroundColor: "#252525" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  backgroundColor: allDone ? "#4CAF50" : "#C45B28",
                  width: `${(completedDays.size / days.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Week complete banner */}
        {allDone && weekAdvanced && (
          <div
            className="flex flex-col gap-3 px-6 py-5"
            style={{ backgroundColor: "#0A2010", border: "1px solid #1A4A20", borderRadius: "12px" }}
          >
            <p className="text-sm font-bold uppercase tracking-wide"
              style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
              ✓ Week {weekNum} Complete
            </p>
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {hasNextWeek
                ? `Week ${nextWeekNum} is now unlocked.`
                : "You've completed the entire program. That's earned."}
            </p>
            {hasNextWeek && (
              <Link
                href={`/dashboard/body/programs/${slug}/week/${nextWeekNum}`}
                className="self-start flex items-center justify-center px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-90"
                style={{
                  backgroundColor: "#4CAF50",
                  color: "#0A0A0A",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 700,
                }}
              >
                Start Week {nextWeekNum} →
              </Link>
            )}
          </div>
        )}

        {/* Day cards */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl"
                style={{ backgroundColor: "#161616", border: "1px solid #1E1E1E" }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {days.map((day, i) => (
              <DayCard
                key={i}
                dayNum={i + 1}
                dayLabel={DAY_LABELS[i]}
                day={day}
                completed={completedDays.has(i + 1)}
                marking={marking === i + 1}
                workoutHref={`/dashboard/body/${program.workoutCategory}?time=${day.duration}`}
                onMarkComplete={() => markDayComplete(i + 1)}
              />
            ))}
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

function DayCard({
  dayNum,
  dayLabel,
  day,
  completed,
  marking,
  workoutHref,
  onMarkComplete,
}: {
  dayNum: number;
  dayLabel: string;
  day: DayWorkout;
  completed: boolean;
  marking: boolean;
  workoutHref: string;
  onMarkComplete: () => void;
}) {
  return (
    <div
      style={{
        backgroundColor: completed ? "#0A1A0A" : "#161616",
        border: `1px solid ${completed ? "#1A4A20" : "#252525"}`,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Day header strip */}
      <div
        className="flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom: `1px solid ${completed ? "#1A4A20" : "#252525"}` }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: completed ? "#4CAF50" : "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          Day {dayNum} · {dayLabel}
        </span>
        {completed && (
          <span className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
            ✓ Done
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex items-center gap-4">
        {/* Day number circle */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-sm font-bold"
          style={{
            backgroundColor: completed ? "#1A4A20" : "#0A0A0A",
            border: `1px solid ${completed ? "#2A6A30" : "#252525"}`,
            color: completed ? "#4CAF50" : "#9A9A9A",
            fontFamily: "var(--font-inter)",
          }}
        >
          {completed ? (
            <svg viewBox="0 0 20 20" fill="none" width={14} height={14}>
              <path d="M4 10l4 4 8-8" stroke="#4CAF50" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : dayNum}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold truncate"
            style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            {day.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {day.focus}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ backgroundColor: "#0A0A0A", border: "1px solid #252525", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {day.duration} min
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ backgroundColor: "#0A0A0A", border: "1px solid #252525", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {day.exercises} exercises
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Link
            href={workoutHref}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: completed ? "transparent" : "#C45B28",
              color: completed ? "#9A9A9A" : "#0A0A0A",
              border: completed ? "1px solid #252525" : "none",
              borderRadius: "6px",
              fontFamily: "var(--font-inter)",
              fontWeight: 700,
            }}
          >
            {completed ? "Redo" : "Start →"}
          </Link>

          {!completed && (
            <button
              onClick={onMarkComplete}
              disabled={marking}
              className="text-[10px] font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 disabled:opacity-30"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              {marking ? "Saving…" : "Mark done"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
