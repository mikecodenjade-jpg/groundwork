"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";

type MenuItem = {
  label: string;
  description: string;
  href: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Heart",
    description: "Relationships, journal, gratitude, tonight's play",
    href: "/dashboard/heart",
    color: "#e05c7a",
    bg: "#1a0a10",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
        <path
          d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 14 21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Lead",
    description: "Leadership challenges, crew scripts, transition plan",
    href: "/dashboard/lead",
    color: "#f97316",
    bg: "#1a0c00",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
        <path
          d="M12 2L14.5 9H21L15.5 13.5L17.5 20.5L12 16L6.5 20.5L8.5 13.5L3 9H9.5L12 2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Coach",
    description: "AI chat — get answers, training advice, accountability",
    href: "/dashboard/coach",
    color: "#c45b28",
    bg: "#1a0a00",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
        <path
          d="M4 4h16c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1H8l-4 4V5c0-.55.45-1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="8" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Crew Wall",
    description: "Your people — share wins, stay connected",
    href: "/dashboard/crew",
    color: "#2ab5b5",
    bg: "#001a1a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
        <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M3 19C3 16.2 5.7 14 9 14C12.3 14 15 16.2 15 19"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M17 14C19.2 14 21 15.8 21 18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Challenges",
    description: "Team competitions and personal targets",
    href: "/dashboard/challenges",
    color: "#eab308",
    bg: "#1a1400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
        <path
          d="M8 6h8v8a4 4 0 01-8 0V6z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M8 10H5a1 1 0 00-1 1v2a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M16 10h3a1 1 0 011 1v2a1 1 0 01-1 1h-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 18v3M9 21h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Badges",
    description: "Earned achievements and milestones",
    href: "/dashboard/badges",
    color: "#a855f7",
    bg: "#0f0a1a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
        <path
          d="M12 2L4 5.5V12c0 4.5 3.5 8 8 10 4.5-2 8-5.5 8-10V5.5L12 2z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    description: "Account, notifications, preferences",
    href: "/dashboard/settings",
    color: "#9a9a9a",
    bg: "#141414",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function MorePage() {
  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0a0f1a", color: "#E8E2D8" }}
    >
      <header className="max-w-2xl w-full mx-auto mb-8">
        <p
          className="text-xs font-semibold tracking-[0.3em] uppercase mb-4"
          style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}
        >
          Groundwork
        </p>
        <h1
          className="text-3xl font-bold uppercase"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          More
        </h1>
      </header>

      <div className="max-w-2xl w-full mx-auto flex flex-col gap-2 pb-28">
        {MENU_ITEMS.map(({ label, description, href, color, bg, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-4 py-4 transition-all duration-150 hover:opacity-80 active:scale-[0.99]"
            style={{
              backgroundColor: "#0f1623",
              border: "1px solid #1a2332",
              borderRadius: "12px",
            }}
          >
            <div
              className="w-10 h-10 shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: bg,
                border: `1px solid ${color}44`,
                borderRadius: "10px",
                color,
              }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold leading-tight"
                style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
              >
                {label}
              </p>
              <p
                className="text-xs mt-0.5 leading-snug"
                style={{ color: "#6b7280", fontFamily: "var(--font-inter)" }}
              >
                {description}
              </p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" width={16} height={16} style={{ color: "#374151", flexShrink: 0 }}>
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
