"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { PROGRAMS, type Program } from "@/lib/programs";

type Enrollment = { program_slug: string; current_week: number; status: string };

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner:   "#3A5A3A",
  "All Levels": "#7A5228",
  Advanced:   "#5A1A1A",
};

export default function ProgramsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("program_enrollments")
        .select("program_slug, current_week, status")
        .eq("user_id", user.id);
      setEnrollments((data as Enrollment[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function enrollmentFor(slug: string) {
    return enrollments.find((e) => e.program_slug === slug);
  }

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/body"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back to body"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
              Body
            </p>
            <h1 className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
              Programs
            </h1>
          </div>
        </header>

        <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          Pick a program and commit. Every workout is mapped out — just show up.
        </p>

        {/* Program cards */}
        <div className="flex flex-col gap-5">
          {PROGRAMS.map((program) => (
            <ProgramCard
              key={program.slug}
              program={program}
              enrollment={loading ? undefined : enrollmentFor(program.slug)}
            />
          ))}
        </div>

      </div>
      <BottomNav />
    </main>
  );
}

function ProgramCard({
  program,
  enrollment,
}: {
  program: Program;
  enrollment: Enrollment | undefined;
}) {
  const isEnrolled = !!enrollment;
  const diffColor = DIFFICULTY_COLOR[program.difficulty] ?? "#7A5228";

  return (
    <div
      style={{
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Card header strip */}
      <div
        className="flex items-center justify-between px-7 py-3"
        style={{ borderBottom: "1px solid #252525", backgroundColor: "#111111" }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
        >
          {program.tagline}
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{
            backgroundColor: diffColor + "33",
            color: diffColor,
            border: `1px solid ${diffColor}`,
            fontFamily: "var(--font-inter)",
          }}
        >
          {program.difficulty}
        </span>
      </div>

      {/* Body */}
      <div className="px-7 py-6 flex flex-col gap-4">
        <h2
          className="text-2xl font-bold uppercase leading-tight"
          style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
        >
          {program.name}
        </h2>

        <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          {program.description}
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4">
          {[
            { label: program.ongoing ? "Ongoing" : `${program.totalWeeks} Weeks`, sub: "Duration" },
            { label: program.workouts, sub: "Workouts" },
            { label: program.timePerDay, sub: "Per Day" },
          ].map(({ label, sub }) => (
            <div key={sub} className="flex flex-col gap-0.5">
              <span
                className="text-base font-bold"
                style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
              >
                {label}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                {sub}
              </span>
            </div>
          ))}
        </div>

        {/* Phases */}
        {program.phases.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {program.phases.map((phase) => (
              <span
                key={phase.name}
                className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1"
                style={{
                  color: "#9A9A9A",
                  border: "1px solid #252525",
                  borderRadius: "4px",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {phase.name}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-4 mt-1">
          <Link
            href={`/dashboard/body/programs/${program.slug}`}
            className="flex items-center justify-center px-7 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: isEnrolled ? "transparent" : "#C45B28",
              color: isEnrolled ? "#C45B28" : "#0A0A0A",
              border: isEnrolled ? "1px solid #C45B28" : "none",
              borderRadius: "8px",
              fontFamily: "var(--font-inter)",
              fontWeight: 700,
            }}
          >
            {isEnrolled ? "Continue →" : "View Program"}
          </Link>

          {isEnrolled && enrollment && (
            <span
              className="text-xs"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Week {enrollment.current_week}
              {program.totalWeeks ? ` of ${program.totalWeeks}` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
