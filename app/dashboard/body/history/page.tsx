"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type WorkoutLog = {
  id: string;
  workout_name: string;
  duration_minutes: number;
  exercises_completed: number;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkoutHistoryPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setLogs(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/body"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px" }}
            aria-label="Back to body"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path
                d="M13 4L7 10L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Body
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Workout History
            </h1>
          </div>
        </header>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse"
                style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center gap-4 animate-fade-up">
            <svg viewBox="0 0 48 48" fill="none" width={40} height={40} style={{ color: "#252525" }}>
              <rect x="2" y="18" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
              <rect x="10" y="20" width="4" height="8" rx="0.5" fill="currentColor" />
              <rect x="14" y="22" width="20" height="4" fill="currentColor" />
              <rect x="34" y="20" width="4" height="8" rx="0.5" fill="currentColor" />
              <rect x="38" y="18" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
            </svg>
            <h3
              className="text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Your first workout is waiting.
            </h3>
            <p className="text-sm max-w-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Pick a program and let&apos;s go.
            </p>
            <Link
              href="/dashboard/body"
              className="mt-2 px-8 py-3 text-sm font-semibold uppercase tracking-widest transition-opacity hover:opacity-90 press-scale"
              style={{
                backgroundColor: "#C45B28",
                color: "#0A0A0A",
                borderRadius: "8px",
                fontFamily: "var(--font-inter)",
              }}
            >
              Start Training &rarr;
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-5"
                style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3
                    className="text-base font-bold uppercase leading-tight"
                    style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                  >
                    {log.workout_name}
                  </h3>
                  <span
                    className="text-xs font-semibold uppercase tracking-widest flex-shrink-0"
                    style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                  >
                    {log.duration_minutes} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    {log.exercises_completed} exercise
                    {log.exercises_completed !== 1 ? "s" : ""} completed
                  </p>
                  <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    {formatDate(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}
