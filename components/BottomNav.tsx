"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    label: "Home",
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
    label: "Body",
    href: "/dashboard/body",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <rect x="1" y="10" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="5" y="11" width="2" height="2" rx="0.25" fill="currentColor" />
        <rect x="7" y="11.5" width="10" height="1" fill="currentColor" />
        <rect x="17" y="11" width="2" height="2" rx="0.25" fill="currentColor" />
        <rect x="19" y="10" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    label: "Mind",
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
        <path d="M12 12C13.5 12 15 11 15 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Social",
    href: "/dashboard/heart",
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
  {
    label: "Learn",
    href: "/dashboard/lead",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M4 4H14C14 4 15 4 15 5V19C15 20 14 20 14 20H4V4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M15 6H18C19 6 20 7 20 7V19C20 20 19 20 19 20H14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <line x1="7" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";

  // Body covers: /dashboard/body, /dashboard/library, /dashboard/nutrition, /dashboard/body/*
  if (href === "/dashboard/body") {
    return (
      pathname.startsWith("/dashboard/body") ||
      pathname.startsWith("/dashboard/library") ||
      pathname.startsWith("/dashboard/nutrition")
    );
  }

  // Mind covers: /dashboard/mind, /dashboard/content
  if (href === "/dashboard/mind") {
    return (
      pathname.startsWith("/dashboard/mind") ||
      pathname.startsWith("/dashboard/content")
    );
  }

  // Social covers: /dashboard/heart, /dashboard/challenges, /dashboard/crew
  if (href === "/dashboard/heart") {
    return (
      pathname.startsWith("/dashboard/heart") ||
      pathname.startsWith("/dashboard/challenges") ||
      pathname.startsWith("/dashboard/crew")
    );
  }

  // Learn covers: /dashboard/lead, /dashboard/mind/content, /dashboard/library (content library)
  if (href === "/dashboard/lead") {
    return pathname.startsWith("/dashboard/lead");
  }

  return pathname.startsWith(href);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        backgroundColor: "#111111",
        borderTop: "1px solid #1E1E1E",
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
              color: active ? "#C45B28" : "#666666",
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
                backgroundColor: "#C45B28",
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
