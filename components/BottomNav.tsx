"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    label: "Home",
    subtitle: "BM",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M3 12L12 4L21 12V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V12Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Train",
    subtitle: "PB",
    href: "/dashboard/body",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M6 4v16M18 4v16M8 12h8M3 8h3M18 8h3M3 16h3M18 16h3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Fuel",
    subtitle: "FL",
    href: "/dashboard/nutrition",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M12 2C8 6 7 9 9 12c-2-1-3-3-2-5C5 9 4 12 6 15c1 2 3 3 6 3s5-1 6-3c2-3 1-6-1-8-1 2-2 3-3 3 1-2 0-4-2-8z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    label: "Mind",
    subtitle: "MN",
    href: "/dashboard/mind",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M12 4C8.5 4 6 6.5 6 10C6 12 7 13.5 8.5 14.5V17H15.5V14.5C17 13.5 18 12 18 10C18 6.5 15.5 4 12 4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line x1="12" y1="5" x2="12" y2="17" stroke="currentColor" strokeWidth="1.2" />
        <path d="M12 8.5C10.5 8.5 9 9.5 9 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Crew",
    subtitle: "CR",
    href: "/dashboard/crew",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3 20C3 16.5 5.5 14 9 14C10.8 14 12.4 14.7 13.5 15.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M14 19C14 16.5 15.2 15 16 15C18.5 15 20 16.5 20 19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";

  // Train covers: /dashboard/body, /dashboard/library, /dashboard/programs
  if (href === "/dashboard/body") {
    return (
      pathname.startsWith("/dashboard/body") ||
      pathname.startsWith("/dashboard/library") ||
      pathname.startsWith("/dashboard/programs")
    );
  }

  // Fuel covers: /dashboard/nutrition
  if (href === "/dashboard/nutrition") {
    return pathname.startsWith("/dashboard/nutrition");
  }

  // Mind covers: /dashboard/mind, /dashboard/content, /dashboard/meditate
  if (href === "/dashboard/mind") {
    return (
      pathname.startsWith("/dashboard/mind") ||
      pathname.startsWith("/dashboard/content") ||
      pathname.startsWith("/dashboard/meditate")
    );
  }

  // Crew covers: /dashboard/heart, /dashboard/challenges, /dashboard/crew
  if (href === "/dashboard/crew") {
    return (
      pathname.startsWith("/dashboard/heart") ||
      pathname.startsWith("/dashboard/crew") ||
      pathname.startsWith("/dashboard/challenges")
    );
  }

  return pathname.startsWith(href);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        backgroundColor: "#111827",
        borderTop: "1px solid #1f2937",
        height: "64px",
      }}
    >
      {TABS.map(({ label, href, icon }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1"
            style={{
              color: active ? "#f97316" : "#4b5563",
              transition: "color 0.2s ease",
              minWidth: 48,
              minHeight: 48,
              position: "relative",
            }}
          >
            {/* Active indicator dot/line above icon */}
            <div
              style={{
                position: "absolute",
                top: 4,
                left: "50%",
                transform: "translateX(-50%)",
                width: active ? 16 : 0,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: "#f97316",
                transition: "width 0.2s ease",
              }}
            />
            <div style={{ marginTop: 4 }}>
              {icon}
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
