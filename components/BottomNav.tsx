"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const MORE_ITEMS = [
  {
    label: "Heart",
    href: "/dashboard/heart",
    color: "#e05c7a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
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
    href: "/dashboard/lead",
    color: "#f97316",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
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
    href: "/dashboard/coach",
    color: "#c45b28",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
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
    href: "/dashboard/crew",
    color: "#2ab5b5",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
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
    href: "/dashboard/challenges",
    color: "#eab308",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
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
    href: "/dashboard/badges",
    color: "#a855f7",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
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
    label: "Financial",
    href: "/dashboard/financial",
    color: "#22c55e",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 15h4M15 15h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    color: "#9a9a9a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
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

const NAV_TABS = [
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
    href: "/dashboard/fuel",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M12 2C8 6 7 9 9 12c-2-1-3-3-2-5C5 9 4 12 6 15c1 2 3 3 6 3s5-1 6-3c2-3 1-6-1-8-1 2-2 3-3 3 1-2 0-4-2-8z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
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
      </svg>
    ),
  },
];

const MORE_ROUTES = [
  "/dashboard/more",
  "/dashboard/heart",
  "/dashboard/lead",
  "/dashboard/coach",
  "/dashboard/library",
  "/dashboard/settings",
  "/dashboard/crew",
  "/dashboard/challenges",
  "/dashboard/body/measurements",
  "/dashboard/body/devices",
  "/dashboard/badges",
  "/dashboard/financial",
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";

  if (href === "/dashboard/body") {
    return (
      (pathname.startsWith("/dashboard/body") &&
        !pathname.startsWith("/dashboard/body/measurements") &&
        !pathname.startsWith("/dashboard/body/devices")) ||
      pathname.startsWith("/dashboard/train")
    );
  }

  if (href === "/dashboard/fuel") {
    return (
      pathname.startsWith("/dashboard/fuel") ||
      pathname.startsWith("/dashboard/nutrition")
    );
  }

  if (href === "/dashboard/mind") {
    return (
      pathname.startsWith("/dashboard/mind") ||
      pathname.startsWith("/dashboard/content") ||
      pathname.startsWith("/dashboard/meditate")
    );
  }

  return pathname.startsWith(href);
}

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreActive = MORE_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <>
      {/* More full-screen overlay */}
      {moreOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 64,
            zIndex: 40,
            backgroundColor: "#0a0f1a",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              paddingTop: "max(env(safe-area-inset-top, 0px), 16px)",
              borderBottom: "1px solid #1a2332",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#e8e2d8",
                fontFamily: "var(--font-oswald)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              More
            </span>
            <button
              onClick={() => setMoreOpen(false)}
              aria-label="Close menu"
              style={{
                minWidth: 48,
                minHeight: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Menu items */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {MORE_ITEMS.map(({ label, href, color, icon }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "0 24px",
                  minHeight: 64,
                  borderBottom: "1px solid #111827",
                  color: "#e8e2d8",
                  textDecoration: "none",
                }}
              >
                <div style={{ color, flexShrink: 0, display: "flex" }}>
                  {icon}
                </div>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "var(--font-inter)",
                    flex: 1,
                  }}
                >
                  {label}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  width={16}
                  height={16}
                  style={{ color: "#374151", flexShrink: 0 }}
                >
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{
          backgroundColor: "#0a0f1a",
          borderTop: "1px solid #1a2332",
          height: 64,
        }}
      >
        {NAV_TABS.map(({ label, href, icon }) => {
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
                textDecoration: "none",
              }}
            >
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
              <div style={{ marginTop: 4 }}>{icon}</div>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex flex-1 flex-col items-center justify-center gap-1"
          style={{
            color: moreActive || moreOpen ? "#f97316" : "#4b5563",
            transition: "color 0.2s ease",
            minWidth: 48,
            minHeight: 48,
            position: "relative",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              left: "50%",
              transform: "translateX(-50%)",
              width: moreActive || moreOpen ? 16 : 0,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: "#f97316",
              transition: "width 0.2s ease",
            }}
          />
          <div style={{ marginTop: 4 }}>
            <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
              <circle cx="5" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="19" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            More
          </span>
        </button>
      </nav>
    </>
  );
}
