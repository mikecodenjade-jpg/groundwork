"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const EMAIL_TYPE_LABELS: Record<string, string> = {
  weekly_digest: "Weekly Digest",
  tips_content: "Tips & Training Content",
  challenge_updates: "Challenge & Crew Updates",
  all: "all emails",
};

type Status = "idle" | "loading" | "success" | "error";

function UnsubscribeContent() {
  const params = useSearchParams();
  const uid = params.get("uid");
  const type = params.get("type") ?? "all";

  const [status, setStatus] = useState<Status>("idle");

  const typeLabel = EMAIL_TYPE_LABELS[type] ?? "emails";

  useEffect(() => {
    if (!uid) setStatus("error");
  }, [uid]);

  async function handleUnsubscribe() {
    if (!uid) return;
    setStatus("loading");

    const { error } = await supabase.rpc("unsubscribe_email", {
      p_uid: uid,
      p_type: type,
    });

    setStatus(error ? "error" : "success");
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div
        className="w-full max-w-sm flex flex-col gap-7 px-8 py-10"
        style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "16px" }}
      >
        {/* Logo mark */}
        <div className="flex justify-center">
          <span
            className="text-3xl font-bold uppercase tracking-widest"
            style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
          >
            Groundwork
          </span>
        </div>

        {status === "success" ? (
          <>
            <div className="flex flex-col gap-3 text-center">
              <svg
                className="mx-auto"
                viewBox="0 0 48 48"
                fill="none"
                width={48}
                height={48}
                aria-hidden
              >
                <circle cx="24" cy="24" r="24" fill="#1A2A1A" />
                <path
                  d="M14 24.5L21 31.5L34 18"
                  stroke="#4ADE80"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h1
                className="text-2xl font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Unsubscribed
              </h1>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                You&apos;ve been unsubscribed from <strong style={{ color: "#E8E2D8" }}>{typeLabel}</strong>.
                You can update your preferences anytime from account settings.
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="w-full flex items-center justify-center py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
              style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
            >
              Email Preferences
            </Link>
          </>
        ) : status === "error" ? (
          <>
            <div className="flex flex-col gap-3 text-center">
              <h1
                className="text-2xl font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Invalid Link
              </h1>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                This unsubscribe link is invalid or has expired. Log in to manage your email preferences directly.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full flex items-center justify-center py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "8px", fontFamily: "var(--font-inter)", fontWeight: 700 }}
            >
              Sign In
            </Link>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 text-center">
              <h1
                className="text-2xl font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Unsubscribe
              </h1>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                Unsubscribe from <strong style={{ color: "#E8E2D8" }}>{typeLabel}</strong>?
                You can re-enable this anytime from your account settings.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleUnsubscribe}
                disabled={status === "loading" || !uid}
                className="w-full py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "8px", fontFamily: "var(--font-inter)", fontWeight: 700, minHeight: "48px" }}
              >
                {status === "loading" ? "Unsubscribing..." : "Confirm Unsubscribe"}
              </button>
              <Link
                href="/"
                className="w-full flex items-center justify-center py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
                style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
              >
                Cancel
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#0A0A0A" }}
        />
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
