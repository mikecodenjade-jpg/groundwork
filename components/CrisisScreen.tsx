"use client";

import { useState, useEffect, useRef } from "react";

interface CrisisScreenProps {
  onDismiss: () => void;
}

// ─── Crisis resources are HARDCODED ────────────────────────────────────────────
// These render even during total server outage or offline mode.
// Do NOT make these configurable or fetched from any server.

const PHONE_ICON = (
  <svg viewBox="0 0 20 20" fill="currentColor" width={20} height={20} aria-hidden>
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
  </svg>
);

const MESSAGE_ICON = (
  <svg viewBox="0 0 20 20" fill="currentColor" width={20} height={20} aria-hidden>
    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
  </svg>
);

export default function CrisisScreen({ onDismiss }: CrisisScreenProps) {
  const [visible, setVisible] = useState(false);
  const touchStartY = useRef<number>(0);

  // Fade in on next frame
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Lock body scroll while overlay is showing
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80) onDismiss();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crisis support resources"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        backgroundColor: "#1B7A9C",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 28px 56px",
        overflowY: "auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      {/* Swipe hint */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.3)",
        }}
        aria-hidden
      />

      <div
        style={{
          maxWidth: 400,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          textAlign: "center",
        }}
      >
        {/* Heading */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
            }}
          >
            Crisis Support
          </p>
          <h1
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: 42,
              fontWeight: 700,
              color: "#ffffff",
              textTransform: "uppercase",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            You Are Not Alone.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 15,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.6,
            }}
          >
            Trained crisis counselors are standing by right now — free, confidential,
            and available 24/7.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>

          {/* 988 — primary */}
          <a
            href="tel:988"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              minHeight: 64,
              backgroundColor: "#ffffff",
              color: "#1B7A9C",
              borderRadius: 12,
              fontFamily: "var(--font-inter)",
              fontSize: 16,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {PHONE_ICON}
            Call 988 — Suicide &amp; Crisis Lifeline
          </a>

          {/* Crisis Text Line */}
          <a
            href="sms:741741?body=HOME"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              minHeight: 60,
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              border: "2px solid rgba(255,255,255,0.4)",
              borderRadius: 12,
              fontFamily: "var(--font-inter)",
              fontSize: 15,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {MESSAGE_ICON}
            Text HOME to 741741
          </a>

          {/* SAMHSA */}
          <a
            href="tel:18006624357"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              minHeight: 60,
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              border: "2px solid rgba(255,255,255,0.4)",
              borderRadius: 12,
              fontFamily: "var(--font-inter)",
              fontSize: 15,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {PHONE_ICON}
            SAMHSA 1-800-662-4357
          </a>
        </div>

        {/* Footer */}
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.6,
          }}
        >
          These conversations are free, confidential, and available 24/7.
        </p>

        {/* Swipe hint text */}
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            marginTop: 8,
          }}
        >
          Swipe down to return
        </p>
      </div>
    </div>
  );
}
