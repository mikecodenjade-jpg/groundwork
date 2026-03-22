"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    label: "Home",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
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
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
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
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
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
    label: "Coach",
    href: "/dashboard/coach",
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
    label: "Heart",
    href: "/dashboard/heart",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
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
    label: "Fuel",
    href: "/dashboard/nutrition",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
        <path
          d="M8 3C8 3 7 5 7 8C7 11 9 13 9 13H15C15 13 17 11 17 8C17 5 16 3 16 3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 13V20H15V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="7" y1="17" x2="17" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Lead",
    href: "/dashboard/lead",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <polygon points="12,5 13.5,12 12,10.5 10.5,12" fill="currentColor" />
        <polygon points="12,19 10.5,12 12,13.5 13.5,12" fill="currentColor" opacity="0.4" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Exact match for /dashboard, prefix match for sub-routes
  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
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
