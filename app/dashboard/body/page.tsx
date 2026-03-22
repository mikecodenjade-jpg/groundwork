"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const TIME_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
];

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

// Maps the interest label stored in Supabase to a category slug
const INTEREST_TO_SLUG: Record<string, string> = {
  "Running": "running",
  "Weightlifting": "weightlifting",
  "Bodybuilding": "bodybuilding",
  "Hybrid / Functional": "hybrid-functional",
  "Calisthenics": "calisthenics",
  "Mobility & Recovery": "mobility-recovery",
  "Rucking": "rucking",
  "Bodyweight": "bodyweight",
};

export default function BodyPage() {
  const [visibleCategories, setVisibleCategories] = useState(CATEGORIES);
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);

  useEffect(() => {
    async function loadInterests() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_profiles")
        .select("interests")
        .eq("id", user.id)
        .single();

      const interests: string[] | null = data?.interests;

      if (!interests || interests.length === 0) {
        setFallback(true);
        setVisibleCategories(CATEGORIES);
      } else {
        const slugs = new Set(
          interests.map((i) => INTEREST_TO_SLUG[i]).filter(Boolean)
        );
        const filtered = CATEGORIES.filter((c) => slugs.has(c.slug));
        // If none of their interests map to a body discipline, show all
        setVisibleCategories(filtered.length > 0 ? filtered : CATEGORIES);
        setFallback(filtered.length === 0);
      }

      setLoading(false);
    }
    loadInterests();
  }, []);

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

        {/* Time selector */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-5"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            How much time do you have?
          </p>
          <div className="flex flex-wrap gap-3">
            {TIME_OPTIONS.map(({ label, value }) => {
              const active = selectedTime === value;
              return (
                <button
                  key={value}
                  onClick={() => setSelectedTime(active ? null : value)}
                  className="px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
                  style={{
                    fontFamily: "var(--font-oswald)",
                    backgroundColor: active ? "#C45B28" : "#141414",
                    color: active ? "#0A0A0A" : "#E8E2D8",
                    border: `1px solid ${active ? "#C45B28" : "#2A2A2A"}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <div>
          <h2
            className="text-2xl font-bold uppercase mb-1"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Choose Your Discipline.
          </h2>
          <p className="text-sm" style={{ color: "#7A7268" }}>
            {fallback
              ? "Select your interests in Settings to personalize this page."
              : "Pick the training style that fits where you are today."}
          </p>
        </div>

        {/* Workout History link */}
        <Link
          href="/dashboard/body/history"
          className="flex items-center justify-between px-6 py-4 transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}
        >
          <span
            className="text-sm font-bold uppercase tracking-wide"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Workout History
          </span>
          <span style={{ color: "#C45B28" }}>›</span>
        </Link>

        {/* Category grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse"
                style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleCategories.map((cat) => (
              <CategoryCard key={cat.slug} {...cat} selectedTime={selectedTime} />
            ))}
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

function CategoryCard({
  slug,
  title,
  desc,
  selectedTime,
}: {
  slug: string;
  title: string;
  desc: string;
  selectedTime: number | null;
}) {
  const [hovered, setHovered] = useState(false);
  const href = selectedTime
    ? `/dashboard/body/${slug}?time=${selectedTime}`
    : `/dashboard/body/${slug}`;

  return (
    <Link
      href={href}
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
