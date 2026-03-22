"use client";

import Link from "next/link";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

const CATEGORIES = [
  {
    slug: "running",
    title: "Running",
    desc: "Endurance, speed work, and trail conditioning.",
  },
  {
    slug: "weightlifting",
    title: "Weightlifting",
    desc: "Strength, powerlifting, and Olympic lifts.",
  },
  {
    slug: "bodybuilding",
    title: "Bodybuilding",
    desc: "Hypertrophy, aesthetics, and muscle-building splits.",
  },
  {
    slug: "hybrid-functional",
    title: "Hybrid / Functional",
    desc: "CrossFit-style circuits, HIIT, and mixed conditioning.",
  },
  {
    slug: "calisthenics",
    title: "Calisthenics",
    desc: "Bodyweight progressions, skills, and relative strength.",
  },
  {
    slug: "mobility-recovery",
    title: "Mobility & Recovery",
    desc: "Stretching, yoga flows, and foam rolling protocols.",
  },
  {
    slug: "bodyweight",
    title: "Bodyweight",
    desc: "No equipment needed. Train anywhere — hotel, jobsite, home. Pure body control.",
  },
  {
    slug: "rucking",
    title: "Rucking",
    desc: "Weighted walks and military-style endurance training.",
  },
];

export default function BodyPage() {
  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #2A2A2A", color: "#7A7268" }}
            aria-label="Back to dashboard"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path
                d="M13 4L7 10L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
            >
              Pillar
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Body
            </h1>
          </div>
        </header>

        <div>
          <h2
            className="text-2xl font-bold uppercase mb-1"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Choose Your Discipline.
          </h2>
          <p className="text-sm" style={{ color: "#7A7268" }}>
            Pick the training style that fits where you are today.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>

      </div>
      <BottomNav />
    </main>
  );
}

function CategoryCard({
  slug,
  title,
  desc,
}: {
  slug: string;
  title: string;
  desc: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/dashboard/body/${slug}`}
      className="flex flex-col gap-3 px-7 py-6 transition-all duration-150 active:scale-[0.98]"
      style={{
        backgroundColor: hovered ? "#161616" : "#111111",
        border: `1px solid ${hovered ? "#C45B28" : "#1E1E1E"}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h3
        className="text-xl font-bold uppercase tracking-wide"
        style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
        {desc}
      </p>
      <span
        className="text-xs font-semibold uppercase tracking-widest mt-1 self-start"
        style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
      >
        View Workouts &rsaquo;
      </span>
    </Link>
  );
}
