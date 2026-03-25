"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CheckinRow = {
  mood: number;
  sleep: number;
  energy: number;
  created_at: string;
};

type DayData = {
  date: string;
  label: string;
  mood: number | null;
  sleep: number | null;
  energy: number | null;
};

type Metric = "mood" | "sleep" | "energy";
type Period = "7" | "30";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function dotColor(value: number | null): string {
  if (value === null) return "transparent";
  if (value >= 4) return "#22c55e";
  if (value === 3) return "#eab308";
  return "#ef4444";
}

function buildDays(checkins: CheckinRow[], days: number): DayData[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toLocaleDateString("en-CA");
    const label = d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);

    const dayRows = checkins.filter(
      (c) => new Date(c.created_at).toLocaleDateString("en-CA") === dateStr
    );

    if (dayRows.length === 0) return { date: dateStr, label, mood: null, sleep: null, energy: null };

    const avg = (vals: number[]) => vals.reduce((s, n) => s + n, 0) / vals.length;

    return {
      date: dateStr,
      label,
      mood: avg(dayRows.map((r) => r.mood)),
      sleep: avg(dayRows.map((r) => r.sleep)),
      energy: avg(dayRows.map((r) => r.energy)),
    };
  });
}

// ─── SVG Chart ─────────────────────────────────────────────────────────────────
// Uses a fixed 300×80 viewBox. On mobile (~327px wide) the aspect ratio is close
// enough that circles render nearly round. preserveAspectRatio="none" lets us
// stretch the chart to fill any container width.

function LineChart({
  data,
  field,
  lineColor,
}: {
  data: DayData[];
  field: Metric;
  lineColor: string;
}) {
  const VW = 300;
  const VH = 80;
  const PAD = { t: 8, b: 8, l: 6, r: 6 };
  const innerW = VW - PAD.l - PAD.r;
  const innerH = VH - PAD.t - PAD.b;
  const n = data.length;

  type Point = { x: number; y: number; value: number | null };
  const points: Point[] = data.map((d, i) => ({
    x: PAD.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW),
    y:
      d[field] !== null
        ? PAD.t + innerH - ((d[field]! - 1) / 4) * innerH
        : -1,
    value: d[field],
  }));

  const visible = points.filter((p) => p.y >= 0);

  // Build path segments — skip gaps where value is null
  let pathD = "";
  let inSegment = false;
  for (const p of points) {
    if (p.y < 0) { inSegment = false; continue; }
    pathD += inSegment ? ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    inSegment = true;
  }

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      height={80}
      preserveAspectRatio="none"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Horizontal grid lines at each level */}
      {[1, 2, 3, 4, 5].map((v) => {
        const y = PAD.t + innerH - ((v - 1) / 4) * innerH;
        return (
          <line
            key={v}
            x1={PAD.l}
            y1={y}
            x2={VW - PAD.r}
            y2={y}
            stroke="#1E1E1E"
            strokeWidth="0.8"
          />
        );
      })}

      {/* Connecting line */}
      {visible.length > 1 && (
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
        />
      )}

      {/* Data dots */}
      {visible.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill={dotColor(p.value)}
          stroke="#111111"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

const METRIC_COLOR: Record<Metric, string> = {
  mood:   "#8B5CF6",
  sleep:  "#3b82f6",
  energy: "#f97316",
};

const METRIC_LABEL: Record<Metric, string> = {
  mood:   "Mood",
  sleep:  "Sleep",
  energy: "Energy",
};

export default function MoodHistoryChart() {
  const [period, setPeriod] = useState<Period>("7");
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>("mood");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();

      const { data } = await supabase
        .from("daily_checkins")
        .select("mood, sleep, energy, created_at")
        .eq("user_id", user.id)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: true });

      setCheckins(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const days = parseInt(period);
  const dayData = buildDays(checkins, days);

  // X-axis labels — show every label for 7d, every ~5th for 30d
  const xLabels = dayData.filter((_, i) =>
    days === 7 ? true : i % 5 === 0 || i === days - 1
  );

  // Quick stats for displayed period
  const withData = dayData.filter((d) => d[metric] !== null);
  const avg =
    withData.length > 0
      ? (withData.reduce((s, d) => s + d[metric]!, 0) / withData.length).toFixed(1)
      : null;

  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: "1px solid #252525",
        borderRadius: 12,
        padding: "20px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 10,
            fontWeight: 600,
            color: "#C45B28",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
          }}
        >
          Trends
        </p>
        <div style={{ display: "flex", gap: 4 }}>
          {(["7", "30"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                backgroundColor: period === p ? "#f97316" : "#1E1E1E",
                color: period === p ? "#0A0A0A" : "#9A9A9A",
                fontFamily: "var(--font-inter)",
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Metric tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["mood", "sleep", "energy"] as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            style={{
              flex: 1,
              padding: "7px 0",
              borderRadius: 8,
              border: `1px solid ${metric === m ? METRIC_COLOR[m] : "#252525"}`,
              backgroundColor: metric === m ? `${METRIC_COLOR[m]}1A` : "transparent",
              color: metric === m ? METRIC_COLOR[m] : "#9A9A9A",
              fontFamily: "var(--font-inter)",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            {METRIC_LABEL[m]}
          </button>
        ))}
      </div>

      {/* Avg stat */}
      {!loading && avg !== null && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: 28,
              fontWeight: 700,
              color: METRIC_COLOR[metric],
              lineHeight: 1,
            }}
          >
            {avg}
          </span>
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 10,
              color: "#9A9A9A",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            avg {METRIC_LABEL[metric].toLowerCase()} · {days}d
          </span>
        </div>
      )}

      {/* Chart or placeholder */}
      {loading ? (
        <div
          className="animate-pulse"
          style={{
            height: 80,
            backgroundColor: "#1E1E1E",
            borderRadius: 8,
          }}
        />
      ) : checkins.length === 0 ? (
        <div
          style={{
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              color: "#9A9A9A",
              textAlign: "center",
            }}
          >
            No check-ins yet.{" "}
            <span style={{ color: "#f97316" }}>Start your streak today.</span>
          </p>
        </div>
      ) : (
        <LineChart data={dayData} field={metric} lineColor={METRIC_COLOR[metric]} />
      )}

      {/* X-axis labels */}
      {!loading && checkins.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {xLabels.map((d, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 9,
                color: "#3A3A3A",
                textTransform: "uppercase",
              }}
            >
              {d.label}
            </span>
          ))}
        </div>
      )}

      {/* Color legend */}
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {[
          { label: "4–5", color: "#22c55e" },
          { label: "3",   color: "#eab308" },
          { label: "1–2", color: "#ef4444" },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 10,
                color: "#9A9A9A",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
