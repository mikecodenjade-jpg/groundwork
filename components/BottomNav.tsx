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
    label: "Train",
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
    label: "Heart",
    href: "/dashboard/heart",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M12 20C12 20 4 15 4 9.5C4 7 6 5 8.5 5C10 5 11.5 5.8 12 7C12.5 5.8 14 5 15.5 5C18 5 20 7 20 9.5C20 15 12 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Lead",
    href: "/dashboard/lead",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M5 4h4v7l-2-1.5L5 11V4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M5 4h4c0 0 2 0 3.5 1s3.5 1 3.5 1v7c0 0-2 0-3.5-1S9 11 9 11"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    // Train tab covers /dashboard/body, /dashboard/library, /dashboard/nutrition, /dashboard/body/run
    if (href === "/dashboard/body") {
      return (
        pathname.startsWith("/dashboard/body") ||
        pathname.startsWith("/dashboard/library") ||
        pathname.startsWith("/dashboard/nutrition")
      );
    }
    return pathname.startsWith(href);
  }

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
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 transition-opacity"
            style={{
              color: active ? "#C45B28" : "#666666",
              minWidth: 48,
              minHeight: 48,
            }}
          >
            {icon}
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
