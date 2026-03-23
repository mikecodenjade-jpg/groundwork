"use client";

import { useState, useEffect } from "react";

/**
 * OfflineIndicator — shows a small fixed banner at the top of the screen
 * when the user loses network connectivity. Automatically hides when
 * connectivity is restored.
 */
export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Set initial state
    setOffline(!navigator.onLine);

    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        backgroundColor: "#1A0A00",
        borderBottom: "1px solid #3A1A00",
        padding: "8px 16px",
        textAlign: "center",
        fontSize: "13px",
        fontWeight: 500,
        color: "#C45B28",
        fontFamily: "var(--font-inter, Inter, sans-serif)",
        transform: offline ? "translateY(0)" : "translateY(-100%)",
        opacity: offline ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
        pointerEvents: offline ? "auto" : "none",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Small wifi-off icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        Offline &mdash; changes will sync when connected
      </span>
    </div>
  );
}
