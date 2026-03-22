"use client";

import Link from "next/link";
import { useState } from "react";
import DemoBanner from "@/components/DemoBanner";

const PILLARS = [
  {
    title: "Body",
    href: "/demo/body",
    desc: "Strength, recovery, and physical readiness for the demands of the field.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        <rect x="2" y="16" width="6" height="8" rx="1" fill="currentColor" />
        <rect x="8" y="18" width="4" height="4" rx="0.5" fill="currentColor" />
        <rect x="12" y="19" width="16" height="2" fill="currentColor" />
        <rect x="28" y="18" width="4" height="4" rx="0.5" fill="currentColor" />
        <rect x="32" y="16" width="6" height="8" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Mind",
    href: "/demo/mind",
    desc: "Mental clarity, stress management, and focus under pressure.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        <path
          d="M20 8C14 8 9 12.5 9 18c0 3 1.5 5.5 4 7v5h14v-5c2.5-1.5 4-4 4-7 0-5.5-5-10-11-10z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <line x1="20" y1="10" x2="20" y2="30" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 15 C17 15 14 17 14 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M20 21 C23 21 26 19 26 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    title: "Heart",
    href: "/demo/heart",
    desc: "Relationships, purpose, and the resilience to show up whole.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        <path
          d="M20 34 C20 34 6 25 6 15.5 C6 11 9.5 8 13.5 8 C16.5 8 19 9.5 20 11 C21 9.5 23.5 8 26.5 8 C30.5 8 34 11 34 15.5 C34 25 20 34 20 34Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Lead",
    href: "/demo/lead",
    desc: "Culture, communication, and the skills that make crews into teams.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="2" />
        <polygon points="20,9 23,20 20,17 17,20" fill="currentColor" />
        <polygon points="20,31 17,20 20,23 23,20" fill="currentColor" opacity="0.4" />
        <circle cx="20" cy="20" r="2" fill="currentColor" />
      </svg>
    ),
  },
];

function PillarCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      className="p-8 flex flex-col gap-5 transition-all duration-150 active:scale-[0.98]"
      style={{
        backgroundColor: "#161616",
        border: `1px solid ${hovered ? "#C45B28" : "#252525"}`,
        borderRadius: "12px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ color: "#C45B28" }}>{icon}</span>
      <div>
        <h2
          className="text-2xl font-bold uppercase tracking-wide mb-2"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          {title}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          {desc}
        </p>
      </div>
    </Link>
  );
}

export default function DemoDashboard() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <DemoBanner />

      <div className="px-6 py-10">
        {/* Top bar */}
        <header className="flex items-center justify-between max-w-5xl w-full mx-auto mb-16">
          <Link
            href="/"
            className="text-xs font-semibold tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Build My Groundwork
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold uppercase tracking-widest px-5 py-2 transition-opacity hover:opacity-60"
            style={{
              color: "#9A9A9A",
              border: "1px solid #252525",
              borderRadius: "8px",
              fontFamily: "var(--font-inter)",
            }}
          >
            Sign Up Free
          </Link>
        </header>

        <div className="max-w-5xl w-full mx-auto flex flex-col gap-16 pb-16">

          {/* Greeting */}
          <section>
            <h1
              className="text-5xl md:text-6xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Good Morning, Guest.
            </h1>
            <p className="mt-3 text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              <span style={{ color: "#9A9A9A" }}>Demo Mode</span> · Sign up to save your progress
            </p>

            {/* Streak — sample data */}
            <div className="mt-6 flex items-center gap-4">
              <span
                className="text-5xl font-bold leading-none"
                style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
              >
                0
              </span>
              <div>
                <p
                  className="text-sm font-bold uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                >
                  Day Streak
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Log a workout or check-in to start your streak.
                </p>
              </div>
            </div>
          </section>

          {/* Pillar cards */}
          <section>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Choose Your Pillar
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PILLARS.map((pillar) => (
                <PillarCard key={pillar.title} {...pillar} />
              ))}
            </div>
          </section>

          {/* CTA */}
          <section
            className="px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
          >
            <div>
              <p
                className="text-lg font-bold uppercase mb-1"
                style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
              >
                Ready to make it yours?
              </p>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Sign up free. No credit card. Your data saves. Your streak starts.
              </p>
            </div>
            <Link
              href="/login"
              className="flex-shrink-0 px-8 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#C45B28",
                color: "#0A0A0A",
                borderRadius: "8px",
                fontFamily: "var(--font-inter)",
                fontWeight: 600,
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
              }}
            >
              Start Free
            </Link>
          </section>

        </div>
      </div>
    </main>
  );
}
