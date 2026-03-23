"use client";

import Link from "next/link";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

// --------------- Constants ---------------

const PERCENTAGE_TABLE = [
  { pct: 100, label: "1RM (Max)" },
  { pct: 95, label: "Heavy Singles" },
  { pct: 90, label: "Heavy Work" },
  { pct: 85, label: "Strength Work" },
  { pct: 80, label: "Hypertrophy Top" },
  { pct: 75, label: "Hypertrophy" },
  { pct: 70, label: "Volume Work" },
  { pct: 65, label: "Moderate Volume" },
  { pct: 60, label: "Deload" },
];

// --------------- Helpers ---------------

function calcEpley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// --------------- Component ---------------

export default function OneRepMaxCalculatorPage() {
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");

  const weightNum = parseFloat(weight);
  const repsNum = parseInt(reps, 10);

  const validWeight = !isNaN(weightNum) && weightNum > 0;
  const validReps = !isNaN(repsNum) && repsNum >= 1 && repsNum <= 30;
  const hasResult = validWeight && validReps;

  const oneRM = hasResult ? calcEpley(weightNum, repsNum) : 0;

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
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              1RM CALCULATOR
            </h1>
          </div>
        </header>

        {/* Inputs */}
        <section
          className="p-6"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
        >
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Your Lift
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Weight Lifted (lbs)
              </label>
              <input
                type="number"
                min={1}
                step={0.5}
                placeholder="e.g. 185"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 text-lg"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "8px",
                  color: "#E8E2D8",
                  fontFamily: "var(--font-inter)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Reps Completed
              </label>
              <input
                type="number"
                min={1}
                max={30}
                step={1}
                placeholder="e.g. 5"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full px-4 py-3 text-lg"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "8px",
                  color: "#E8E2D8",
                  fontFamily: "var(--font-inter)",
                }}
              />
              {reps !== "" && !validReps && (
                <p className="mt-1.5 text-xs" style={{ color: "#E8A0A0", fontFamily: "var(--font-inter)" }}>
                  Reps must be between 1 and 30 (Epley formula breaks down above 30).
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 1RM Result */}
        {hasResult && (
          <>
            <section
              className="p-6 text-center"
              style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
            >
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-3"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Estimated 1 Rep Max
              </p>
              <p
                className="text-6xl font-bold leading-none mb-1"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                {Math.round(oneRM)}
              </p>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                lbs
              </p>
              <p className="text-xs mt-4" style={{ color: "#6A6A6A", fontFamily: "var(--font-inter)" }}>
                Based on {weightNum} lbs x {repsNum} rep{repsNum > 1 ? "s" : ""}
              </p>
            </section>

            {/* Percentage table */}
            <section
              className="overflow-hidden"
              style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
            >
              <div className="px-6 pt-6 pb-4">
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase"
                  style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                >
                  Percentage Chart
                </p>
              </div>

              <div>
                {PERCENTAGE_TABLE.map((row, idx) => {
                  const w = Math.round(oneRM * (row.pct / 100));
                  const isEven = idx % 2 === 0;
                  return (
                    <div
                      key={row.pct}
                      className="flex items-center justify-between px-6 py-3.5"
                      style={{
                        backgroundColor: isEven ? "#1A1A1A" : "#161616",
                        borderTop: idx === 0 ? "1px solid #252525" : "none",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm font-bold w-12"
                          style={{
                            color: row.pct === 100 ? "#C45B28" : "#E8E2D8",
                            fontFamily: "var(--font-oswald)",
                          }}
                        >
                          {row.pct}%
                        </span>
                        <span
                          className="text-xs uppercase tracking-wider"
                          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                        >
                          {row.label}
                        </span>
                      </div>
                      <span
                        className="text-lg font-bold"
                        style={{
                          fontFamily: "var(--font-oswald)",
                          color: row.pct === 100 ? "#C45B28" : "#E8E2D8",
                        }}
                      >
                        {w} <span className="text-xs font-normal" style={{ color: "#9A9A9A" }}>lbs</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Note */}
            <p className="text-xs text-center" style={{ color: "#6A6A6A", fontFamily: "var(--font-inter)" }}>
              Based on the Epley formula. Use as a guide — actual 1RM may vary.
            </p>
          </>
        )}

        {/* Empty state */}
        {!hasResult && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg width={48} height={48} viewBox="0 0 48 48" fill="none" className="mb-4 opacity-30">
              <circle cx="24" cy="24" r="20" stroke="#9A9A9A" strokeWidth="2" />
              <path d="M24 14V26" stroke="#9A9A9A" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 26H30" stroke="#9A9A9A" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Enter weight and reps to estimate your one-rep max.
            </p>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
