"use client";

import Link from "next/link";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

// --------------- Constants ---------------

const BARBELL_WEIGHT = 45;

const PLATE_OPTIONS = [
  { weight: 45, color: "#C45B28", label: "45 lb" },
  { weight: 35, color: "#2A5A8F", label: "35 lb" },
  { weight: 25, color: "#4A8A4A", label: "25 lb" },
  { weight: 10, color: "#8A4A8A", label: "10 lb" },
  { weight: 5, color: "#8A8A2A", label: "5 lb" },
  { weight: 2.5, color: "#5A5A5A", label: "2.5 lb" },
];

// Plate widths (px) — wider = heavier
const PLATE_WIDTHS: Record<number, number> = {
  45: 20,
  35: 17,
  25: 14,
  10: 11,
  5: 9,
  2.5: 7,
};

const PLATE_HEIGHTS: Record<number, number> = {
  45: 100,
  35: 90,
  25: 80,
  10: 64,
  5: 52,
  2.5: 44,
};

// --------------- Helpers ---------------

type PlateCount = { weight: number; count: number };

function calculatePlates(targetWeight: number): {
  plates: PlateCount[];
  perSide: number;
  actualTotal: number;
  error: string | null;
} {
  if (targetWeight < BARBELL_WEIGHT) {
    return { plates: [], perSide: 0, actualTotal: BARBELL_WEIGHT, error: "Target must be at least 45 lbs (barbell weight)." };
  }

  const remainder = (targetWeight - BARBELL_WEIGHT) % 5;
  if (remainder !== 0 && (targetWeight - BARBELL_WEIGHT) % 2.5 !== 0) {
    // Round to nearest achievable
  }

  let perSide = (targetWeight - BARBELL_WEIGHT) / 2;
  const plates: PlateCount[] = [];
  let remaining = perSide;

  for (const option of PLATE_OPTIONS) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / option.weight);
    if (count > 0) {
      plates.push({ weight: option.weight, count });
      remaining = Math.round((remaining - count * option.weight) * 100) / 100;
    }
  }

  const usedPerSide = plates.reduce((sum, p) => sum + p.weight * p.count, 0);
  const actualTotal = BARBELL_WEIGHT + usedPerSide * 2;

  const error = remaining > 0
    ? `Cannot perfectly load ${targetWeight} lbs. Closest achievable: ${actualTotal} lbs.`
    : null;

  return { plates, perSide: usedPerSide, actualTotal, error };
}

function formatBreakdown(plates: PlateCount[]): string {
  if (plates.length === 0) return "No plates needed";
  return plates.map((p) => `${p.count}x${p.weight}`).join(" + ");
}

// --------------- Component ---------------

export default function PlateCalculatorPage() {
  const [target, setTarget] = useState<string>("");

  const targetNum = parseFloat(target);
  const hasInput = target !== "" && !isNaN(targetNum);
  const result = hasInput ? calculatePlates(targetNum) : null;

  // Build flat plate list for visual
  const flatPlates: number[] = [];
  if (result) {
    for (const p of result.plates) {
      for (let i = 0; i < p.count; i++) {
        flatPlates.push(p.weight);
      }
    }
  }

  const plateColor = (w: number) => PLATE_OPTIONS.find((p) => p.weight === w)?.color ?? "#5A5A5A";

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
              PLATE CALCULATOR
            </h1>
          </div>
        </header>

        {/* Input */}
        <section
          className="p-6"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
        >
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Target Weight
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={45}
              step={2.5}
              placeholder="e.g. 225"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-4 py-3 text-lg"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "8px",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
              }}
            />
            <span
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              lbs
            </span>
          </div>
          <p className="mt-3 text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Standard barbell = 45 lbs. Plates shown are PER SIDE of the bar.
          </p>
        </section>

        {/* Error */}
        {hasInput && targetNum < BARBELL_WEIGHT && (
          <div
            className="p-4 text-sm"
            style={{
              backgroundColor: "#2A1515",
              border: "1px solid #5A2525",
              borderRadius: "12px",
              color: "#E8A0A0",
              fontFamily: "var(--font-inter)",
            }}
          >
            Target must be at least 45 lbs (the barbell alone weighs 45 lbs).
          </div>
        )}

        {/* Results */}
        {result && targetNum >= BARBELL_WEIGHT && (
          <>
            {/* Summary card */}
            <section
              className="p-6"
              style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
            >
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Breakdown
              </p>

              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className="text-3xl font-bold"
                  style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                >
                  {result.actualTotal} lbs
                </span>
                <span className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  total loaded
                </span>
              </div>

              <p className="text-sm mb-4" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                {result.perSide} lbs per side &middot; {formatBreakdown(result.plates)} per side
              </p>

              {result.error && (
                <p className="text-xs" style={{ color: "#E8A0A0", fontFamily: "var(--font-inter)" }}>
                  {result.error}
                </p>
              )}
            </section>

            {/* Barbell visualization */}
            <section
              className="p-6"
              style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
            >
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-6"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Barbell View
              </p>

              <div className="flex items-center justify-center gap-0 overflow-x-auto py-4">
                {/* Left collar */}
                <div
                  style={{
                    width: 6,
                    height: 28,
                    backgroundColor: "#6A6A6A",
                    borderRadius: "2px 0 0 2px",
                  }}
                />

                {/* Left plates (reversed so heaviest is closest to center visually) */}
                <div className="flex items-center gap-[2px]">
                  {[...flatPlates].reverse().map((w, i) => (
                    <div
                      key={`left-${i}`}
                      title={`${w} lb`}
                      style={{
                        width: PLATE_WIDTHS[w],
                        height: PLATE_HEIGHTS[w],
                        backgroundColor: plateColor(w),
                        borderRadius: "3px",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>

                {/* Sleeve + bar */}
                <div className="flex items-center">
                  <div style={{ width: 12, height: 24, backgroundColor: "#4A4A4A", borderRadius: "2px" }} />
                  <div style={{ width: 80, height: 10, backgroundColor: "#4A4A4A" }} />
                  <div style={{ width: 12, height: 24, backgroundColor: "#4A4A4A", borderRadius: "2px" }} />
                </div>

                {/* Right plates */}
                <div className="flex items-center gap-[2px]">
                  {flatPlates.map((w, i) => (
                    <div
                      key={`right-${i}`}
                      title={`${w} lb`}
                      style={{
                        width: PLATE_WIDTHS[w],
                        height: PLATE_HEIGHTS[w],
                        backgroundColor: plateColor(w),
                        borderRadius: "3px",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>

                {/* Right collar */}
                <div
                  style={{
                    width: 6,
                    height: 28,
                    backgroundColor: "#6A6A6A",
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              </div>

              {/* Plate legend */}
              <div className="flex flex-wrap gap-3 mt-6 justify-center">
                {PLATE_OPTIONS.map((p) => (
                  <div key={p.weight} className="flex items-center gap-1.5">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: p.color,
                        borderRadius: "2px",
                      }}
                    />
                    <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Per-plate detail */}
            {result.plates.length > 0 && (
              <section
                className="p-6"
                style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
              >
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                  style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                >
                  Plates Per Side
                </p>

                <div className="flex flex-col gap-2">
                  {result.plates.map((p) => (
                    <div
                      key={p.weight}
                      className="flex items-center justify-between px-4 py-3"
                      style={{
                        backgroundColor: "#1A1A1A",
                        borderRadius: "8px",
                        border: "1px solid #252525",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: plateColor(p.weight),
                            borderRadius: "3px",
                          }}
                        />
                        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                          {p.weight} lb
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                      >
                        x{p.count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Empty state */}
        {!hasInput && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg width={48} height={48} viewBox="0 0 48 48" fill="none" className="mb-4 opacity-30">
              <rect x="4" y="18" width="40" height="12" rx="2" stroke="#9A9A9A" strokeWidth="2" />
              <rect x="10" y="10" width="8" height="28" rx="2" stroke="#9A9A9A" strokeWidth="2" />
              <rect x="30" y="10" width="8" height="28" rx="2" stroke="#9A9A9A" strokeWidth="2" />
            </svg>
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Enter a target weight to see the plate breakdown.
            </p>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
