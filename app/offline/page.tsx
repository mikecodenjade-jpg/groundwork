"use client";

import { useState, useEffect } from "react";
import { getCachedData } from "@/lib/offline-cache";

/** Offline fallback page shown when the user has no network connectivity. */
export default function OfflinePage() {
  const [hasCachedData, setHasCachedData] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    // Check if there is any cached user data available
    const profile = getCachedData<Record<string, unknown>>("user-profile");
    const logs = getCachedData<unknown[]>("recent-logs");
    if (profile || (logs && logs.length > 0)) {
      setHasCachedData(true);
    }

    const syncTime = getCachedData<string>("last-sync-time");
    if (syncTime) {
      setLastSync(syncTime);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-inter, Inter, sans-serif)",
      }}
    >
      {/* Wifi-off icon */}
      <div style={{ marginBottom: 24 }}>
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Hard hat shape */}
          <ellipse cx="40" cy="48" rx="30" ry="10" fill="#252525" />
          <path
            d="M14 48C14 48 14 28 40 20C66 28 66 48 66 48"
            stroke="#C45B28"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="12" y="44" width="56" height="8" rx="4" fill="#C45B28" />
          {/* Wifi-off slash */}
          <line
            x1="18"
            y1="62"
            x2="62"
            y2="18"
            stroke="#E8E2D8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Wifi arcs (dimmed) */}
          <path
            d="M24 38C28 34 33 32 40 32C47 32 52 34 56 38"
            stroke="#9A9A9A"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M30 44C33 41 36 40 40 40C44 40 47 41 50 44"
            stroke="#9A9A9A"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "var(--font-oswald, Oswald, sans-serif)",
          fontSize: "32px",
          fontWeight: 700,
          color: "#E8E2D8",
          marginBottom: 12,
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        You&apos;re Offline
      </h1>

      {/* Description */}
      <p
        style={{
          color: "#9A9A9A",
          fontSize: "16px",
          lineHeight: 1.6,
          textAlign: "center",
          maxWidth: 400,
          marginBottom: 32,
        }}
      >
        No signal on the jobsite. Data you&apos;ve already loaded is still
        available. New logs will sync automatically when you&apos;re back online.
      </p>

      {/* Cached data indicator */}
      {hasCachedData && (
        <div
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: 12,
            padding: "16px 24px",
            marginBottom: 24,
            maxWidth: 400,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#4CAF50",
              }}
            />
            <span
              style={{
                color: "#E8E2D8",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Cached Data Available
            </span>
          </div>
          <p style={{ color: "#9A9A9A", fontSize: "13px", margin: 0 }}>
            Your recently viewed data is stored locally and accessible offline.
          </p>
          {lastSync && (
            <p
              style={{
                color: "#9A9A9A",
                fontSize: "12px",
                margin: "8px 0 0 0",
              }}
            >
              Last synced: {lastSync}
            </p>
          )}
        </div>
      )}

      {/* Retry button */}
      <button
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: "#C45B28",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 12,
          padding: "14px 32px",
          fontSize: "16px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
          minHeight: 48,
          minWidth: 48,
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.opacity = "0.85";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.opacity = "1";
        }}
      >
        Try Again
      </button>

      {/* Tip */}
      <p
        style={{
          color: "#9A9A9A",
          fontSize: "13px",
          marginTop: 40,
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        Tip: Open pages while connected to cache them for offline use on the
        jobsite.
      </p>
    </div>
  );
}
