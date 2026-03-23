"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type SleepLog = {
  id: string;
  user_id: string;
  date: string;
  bedtime: string;
  wake_time: string;
  duration_minutes: number;
  quality_score: number;
  deep_sleep_minutes: number;
  light_sleep_minutes: number;
  rem_sleep_minutes: number;
  awake_minutes: number;
  source: "manual" | "fitbit" | "garmin" | "google_fit";
  created_at: string;
};

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatDateAbbr(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatBedtime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function qualityColor(score: number): string {
  if (score >= 80) return "#2A6A4A";
  if (score >= 60) return "#C45B28";
  return "#E87070";
}

export default function SleepPage() {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("sleep_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(14);

      if (data) setLogs(data as SleepLog[]);
      setLoading(false);
    }
    load();
  }, []);

  const last7 = logs.slice(0, 7);
  const last14 = [...logs].reverse();
  const latestNight = logs.length > 0 ? logs[0] : null;

  const avgDuration =
    last7.length > 0
      ? Math.round(last7.reduce((s, l) => s + l.duration_minutes, 0) / last7.length)
      : 0;
  const avgQuality =
    last7.length > 0
      ? Math.round(last7.reduce((s, l) => s + l.quality_score, 0) / last7.length)
      : 0;
  const avgBedtime =
    last7.length > 0
      ? (() => {
          const totalMins = last7.reduce((s, l) => {
            const d = new Date(l.bedtime);
            let mins = d.getHours() * 60 + d.getMinutes();
            if (mins < 720) mins += 1440;
            return s + mins;
          }, 0);
          let avg = Math.round(totalMins / last7.length) % 1440;
          const h = Math.floor(avg / 60);
          const m = avg % 60;
          const ampm = h >= 12 ? "PM" : "AM";
          const h12 = h % 12 || 12;
          return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
        })()
      : "--";

  // Skeleton block
  function Skeleton({ w = "100%", h = 20 }: { w?: string | number; h?: number }) {
    return (
      <div
        className="rounded animate-pulse"
        style={{
          width: typeof w === "number" ? `${w}px` : w,
          height: `${h}px`,
          backgroundColor: "#252525",
        }}
      />
    );
  }

  // Duration bar chart (last 14 nights)
  function DurationChart() {
    if (last14.length === 0) return null;
    const vw = 300;
    const vh = 120;
    const pad = { top: 10, bottom: 20, left: 5, right: 5 };
    const chartW = vw - pad.left - pad.right;
    const chartH = vh - pad.top - pad.bottom;
    const maxH = 12; // max hours scale
    const barGap = 2;
    const barW = (chartW - barGap * last14.length) / last14.length;
    const targetH = 8; // target hours line
    const targetY = pad.top + chartH - (targetH / maxH) * chartH;

    return (
      <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="auto">
        {/* Target line */}
        <line
          x1={pad.left}
          y1={targetY}
          x2={vw - pad.right}
          y2={targetY}
          stroke="#9A9A9A"
          strokeWidth="0.5"
          strokeDasharray="3,2"
        />
        <text x={vw - pad.right + 1} y={targetY + 3} fill="#9A9A9A" fontSize="5" fontFamily="var(--font-inter)">
          8h
        </text>

        {last14.map((log, i) => {
          const hours = log.duration_minutes / 60;
          const barH = Math.max(1, (hours / maxH) * chartH);
          const x = pad.left + i * (barW + barGap);
          const y = pad.top + chartH - barH;
          return (
            <g key={log.id}>
              <rect x={x} y={y} width={barW} height={barH} rx={1.5} fill="#C45B28" />
              <text
                x={x + barW / 2}
                y={vh - 4}
                textAnchor="middle"
                fill="#9A9A9A"
                fontSize="4.5"
                fontFamily="var(--font-inter)"
              >
                {formatShortDate(log.date)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Quality trend line chart (last 14 nights)
  function QualityChart() {
    if (last14.length === 0) return null;
    const vw = 300;
    const vh = 120;
    const pad = { top: 10, bottom: 20, left: 10, right: 10 };
    const chartW = vw - pad.left - pad.right;
    const chartH = vh - pad.top - pad.bottom;

    const points = last14.map((log, i) => {
      const x = pad.left + (last14.length === 1 ? chartW / 2 : (i / (last14.length - 1)) * chartW);
      const y = pad.top + chartH - (log.quality_score / 100) * chartH;
      return `${x},${y}`;
    });

    return (
      <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="auto">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = pad.top + chartH - (v / 100) * chartH;
          return (
            <g key={v}>
              <line x1={pad.left} y1={y} x2={vw - pad.right} y2={y} stroke="#252525" strokeWidth="0.5" />
              <text x={pad.left - 2} y={y + 2} textAnchor="end" fill="#9A9A9A" fontSize="4.5" fontFamily="var(--font-inter)">
                {v}
              </text>
            </g>
          );
        })}

        <polyline points={points.join(" ")} fill="none" stroke="#2A4A6A" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {last14.map((log, i) => {
          const x = pad.left + (last14.length === 1 ? chartW / 2 : (i / (last14.length - 1)) * chartW);
          const y = pad.top + chartH - (log.quality_score / 100) * chartH;
          return <circle key={log.id} cx={x} cy={y} r={2} fill="#2A4A6A" />;
        })}

        {/* X labels */}
        {last14.map((log, i) => {
          const x = pad.left + (last14.length === 1 ? chartW / 2 : (i / (last14.length - 1)) * chartW);
          return (
            <text key={log.id} x={x} y={vh - 4} textAnchor="middle" fill="#9A9A9A" fontSize="4.5" fontFamily="var(--font-inter)">
              {formatShortDate(log.date)}
            </text>
          );
        })}
      </svg>
    );
  }

  // Stacked bar for sleep stages
  function SleepStagesBar() {
    if (!latestNight) return null;
    const total =
      latestNight.deep_sleep_minutes +
      latestNight.light_sleep_minutes +
      latestNight.rem_sleep_minutes +
      latestNight.awake_minutes;
    if (total === 0) return null;

    const segments = [
      { label: "Deep", mins: latestNight.deep_sleep_minutes, color: "#2A4A6A" },
      { label: "Light", mins: latestNight.light_sleep_minutes, color: "#3A5A8A" },
      { label: "REM", mins: latestNight.rem_sleep_minutes, color: "#5A7AAA" },
      { label: "Awake", mins: latestNight.awake_minutes, color: "#8A9ACA" },
    ];

    return (
      <div className="flex flex-col gap-3">
        {/* Stacked bar */}
        <div className="flex w-full h-6 rounded-md overflow-hidden">
          {segments.map((seg) => {
            const pct = (seg.mins / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={seg.label}
                style={{ width: `${pct}%`, backgroundColor: seg.color }}
                title={`${seg.label}: ${formatDuration(seg.mins)}`}
              />
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-inter)" }}>
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
              <span style={{ color: "#9A9A9A" }}>
                {seg.label}: {formatDuration(seg.mins)} ({Math.round((seg.mins / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && logs.length === 0) {
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
              <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>Body</p>
              <h1 className="text-4xl font-bold uppercase leading-none" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>Sleep</h1>
            </div>
          </header>

          {/* Empty state */}
          <div
            className="flex flex-col items-center text-center gap-4 py-16 rounded-xl"
            style={{ backgroundColor: "#161616", border: "1px solid #252525" }}
          >
            <svg viewBox="0 0 48 48" width={48} height={48} fill="none">
              <circle cx="24" cy="24" r="20" stroke="#2A4A6A" strokeWidth="2" />
              <path d="M28 16C26 18 22 20 18 20C20 24 24 28 30 28C30 24 28 20 28 16Z" fill="#2A4A6A" opacity="0.5" />
              <path d="M20 14L22 18M14 20L18 22M16 14L18 17" stroke="#5A7AAA" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
              No sleep data yet
            </p>
            <p className="text-sm max-w-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Connect a wearable device to automatically track your sleep, or log your sleep manually.
            </p>
            <Link
              href="/dashboard/body/devices"
              className="mt-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#C45B28", color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
            >
              Connect a Device
            </Link>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

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
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>Body</p>
            <h1 className="text-4xl font-bold uppercase leading-none" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>Sleep</h1>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl p-4" style={{ backgroundColor: "#161616", border: "1px solid #252525" }}>
                  <Skeleton w={60} h={12} />
                  <div className="mt-2"><Skeleton w={80} h={24} /></div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="rounded-xl p-4" style={{ backgroundColor: "#161616", border: "1px solid #252525" }}>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Avg Duration
                </p>
                <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
                  {formatDuration(avgDuration)}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  last 7 nights
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: "#161616", border: "1px solid #252525" }}>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Avg Quality
                </p>
                <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-oswald)", color: qualityColor(avgQuality) }}>
                  {avgQuality}<span className="text-sm font-normal" style={{ color: "#9A9A9A" }}>/100</span>
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  last 7 nights
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: "#161616", border: "1px solid #252525" }}>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Avg Bedtime
                </p>
                <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
                  {avgBedtime}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  last 7 nights
                </p>
              </div>
            </>
          )}
        </div>

        {/* Sleep Duration Chart */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold uppercase" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
            Sleep Duration
          </h2>
          <div className="rounded-xl p-4" style={{ backgroundColor: "#161616", border: "1px solid #252525" }}>
            {loading ? (
              <Skeleton w="100%" h={120} />
            ) : (
              <DurationChart />
            )}
          </div>
        </section>

        {/* Sleep Quality Chart */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold uppercase" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
            Sleep Quality
          </h2>
          <div className="rounded-xl p-4" style={{ backgroundColor: "#161616", border: "1px solid #252525" }}>
            {loading ? (
              <Skeleton w="100%" h={120} />
            ) : (
              <QualityChart />
            )}
          </div>
        </section>

        {/* Last Night's Breakdown */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold uppercase" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
            Last Night&apos;s Breakdown
          </h2>
          <div className="rounded-xl p-5" style={{ backgroundColor: "#161616", border: "1px solid #252525" }}>
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton w="100%" h={24} />
                <Skeleton w="60%" h={14} />
              </div>
            ) : latestNight ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    {formatDateAbbr(latestNight.date)}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                    {formatDuration(latestNight.duration_minutes)} total
                  </span>
                </div>
                <SleepStagesBar />
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                No data for last night.
              </p>
            )}
          </div>
        </section>

        {/* Recent Nights */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold uppercase" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
            Recent Nights
          </h2>
          <div className="flex flex-col gap-2">
            {loading
              ? [0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{ backgroundColor: "#161616", border: "1px solid #252525" }}
                  >
                    <Skeleton w={100} h={14} />
                    <Skeleton w={60} h={14} />
                  </div>
                ))
              : last7.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{ backgroundColor: "#161616", border: "1px solid #252525" }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
                        {formatDateAbbr(log.date)}
                      </span>
                      <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                        {formatBedtime(log.bedtime)} &ndash; {formatBedtime(log.wake_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
                        {formatDuration(log.duration_minutes)}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: qualityColor(log.quality_score) + "22",
                          color: qualityColor(log.quality_score),
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {log.quality_score}/100
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}
