"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrendsData = {
  sentiment_over_time: Array<{ date: string; score: number }>;
  emotion_frequency: Array<{ emotion: string; count: number }>;
  trajectory: "improving" | "declining" | "stable";
  workout_mood_correlation: number | null;
  average_score: number;
  total_entries: number;
};

type Period = "week" | "month" | "quarter";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MoodTrendsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "mood-trends",
        { body: { period, user_id: user.id } }
      );

      if (fnError || !result) {
        setError(true);
        setLoading(false);
        return;
      }

      setData(result as TrendsData);
      setLoading(false);
    }
    load();
  }, [period, router]);

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-28">
        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/mind"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{
              border: "1px solid #252525",
              color: "#9A9A9A",
              borderRadius: "8px",
            }}
            aria-label="Back to mind"
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
              Mind
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{
                fontFamily: "var(--font-oswald)",
                color: "#E8E2D8",
              }}
            >
              Mood Trends
            </h1>
          </div>
        </header>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(["week", "month", "quarter"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-150"
              style={{
                fontFamily: "var(--font-inter)",
                borderRadius: "8px",
                ...(period === p
                  ? { backgroundColor: "#C45B28", color: "#0A0A0A" }
                  : {
                      border: "1px solid #252525",
                      color: "#9A9A9A",
                      backgroundColor: "transparent",
                    }),
              }}
            >
              {p === "week" ? "Week" : p === "month" ? "Month" : "Quarter"}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && !loading && (
          <div
            className="px-6 py-5 text-sm"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            Unable to load mood trends. Try again later.
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col gap-6">
            <div
              className="h-24 animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
            <div
              className="h-52 animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
            <div
              className="h-40 animate-pulse rounded-xl"
              style={{ backgroundColor: "#161616" }}
            />
          </div>
        )}

        {/* Data Sections */}
        {!loading && !error && data && (
          <>
            {/* Trajectory Card */}
            <TrajectoryCard
              trajectory={data.trajectory}
              averageScore={data.average_score}
              totalEntries={data.total_entries}
            />

            {/* Sentiment Over Time */}
            <section>
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                style={{
                  color: "#C45B28",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Sentiment Over Time
              </p>
              {data.sentiment_over_time.length === 0 ? (
                <div
                  className="px-6 py-10 text-center text-sm"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "12px",
                    color: "#9A9A9A",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  No data yet. Check in daily to see your trends.
                </div>
              ) : (
                <SentimentChart points={data.sentiment_over_time} />
              )}
            </section>

            {/* Emotion Frequency */}
            {data.emotion_frequency.length > 0 && (
              <section>
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                  style={{
                    color: "#C45B28",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  What&apos;s Showing Up
                </p>
                <EmotionBars emotions={data.emotion_frequency.slice(0, 8)} />
              </section>
            )}

            {/* Workout-Mood Correlation */}
            {data.workout_mood_correlation !== null && (
              <CorrelationCard value={data.workout_mood_correlation} />
            )}
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

// ─── Trajectory Card ──────────────────────────────────────────────────────────

function TrajectoryCard({
  trajectory,
  averageScore,
  totalEntries,
}: {
  trajectory: "improving" | "declining" | "stable";
  averageScore: number;
  totalEntries: number;
}) {
  const config = {
    improving: { label: "Improving", color: "#2A6A4A", bg: "#0F1F15" },
    stable: { label: "Stable", color: "#9A9A9A", bg: "#161616" },
    declining: { label: "Declining", color: "#5A1A1A", bg: "#1A0F0F" },
  }[trajectory];

  return (
    <div
      className="px-7 py-6 flex flex-col gap-4"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.color}`,
        borderRadius: "12px",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Arrow icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: config.color }}
        >
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
            {trajectory === "improving" ? (
              <path
                d="M10 15V5M10 5L5 10M10 5L15 10"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : trajectory === "declining" ? (
              <path
                d="M10 5V15M10 15L5 10M10 15L15 10"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M4 10H16"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
        <div>
          <p
            className="text-xl font-bold uppercase"
            style={{
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
            }}
          >
            {config.label}
          </p>
          <p
            className="text-xs"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            Overall trajectory
          </p>
        </div>
      </div>
      <div
        className="flex gap-6 pt-3"
        style={{ borderTop: "1px solid #252525" }}
      >
        <div>
          <p
            className="text-2xl font-bold"
            style={{
              color: "#C45B28",
              fontFamily: "var(--font-oswald)",
            }}
          >
            {averageScore.toFixed(2)}
          </p>
          <p
            className="text-xs uppercase tracking-widest"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            Avg Score
          </p>
        </div>
        <div>
          <p
            className="text-2xl font-bold"
            style={{
              color: "#C45B28",
              fontFamily: "var(--font-oswald)",
            }}
          >
            {totalEntries}
          </p>
          <p
            className="text-xs uppercase tracking-widest"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            Entries
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SVG Sentiment Chart ──────────────────────────────────────────────────────

function SentimentChart({
  points,
}: {
  points: Array<{ date: string; score: number }>;
}) {
  const W = 600;
  const H = 200;
  const PAD_X = 40;
  const PAD_TOP = 16;
  const PAD_BOT = 32;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_TOP - PAD_BOT;

  function toX(i: number): number {
    if (points.length === 1) return PAD_X + chartW / 2;
    return PAD_X + (i / (points.length - 1)) * chartW;
  }

  function toY(score: number): number {
    // score ranges from -1 to 1, map to chartH
    const normalized = (score + 1) / 2; // 0..1
    return PAD_TOP + chartH - normalized * chartH;
  }

  const linePoints = points
    .map((p, i) => `${toX(i)},${toY(p.score)}`)
    .join(" ");

  // Area fill path: line + close to bottom
  const areaPath =
    points.length > 0
      ? `M${toX(0)},${toY(points[0].score)} ` +
        points
          .slice(1)
          .map((p, i) => `L${toX(i + 1)},${toY(p.score)}`)
          .join(" ") +
        ` L${toX(points.length - 1)},${PAD_TOP + chartH} L${toX(0)},${PAD_TOP + chartH} Z`
      : "";

  // Gridline scores
  const gridScores = [-1, -0.5, 0, 0.5, 1];

  // Date labels: show first, middle, last
  const labelIndices: number[] = [];
  if (points.length <= 5) {
    points.forEach((_, i) => labelIndices.push(i));
  } else {
    labelIndices.push(0);
    labelIndices.push(Math.floor(points.length / 2));
    labelIndices.push(points.length - 1);
  }

  function formatDate(d: string): string {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: "12px",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "200px" }}
        preserveAspectRatio="none"
      >
        {/* Gridlines */}
        {gridScores.map((s) => (
          <g key={s}>
            <line
              x1={PAD_X}
              y1={toY(s)}
              x2={W - PAD_X}
              y2={toY(s)}
              stroke="#252525"
              strokeWidth="1"
            />
            <text
              x={PAD_X - 6}
              y={toY(s) + 3}
              textAnchor="end"
              fill="#3A3A3A"
              fontSize="10"
              fontFamily="var(--font-inter)"
            >
              {s}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {points.length > 1 && (
          <path d={areaPath} fill="rgba(196,91,40,0.15)" />
        )}

        {/* Line */}
        {points.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="#C45B28"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(p.score)}
            r="4"
            fill="#C45B28"
            stroke="#161616"
            strokeWidth="2"
          />
        ))}

        {/* X-axis date labels */}
        {labelIndices.map((idx) => (
          <text
            key={idx}
            x={toX(idx)}
            y={H - 6}
            textAnchor="middle"
            fill="#9A9A9A"
            fontSize="10"
            fontFamily="var(--font-inter)"
          >
            {formatDate(points[idx].date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Emotion Frequency Bars ───────────────────────────────────────────────────

function EmotionBars({
  emotions,
}: {
  emotions: Array<{ emotion: string; count: number }>;
}) {
  const maxCount = Math.max(...emotions.map((e) => e.count), 1);

  return (
    <div
      className="px-7 py-6 flex flex-col gap-3"
      style={{
        backgroundColor: "#161616",
        border: "1px solid #252525",
        borderRadius: "12px",
      }}
    >
      {emotions.map((e) => (
        <div key={e.emotion} className="flex items-center gap-3">
          <span
            className="text-xs font-semibold w-24 shrink-0 capitalize"
            style={{
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
            }}
          >
            {e.emotion}
          </span>
          <div className="flex-1 h-5 relative" style={{ backgroundColor: "#0A0A0A", borderRadius: "4px" }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(e.count / maxCount) * 100}%`,
                backgroundColor: "#C45B28",
                borderRadius: "4px",
                minWidth: e.count > 0 ? "4px" : "0px",
              }}
            />
          </div>
          <span
            className="text-xs font-bold w-8 text-right shrink-0"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            {e.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Correlation Card ─────────────────────────────────────────────────────────

function CorrelationCard({ value }: { value: number }) {
  let label: string;
  let indicatorColor: string;

  if (value >= 0.5) {
    label = "Strong positive link between training and mood";
    indicatorColor = "#2A6A4A";
  } else if (value >= 0.2) {
    label = "Moderate connection between training and mood";
    indicatorColor = "#C45B28";
  } else if (value >= -0.2) {
    label = "No clear link yet";
    indicatorColor = "#9A9A9A";
  } else if (value >= -0.5) {
    label = "Moderate inverse connection";
    indicatorColor = "#7A5228";
  } else {
    label = "Strong inverse link between training and mood";
    indicatorColor = "#5A1A1A";
  }

  // Visual indicator: a bar from center showing correlation
  const barWidth = Math.abs(value) * 100;
  const isPositive = value >= 0;

  return (
    <section>
      <p
        className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
        style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
      >
        Workout-Mood Correlation
      </p>
      <div
        className="px-7 py-6 flex flex-col gap-4"
        style={{
          backgroundColor: "#161616",
          border: "1px solid #252525",
          borderRadius: "12px",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: indicatorColor }}
          />
          <p
            className="text-sm font-semibold"
            style={{
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
            }}
          >
            {label}
          </p>
        </div>

        {/* Visual bar */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs w-6 text-right shrink-0"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            -1
          </span>
          <div
            className="flex-1 h-4 relative"
            style={{
              backgroundColor: "#0A0A0A",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            {/* Center line */}
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ left: "50%", backgroundColor: "#3A3A3A" }}
            />
            {/* Correlation bar */}
            <div
              className="absolute top-0 bottom-0 transition-all duration-500"
              style={{
                backgroundColor: indicatorColor,
                borderRadius: "4px",
                ...(isPositive
                  ? { left: "50%", width: `${barWidth / 2}%` }
                  : {
                      right: "50%",
                      width: `${barWidth / 2}%`,
                    }),
              }}
            />
          </div>
          <span
            className="text-xs w-6 shrink-0"
            style={{
              color: "#9A9A9A",
              fontFamily: "var(--font-inter)",
            }}
          >
            +1
          </span>
        </div>

        <p
          className="text-xs text-center"
          style={{
            color: "#9A9A9A",
            fontFamily: "var(--font-inter)",
          }}
        >
          Correlation: {value.toFixed(2)}
        </p>
      </div>
    </section>
  );
}
