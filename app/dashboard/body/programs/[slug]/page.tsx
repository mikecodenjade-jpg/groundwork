"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  getProgramBySlug,
  getWeeks,
  type Week,
  type Phase,
} from "@/lib/programs";
import BottomNav from "@/components/BottomNav";
import Breadcrumb from "@/components/Breadcrumb";

type Enrollment = {
  id: string;
  current_week: number;
  status: string;
};

type WeekStatus = "completed" | "current" | "locked";

function getWeekStatus(
  weekNum: number,
  enrollment: Enrollment | null
): WeekStatus {
  if (!enrollment) return weekNum === 1 ? "current" : "locked";
  if (weekNum < enrollment.current_week) return "completed";
  if (weekNum === enrollment.current_week) return "current";
  return "locked";
}

const STATUS_STYLES: Record<WeekStatus, { label: string; color: string; bg: string; border: string }> = {
  completed: { label: "Done",    color: "#4CAF50", bg: "#0A2010", border: "#1A4A20" },
  current:   { label: "Current", color: "#C45B28", bg: "#1A0A00", border: "#3A1A00" },
  locked:    { label: "Locked",  color: "#3A3A3A", bg: "#0A0A0A", border: "#1A1A1A" },
};

export default function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const program = getProgramBySlug(slug);
  const weeks = program ? getWeeks(slug) : [];

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("program_enrollments")
        .select("id, current_week, status")
        .eq("user_id", user.id)
        .eq("program_slug", slug)
        .single();
      setEnrollment(data as Enrollment | null);
      setLoading(false);
    }
    load();
  }, [slug]);

  const startProgram = useCallback(async () => {
    setEnrolling(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setEnrolling(false); return; }

    const { data } = await supabase
      .from("program_enrollments")
      .upsert(
        { user_id: user.id, program_slug: slug, current_week: 1, status: "active" },
        { onConflict: "user_id,program_slug" }
      )
      .select("id, current_week, status")
      .single();

    setEnrollment(data as Enrollment | null);
    setEnrolling(false);
  }, [slug]);

  if (!program) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
        <p style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Program not found.</p>
      </main>
    );
  }

  // Group weeks by phase
  const phaseGroups: { phase: Phase; weeks: Week[] }[] = program.phases.map((phase) => ({
    phase,
    weeks: weeks.filter((w) => w.phaseNum === phase.num),
  }));

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === "completed";

  // "Level up" progression: Kickstart → Foundation → Power Block → Operator Conditioning
  const NEXT_PROGRAM: Record<string, { slug: string; name: string }> = {
    "8-week-kickstart":     { slug: "16-week-foundation",  name: "16-Week Foundation" },
    "16-week-foundation":   { slug: "power-block",         name: "Power Block Training" },
    "power-block":          { slug: "military-functional", name: "Operator Conditioning" },
    "back-in-the-groove":   { slug: "8-week-kickstart",    name: "8-Week Kickstart" },
  };

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-10 pb-28">

        <Breadcrumb items={[
          { label: "Body", href: "/dashboard/body" },
          { label: "Programs", href: "/dashboard/body/programs" },
          { label: program.name },
        ]} />

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/body/programs"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back to programs"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
              Program
            </p>
            <h1 className="text-3xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
              {program.name}
            </h1>
          </div>
        </header>

        {/* Overview card */}
        <div
          className="px-7 py-6 flex flex-col gap-4"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            {program.description}
          </p>

          <div className="flex flex-wrap gap-6">
            {[
              { label: program.ongoing ? "Ongoing" : `${program.totalWeeks} Weeks`, sub: "Duration" },
              { label: program.workouts, sub: "Workouts" },
              { label: program.timePerDay, sub: "Per Day" },
              { label: program.difficulty, sub: "Level" },
            ].map(({ label, sub }) => (
              <div key={sub} className="flex flex-col gap-0.5">
                <span className="text-lg font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                  {label}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  {sub}
                </span>
              </div>
            ))}
          </div>

          {/* Start / enrolled / completed state */}
          {loading ? (
            <div className="h-12 w-40 animate-pulse rounded-lg" style={{ backgroundColor: "#252525" }} />
          ) : isCompleted ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5"
                style={{ backgroundColor: "#0A2010", color: "#4CAF50", border: "1px solid #1A4A20", borderRadius: "6px", fontFamily: "var(--font-inter)" }}>
                Completed
              </span>
            </div>
          ) : isEnrolled ? (
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/body/programs/${slug}/week/${enrollment!.current_week}`}
                className="flex items-center justify-center px-7 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 700,
                }}
              >
                Week {enrollment!.current_week} →
              </Link>
              <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Enrolled · In progress
              </span>
            </div>
          ) : (
            <button
              onClick={startProgram}
              disabled={enrolling}
              className="self-start flex items-center justify-center px-7 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: "#C45B28",
                color: "#0A0A0A",
                borderRadius: "8px",
                fontFamily: "var(--font-inter)",
                fontWeight: 700,
              }}
            >
              {enrolling ? "Starting…" : "Start Program"}
            </button>
          )}
        </div>

        {/* Program Complete — What's Next */}
        {isCompleted && (
          <div
            className="px-7 py-8 flex flex-col gap-6"
            style={{ backgroundColor: "#0A1A0A", border: "1px solid #1A4A20", borderRadius: "12px" }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-2"
                style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
                Program Complete
              </p>
              <h2 className="text-3xl font-black uppercase leading-none"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
                You Finished It.
              </h2>
            </div>

            <div className="flex flex-wrap gap-6">
              {[
                { label: String(program.totalWeeks ?? "—"), sub: "Weeks Completed" },
                { label: program.workouts, sub: "Total Workouts" },
              ].map(({ label, sub }) => (
                <div key={sub} className="flex flex-col gap-0.5">
                  <span className="text-2xl font-bold" style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>{label}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{sub}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                What&apos;s Next?
              </p>

              {/* Run it again */}
              <button
                onClick={startProgram}
                disabled={enrolling}
                className="flex items-center justify-between px-5 py-4 transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "10px", textAlign: "left" }}
              >
                <div>
                  <p className="text-sm font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>Run It Again</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Restart {program.name} from Week 1</p>
                </div>
                <span style={{ color: "#C45B28" }}>›</span>
              </button>

              {/* Level up */}
              {NEXT_PROGRAM[slug] && (
                <Link
                  href={`/dashboard/body/programs/${NEXT_PROGRAM[slug].slug}`}
                  className="flex items-center justify-between px-5 py-4 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#161616", border: "1px solid #C45B28", borderRadius: "10px" }}
                >
                  <div>
                    <p className="text-sm font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>Level Up</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Start {NEXT_PROGRAM[slug].name}</p>
                  </div>
                  <span style={{ color: "#C45B28" }}>›</span>
                </Link>
              )}

              {/* Switch it up */}
              <Link
                href="/dashboard/body/programs"
                className="flex items-center justify-between px-5 py-4 transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "10px" }}
              >
                <div>
                  <p className="text-sm font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>Switch It Up</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Browse all programs</p>
                </div>
                <span style={{ color: "#C45B28" }}>›</span>
              </Link>
            </div>
          </div>
        )}

        {/* Daily Blueprint — special case */}
        {program.ongoing && (
          <div
            className="px-7 py-6 flex flex-col gap-4"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
          >
            <p className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
              How It Works
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Every morning, pick how much time you have. We pick the workout. No planning, no program,
              no excuses. Just show up and go.
            </p>
            <div className="flex flex-wrap gap-3">
              {[15, 30, 45, 60].map((min) => (
                <Link
                  key={min}
                  href={`/dashboard/body/${program.workoutCategory}?time=${min}`}
                  className="flex-1 min-w-[72px] flex items-center justify-center py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
                  style={{
                    backgroundColor: "#0A0A0A",
                    border: "1px solid #252525",
                    borderRadius: "8px",
                    color: "#E8E2D8",
                    fontFamily: "var(--font-inter)",
                    fontWeight: 700,
                  }}
                >
                  {min} min
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Phase breakdown */}
        {phaseGroups.length > 0 && (
          <div className="flex flex-col gap-8">
            {phaseGroups.map(({ phase, weeks: phaseWeeks }) => (
              <section key={phase.name}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#C45B28" }} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      Phase {phase.num}
                    </p>
                    <p className="text-base font-bold uppercase"
                      style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                      {phase.name}
                    </p>
                  </div>
                  <span className="text-xs ml-auto" style={{ color: "#3A3A3A", fontFamily: "var(--font-inter)" }}>
                    Weeks {phase.weekStart}–{phase.weekEnd}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {phaseWeeks.map((week) => {
                    const status = getWeekStatus(week.num, enrollment);
                    const st = STATUS_STYLES[status];
                    const isAccessible = status !== "locked";

                    return (
                      <WeekRow
                        key={week.num}
                        week={week}
                        status={status}
                        st={st}
                        isAccessible={isAccessible}
                        slug={slug}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

function WeekRow({
  week,
  status,
  st,
  isAccessible,
  slug,
}: {
  week: Week;
  status: WeekStatus;
  st: { label: string; color: string; bg: string; border: string };
  isAccessible: boolean;
  slug: string;
}) {
  const content = (
    <div
      className="flex items-center gap-4 px-5 py-4 transition-all duration-150"
      style={{
        backgroundColor: status === "current" ? "#1A0A00" : "#161616",
        border: `1px solid ${status === "current" ? "#3A1A00" : "#252525"}`,
        borderRadius: "10px",
        opacity: status === "locked" ? 0.45 : 1,
      }}
    >
      {/* Week number */}
      <div
        className="flex items-center justify-center w-10 h-10 shrink-0 rounded-lg text-sm font-bold"
        style={{
          backgroundColor: st.bg,
          border: `1px solid ${st.border}`,
          color: st.color,
          fontFamily: "var(--font-inter)",
        }}
      >
        {status === "completed" ? (
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
            <path d="M4 10l4 4 8-8" stroke={st.color} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : status === "locked" ? (
          <svg viewBox="0 0 20 20" fill="none" width={14} height={14}>
            <rect x="4" y="9" width="12" height="9" rx="2" stroke={st.color} strokeWidth="1.5" />
            <path d="M7 9V6a3 3 0 016 0v3" stroke={st.color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          week.num
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: st.color, fontFamily: "var(--font-inter)" }}>
          Week {week.num} · {week.phase}
        </p>
        <p className="text-sm font-bold truncate"
          style={{ color: status === "locked" ? "#3A3A3A" : "#E8E2D8", fontFamily: "var(--font-inter)" }}>
          {week.title}
        </p>
        <p className="text-xs mt-0.5 line-clamp-1"
          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          {week.description}
        </p>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          {week.dailyTime} min/day
        </span>
        {isAccessible && (
          <span className="text-xs font-semibold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
            →
          </span>
        )}
      </div>
    </div>
  );

  if (!isAccessible) return content;

  return (
    <Link href={`/dashboard/body/programs/${slug}/week/${week.num}`}>
      {content}
    </Link>
  );
}
