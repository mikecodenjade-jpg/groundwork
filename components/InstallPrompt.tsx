"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/** Key used to persist the user's dismissal in localStorage. */
const DISMISS_KEY = "pwa-install-dismissed";

/**
 * InstallPrompt — shows an "Add to Home Screen" banner when the browser
 * fires `beforeinstallprompt`. Positioned above the BottomNav (bottom: 72px).
 *
 * The banner is hidden if:
 * - The app is already running in standalone mode
 * - The user previously dismissed the banner
 * - The browser hasn't fired `beforeinstallprompt`
 */
export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Check whether the app is already installed / standalone
  const isStandalone = useCallback(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    // Don't show if previously dismissed
    try {
      if (localStorage.getItem(DISMISS_KEY) === "true") return;
    } catch {
      // localStorage unavailable — proceed
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      setVisible(false);
    }
    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // localStorage unavailable
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 72,
        left: 12,
        right: 12,
        zIndex: 9999,
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: 16,
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.5)",
        animation: "slideUp 0.3s ease-out",
        fontFamily: "var(--font-inter, Inter, sans-serif)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: "#C45B28",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>

      {/* Text */}
      <p
        style={{
          flex: 1,
          color: "#E8E2D8",
          fontSize: "13px",
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        Add Groundwork to your home screen for faster access on the jobsite
      </p>

      {/* Install button */}
      <button
        onClick={handleInstall}
        style={{
          flexShrink: 0,
          backgroundColor: "#C45B28",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 10,
          padding: "10px 16px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
          minHeight: 40,
          minWidth: 40,
          whiteSpace: "nowrap",
        }}
      >
        Install
      </button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          color: "#9A9A9A",
          fontSize: "20px",
          cursor: "pointer",
          padding: "4px 8px",
          lineHeight: 1,
          minHeight: 40,
          minWidth: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        &times;
      </button>

      {/* Inline keyframe for slideUp animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Type augmentation for beforeinstallprompt ──────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
