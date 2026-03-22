"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import { supabase } from "@/lib/supabase";

// Mapbox GL requires the DOM — no SSR
const RunMap = dynamic(() => import("@/components/RunMap"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type Coord = { lat: number; lng: number };

type RunLog = {
  id: string;
  distance_miles: number;
  duration_seconds: number;
  avg_pace: string;
  created_at: string;
  route_data: Coord[] | null;
};

type RunSummary = {
  distanceMiles: number;
  durationSeconds: number;
  avgPace: string;
  date: string;
  route: Coord[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineDistance(a: Coord, b: Coord): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function calcPace(distanceMiles: number, durationSeconds: number): string {
  if (distanceMiles < 0.01) return "--:--";
  const secsPerMile = durationSeconds / distanceMiles;
  const m = Math.floor(secsPerMile / 60);
  const s = Math.round(secsPerMile % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RunPage() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [history, setHistory] = useState<RunLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [userCenter, setUserCenter] = useState<[number, number] | undefined>(undefined);

  // Get user's current location for the idle map
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCenter([pos.coords.longitude, pos.coords.latitude]),
      () => {}, // fail silently — Dallas fallback in RunMap
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coordsRef = useRef<Coord[]>([]);
  const distanceRef = useRef(0);
  const elapsedRef = useRef(0);
  const gpsReadingCount = useRef(0);
  const lastGpsTime = useRef<number>(0);
  const recentSegments = useRef<number[]>([]); // last 5 segment distances for smoothing

  // Keep refs in sync with state for use in stop handler
  useEffect(() => { distanceRef.current = distanceMiles; }, [distanceMiles]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  const fetchHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setHistoryLoading(false); return; }

    const { data } = await supabase
      .from("run_logs")
      .select("id, distance_miles, duration_seconds, avg_pace, created_at, route_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setHistory(data ?? []);
    setHistoryLoading(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  function startRun() {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsError(null);
    setElapsed(0);
    setDistanceMiles(0);
    coordsRef.current = [];
    distanceRef.current = 0;
    elapsedRef.current = 0;
    gpsReadingCount.current = 0;
    lastGpsTime.current = Date.now();
    recentSegments.current = [];
    setPhase("running");

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    // GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        gpsReadingCount.current += 1;

        const next: Coord = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        // (a) Ignore first 3 GPS readings — GPS hasn't settled yet
        if (gpsReadingCount.current <= 3) {
          coordsRef.current.push(next);
          return;
        }

        const prev = coordsRef.current[coordsRef.current.length - 1];
        if (prev) {
          const seg = haversineDistance(prev, next);
          const now = Date.now();
          const dtHours = (now - lastGpsTime.current) / 3_600_000;

          // (c) Filter out GPS points where implied speed > 15 mph
          if (dtHours > 0 && seg / dtHours > 15) {
            lastGpsTime.current = now;
            return; // discard this point entirely
          }

          // Filter out GPS noise: ignore jumps > 0.1 mile per reading
          if (seg < 0.1) {
            distanceRef.current += seg;
            setDistanceMiles(distanceRef.current);

            // (d) Track last 5 segments for pace smoothing
            recentSegments.current.push(seg);
            if (recentSegments.current.length > 5) {
              recentSegments.current.shift();
            }
          }

          lastGpsTime.current = now;
        }
        coordsRef.current.push(next);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError("GPS access was denied. Please allow location access and try again.");
        } else {
          setGpsError("Unable to get GPS signal. Move to an open area and try again.");
        }
        stopRun(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function stopRun(fromError = false) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (fromError) {
      setPhase("idle");
      return;
    }

    const finalDist = distanceRef.current;
    const finalSecs = elapsedRef.current;
    const pace = calcPace(finalDist, finalSecs);

    setSummary({
      distanceMiles: finalDist,
      durationSeconds: finalSecs,
      avgPace: pace,
      date: new Date().toISOString(),
      route: [...coordsRef.current],
    });
    setPhase("done");
    saveRun(finalDist, finalSecs, pace, coordsRef.current);
  }

  async function saveRun(
    distanceMiles: number,
    durationSeconds: number,
    avgPace: string,
    route: Coord[]
  ) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("run_logs").insert({
      user_id: user.id,
      distance_miles: Math.round(distanceMiles * 100) / 100,
      duration_seconds: durationSeconds,
      avg_pace: avgPace,
      route_data: route,
    });

    setSaving(false);
    fetchHistory();
  }

  function reset() {
    setSummary(null);
    setElapsed(0);
    setDistanceMiles(0);
    setPhase("idle");
  }

  // (e) Show "Calibrating..." for first 10 seconds; (b) require >= 0.01 mi
  const pace =
    phase === "running" && elapsed < 10
      ? "Calibrating..."
      : calcPace(distanceMiles, elapsed);

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/body/running"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back"
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
              GPS Tracker
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Run
            </h1>
          </div>
        </header>

        {/* GPS error banner */}
        {gpsError && (
          <div
            className="px-5 py-4 text-sm"
            style={{
              backgroundColor: "#1A0A0A",
              border: "1px solid #5A1A1A",
              borderRadius: "8px",
              color: "#E87070",
              fontFamily: "var(--font-inter)",
            }}
          >
            {gpsError}
          </div>
        )}

        {/* ── Test map (always visible in idle) ─────────────────────────── */}
        {phase === "idle" && (
          <section className="flex flex-col gap-2">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Your Location
            </p>
            <RunMap height="400px" interactive center={userCenter} />
          </section>
        )}

        {/* ── Tracker card ─────────────────────────────────────────────────── */}
        <section
          className="flex flex-col items-center gap-8 px-8 py-10"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
        >
          {phase === "idle" && (
            <div className="flex flex-col items-center gap-6 w-full">
              <p
                className="text-sm text-center"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                No runs yet. Lace up and hit Start.
              </p>
              <button
                onClick={startRun}
                className="w-full py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  minHeight: "56px",
                }}
              >
                Start Run
              </button>
            </div>
          )}

          {phase === "running" && (
            <div className="flex flex-col items-center gap-8 w-full">
              {/* Live metrics */}
              <div className="grid grid-cols-3 w-full gap-4">
                <LiveMetric
                  label="Time"
                  value={formatTime(elapsed)}
                />
                <LiveMetric
                  label="Miles"
                  value={distanceMiles.toFixed(2)}
                  accent
                />
                <LiveMetric
                  label="Pace"
                  value={pace}
                  unit="/mi"
                />
              </div>

              <button
                onClick={() => stopRun()}
                className="w-full py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: "#161616",
                  color: "#E87070",
                  border: "1px solid #5A1A1A",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  minHeight: "56px",
                }}
              >
                Stop Run
              </button>
            </div>
          )}

          {phase === "done" && summary && (
            <div className="flex flex-col items-center gap-6 w-full">
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                Run Complete
              </p>

              {/* Route map with summary overlay */}
              {summary.route.length >= 2 && (
                <div className="w-full">
                  <RunMap
                    coords={summary.route}
                    height="300px"
                    interactive
                    summary={{
                      distance: `${summary.distanceMiles.toFixed(2)} mi`,
                      time: formatTime(summary.durationSeconds),
                      pace: `${summary.avgPace} /mi`,
                    }}
                  />
                </div>
              )}

              {/* Summary grid */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <SummaryTile label="Distance" value={`${summary.distanceMiles.toFixed(2)} mi`} />
                <SummaryTile label="Time" value={formatTime(summary.durationSeconds)} />
                <SummaryTile label="Avg Pace" value={`${summary.avgPace} /mi`} />
                <SummaryTile label="Date" value={formatDate(summary.date)} />
              </div>

              {saving && (
                <p
                  className="text-xs"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Saving...
                </p>
              )}

              <button
                onClick={reset}
                className="w-full py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  minHeight: "56px",
                }}
              >
                New Run
              </button>
            </div>
          )}
        </section>

        {/* ── Run History ───────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Run History
          </p>

          {historyLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse"
                  style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p
              className="text-sm text-center py-6"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              No runs yet. Lace up and hit Start.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((run) => {
                const isExpanded = expandedRun === run.id;
                const hasRoute = Array.isArray(run.route_data) && run.route_data.length >= 2;

                return (
                  <div
                    key={run.id}
                    className="flex flex-col overflow-hidden transition-all"
                    style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
                  >
                    {/* Clickable header */}
                    <button
                      onClick={() => hasRoute && setExpandedRun(isExpanded ? null : run.id)}
                      className="px-5 py-4 flex items-center justify-between w-full text-left"
                      style={{ cursor: hasRoute ? "pointer" : "default" }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-base font-bold"
                          style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                        >
                          {run.distance_miles.toFixed(2)} mi
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                        >
                          {formatTime(run.duration_seconds)} · {run.avg_pace}/mi
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs"
                          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                        >
                          {formatDate(run.created_at)}
                        </span>
                        {hasRoute && (
                          <svg
                            viewBox="0 0 20 20" fill="none" width={14} height={14}
                            className="transition-transform"
                            style={{
                              color: "#555",
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            }}
                          >
                            <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>

                    {/* Mini map (collapsed) */}
                    {hasRoute && !isExpanded && (
                      <div className="px-3 pb-3">
                        <RunMap
                          coords={run.route_data!}
                          height="200px"
                          interactive={false}
                        />
                      </div>
                    )}

                    {/* Full map (expanded) */}
                    {hasRoute && isExpanded && (
                      <div className="px-3 pb-3">
                        <RunMap
                          coords={run.route_data!}
                          height="350px"
                          interactive
                          summary={{
                            distance: `${run.distance_miles.toFixed(2)} mi`,
                            time: formatTime(run.duration_seconds),
                            pace: `${run.avg_pace} /mi`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
      <SpotifyPlayer category="running" />
      <BottomNav />
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveMetric({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-5"
      style={{ backgroundColor: "#0A0A0A", borderRadius: "8px", border: "1px solid #252525" }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-bold leading-none"
        style={{ color: accent ? "#C45B28" : "#E8E2D8", fontFamily: "var(--font-inter)" }}
      >
        {value}
      </span>
      {unit && (
        <span
          className="text-xs"
          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
        >
          {unit}
        </span>
      )}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-1 px-5 py-4"
      style={{ backgroundColor: "#0D1B2A", border: "1px solid #1E3A5F", borderRadius: "12px" }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
      >
        {label}
      </span>
      <span
        className="text-lg font-bold"
        style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
      >
        {value}
      </span>
    </div>
  );
}
