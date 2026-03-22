"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import type { Injury } from "@/lib/injuries";

// ─── Constants ───────────────────────────────────────────────────────────────

const BODY_ZONES: { label: string; part: string }[] = [
  { label: "Neck",       part: "neck" },
  { label: "Shoulders",  part: "shoulders" },
  { label: "Chest",      part: "chest" },
  { label: "Upper Back", part: "back" },
  { label: "Lower Back", part: "back" },
  { label: "Elbows",     part: "elbows" },
  { label: "Wrists",     part: "wrists" },
  { label: "Hips",       part: "hips" },
  { label: "Knees",      part: "knees" },
  { label: "Ankles",     part: "ankles" },
];

const INJURY_TYPES = [
  { label: "Strain", value: "strain" },
  { label: "Sprain", value: "sprain" },
  { label: "Surgery Recovery", value: "surgery_recovery" },
  { label: "Chronic Pain", value: "chronic_pain" },
  { label: "Just Sore", value: "just_sore" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InjuryPage() {
  const [activeInjuries, setActiveInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const [painLevel, setPainLevel] = useState(3);
  const [injuryType, setInjuryType] = useState("strain");
  const [avoidOrModify, setAvoidOrModify] = useState<"avoid" | "modify">("modify");
  const [saving, setSaving] = useState(false);

  const fetchInjuries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("injuries")
      .select("*")
      .eq("user_id", user.id)
      .is("resolved_at", null)
      .order("created_at", { ascending: false });

    setActiveInjuries((data as Injury[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchInjuries(); }, [fetchInjuries]);

  async function saveInjury() {
    if (!selectedPart) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("injuries").insert({
      user_id: user.id,
      body_part: selectedPart,
      pain_level: painLevel,
      injury_type: injuryType,
      avoid_or_modify: avoidOrModify,
    });

    setSelectedPart(null);
    setPainLevel(3);
    setInjuryType("strain");
    setAvoidOrModify("modify");
    setSaving(false);
    fetchInjuries();
  }

  async function resolveInjury(id: string) {
    await supabase
      .from("injuries")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", id);
    fetchInjuries();
  }

  const injuredParts = new Set(activeInjuries.map((i) => i.body_part));

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/body"
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
              Injury Report
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#FFFFFF" }}
            >
              What&rsquo;s Banged Up?
            </h1>
            <p
              className="text-sm mt-2"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Select the area giving you trouble
            </p>
          </div>
        </header>

        {/* ── Body region selector — 2-column grid ────────────────────── */}
        <section className="grid grid-cols-2 gap-3">
          {BODY_ZONES.map(({ label, part }) => {
            const isSelected = selectedPart === part;
            const isInjured = injuredParts.has(part);

            return (
              <button
                key={label}
                onClick={() => setSelectedPart(isSelected ? null : part)}
                className="relative flex items-end text-left transition-all duration-150 active:scale-[0.97]"
                style={{
                  height: 140,
                  backgroundColor: isSelected ? "#1E1E1E" : "#161616",
                  borderTop: isSelected ? "1px solid #C45B28" : "1px solid #252525",
                  borderRight: isSelected ? "1px solid #C45B28" : "1px solid #252525",
                  borderBottom: isSelected ? "1px solid #C45B28" : "1px solid #252525",
                  borderLeft: isInjured && !isSelected
                    ? "3px solid #FF4444"
                    : "3px solid #C45B28",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <span
                  className="text-base font-bold"
                  style={{ color: "#FFFFFF", fontFamily: "var(--font-inter)" }}
                >
                  {label}
                </span>

                {/* Red dot for active injury */}
                {isInjured && (
                  <span
                    className="absolute"
                    style={{
                      top: 12,
                      right: 12,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#FF4444",
                    }}
                  />
                )}
              </button>
            );
          })}
        </section>

        {/* ── Injury detail form ──────────────────────────────────────── */}
        {selectedPart && (
          <section
            className="flex flex-col gap-6 px-6 py-6"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
            }}
          >
            <p
              className="text-lg font-bold capitalize"
              style={{ color: "#FFFFFF", fontFamily: "var(--font-inter)" }}
            >
              {selectedPart} Injury
            </p>

            {/* Pain level — 5 square buttons */}
            <div className="flex flex-col gap-3">
              <label
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Pain Level
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPainLevel(n)}
                    className="flex items-center justify-center text-sm font-bold transition-all"
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: painLevel === n ? "#C45B28" : "#0A0A0A",
                      color: painLevel === n ? "#0A0A0A" : "#9A9A9A",
                      border: `1px solid ${painLevel === n ? "#C45B28" : "#333"}`,
                      borderRadius: "6px",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Injury type dropdown */}
            <div className="flex flex-col gap-3">
              <label
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                What happened?
              </label>
              <select
                value={injuryType}
                onChange={(e) => setInjuryType(e.target.value)}
                className="px-4 py-3 text-sm"
                style={{
                  backgroundColor: "#0A0A0A",
                  color: "#E8E2D8",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {INJURY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Avoid or Modify */}
            <div className="flex flex-col gap-3">
              <label
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                How should we handle it?
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAvoidOrModify("avoid")}
                  className="flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: avoidOrModify === "avoid" ? "#FF4444" : "transparent",
                    color: avoidOrModify === "avoid" ? "#0A0A0A" : "#FF4444",
                    border: "1px solid #FF4444",
                    borderRadius: "8px",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Avoid Completely
                </button>
                <button
                  onClick={() => setAvoidOrModify("modify")}
                  className="flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: avoidOrModify === "modify" ? "#C45B28" : "transparent",
                    color: avoidOrModify === "modify" ? "#0A0A0A" : "#C45B28",
                    border: "1px solid #C45B28",
                    borderRadius: "8px",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Modify Workouts
                </button>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={saveInjury}
              disabled={saving}
              className="w-full py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: "#C45B28",
                color: "#0A0A0A",
                borderRadius: "8px",
                fontFamily: "var(--font-inter)",
                fontWeight: 600,
                minHeight: "52px",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving..." : "Report Injury"}
            </button>
          </section>
        )}

        {/* ── Active Injuries ─────────────────────────────────────────── */}
        {!loading && activeInjuries.length > 0 && (
          <section className="flex flex-col gap-4">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Active Injuries
            </p>
            {activeInjuries.map((injury) => (
              <div
                key={injury.id}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "12px",
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <span
                    className="text-base font-bold capitalize"
                    style={{ color: "#FFFFFF", fontFamily: "var(--font-inter)" }}
                  >
                    {injury.body_part}
                  </span>

                  {/* Pain dots */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: n <= injury.pain_level ? "#FF4444" : "#333",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {injury.injury_type.replace(/_/g, " ")}
                    </span>
                  </div>

                  <span
                    className="text-xs"
                    style={{ color: "#555", fontFamily: "var(--font-inter)" }}
                  >
                    Reported {formatDate(injury.created_at)}
                  </span>
                </div>

                <button
                  onClick={() => resolveInjury(injury.id)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: "transparent",
                    color: "#4CAF50",
                    border: "1px solid #4CAF50",
                    borderRadius: "8px",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Mark Healed
                </button>
              </div>
            ))}
          </section>
        )}

      </div>
      <BottomNav />
    </main>
  );
}
