"use client";

import { useEffect } from "react";

/**
 * PWAInit — invisible component that registers the service worker
 * and dispatches online/offline custom events for the rest of the app.
 *
 * Mount once in the root layout. Renders nothing.
 */
export default function PWAInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // ─── Register service worker ───────────────────────────────────────
    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        registration = reg;

        // Check for SW updates periodically (every 60 minutes)
        const interval = setInterval(() => {
          reg.update().catch(() => {});
        }, 60 * 60 * 1000);

        // Listen for a new SW waiting to activate
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new version is available — dispatch custom event
              window.dispatchEvent(
                new CustomEvent("sw-update-available", {
                  detail: { registration: reg },
                })
              );
            }
          });
        });

        return () => clearInterval(interval);
      })
      .catch(() => {
        // SW registration failed — app still works without it
      });

    // ─── Online / offline event forwarding ─────────────────────────────
    const handleOnline = () => {
      window.dispatchEvent(new CustomEvent("app-online"));
    };
    const handleOffline = () => {
      window.dispatchEvent(new CustomEvent("app-offline"));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      // Registration object is kept alive — no need to unregister on unmount
      void registration;
    };
  }, []);

  return null;
}
