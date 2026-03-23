"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// --------------- Types ---------------

type Measurement = {
  id: string;
  user_id: string;
  height_inches: number | null;
  weight_lbs: number | null;
  neck_inches: number | null;
  chest_inches: number | null;
  waist_inches: number | null;
  hips_inches: number | null;
  left_bicep_inches: number | null;
  right_bicep_inches: number | null;
  left_thigh_inches: number | null;
  right_thigh_inches: number | null;
  left_calf_inches: number | null;
  right_calf_inches: number | null;
  total_inches: number | null;
  measured_at: string;
  notes: string | null;
};

type MeasurementGoal = {
  id: string;
  user_id: string;
  site: string;
  target_inches: number;
  target_date: string | null;
  created_at: string;
};

type TabKey = "log" | "dashboard" | "history" | "goals";

// --------------- Constants ---------------

const CIRCUMFERENCE_SITES = [
  { key: "neck_inches", label: "Neck" },
  { key: "chest_inches", label: "Chest" },
  { key: "waist_inches", label: "Waist" },
  { key: "hips_inches", label: "Hips" },
  { key: "left_bicep_inches", label: "Left Bicep" },
  { key: "right_bicep_inches", label: "Right Bicep" },
  { key: "left_thigh_inches", label: "Left Thigh" },
  { key: "right_thigh_inches", label: "Right Thigh" },
  { key: "left_calf_inches", label: "Left Calf" },
  { key: "right_calf_inches", label: "Right Calf" },
] as const;

const GOAL_SITE_OPTIONS = [
  { value: "weight_lbs", label: "Weight (lbs)" },
  ...CIRCUMFERENCE_SITES.map((s) => ({ value: s.key, label: s.label })),
];

type SiteKey = (typeof CIRCUMFERENCE_SITES)[number]["key"];

// --------------- Helpers ---------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function siteLabel(key: string): string {
  if (key === "weight_lbs") return "Weight";
  const found = CIRCUMFERENCE_SITES.find((s) => s.key === key);
  return found ? found.label : key;
}

function calcTotalInches(m: Record<string, number | null | string>): number {
  let sum = 0;
  for (const s of CIRCUMFERENCE_SITES) {
    const v = m[s.key];
    if (v !== null && v !== undefined && v !== "") sum += Number(v);
  }
  return sum;
}

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

// --------------- Main Component ---------------

export default function MeasurementsPage() {
  const [tab, setTab] = useState<TabKey>("log");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [goals, setGoals] = useState<MeasurementGoal[]>([]);

  // Form state
  const [form, setForm] = useState<Record<string, string>>({
    height_ft: "",
    height_in: "",
    weight_lbs: "",
    neck_inches: "",
    chest_inches: "",
    waist_inches: "",
    hips_inches: "",
    left_bicep_inches: "",
    right_bicep_inches: "",
    left_thigh_inches: "",
    right_thigh_inches: "",
    left_calf_inches: "",
    right_calf_inches: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Goal form state
  const [goalSite, setGoalSite] = useState("waist_inches");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalFormOpen, setGoalFormOpen] = useState(false);

  // History expand state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const [mRes, gRes] = await Promise.all([
        supabase
          .from("body_measurements")
          .select("*")
          .eq("user_id", user.id)
          .order("measured_at", { ascending: false })
          .limit(50),
        supabase
          .from("body_measurement_goals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      const mData = (mRes.data ?? []) as Measurement[];
      const gData = (gRes.data ?? []) as MeasurementGoal[];
      setMeasurements(mData);
      setGoals(gData);

      // Pre-fill form from most recent measurement
      if (mData.length > 0) {
        const last = mData[0];
        const totalIn = last.height_inches != null ? Math.floor(last.height_inches / 12) : "";
        const remainIn = last.height_inches != null ? (last.height_inches % 12) : "";
        setForm({
          height_ft: totalIn !== "" ? String(totalIn) : "",
          height_in: remainIn !== "" ? String(remainIn) : "",
          weight_lbs: last.weight_lbs != null ? String(last.weight_lbs) : "",
          neck_inches: last.neck_inches != null ? String(last.neck_inches) : "",
          chest_inches: last.chest_inches != null ? String(last.chest_inches) : "",
          waist_inches: last.waist_inches != null ? String(last.waist_inches) : "",
          hips_inches: last.hips_inches != null ? String(last.hips_inches) : "",
          left_bicep_inches: last.left_bicep_inches != null ? String(last.left_bicep_inches) : "",
          right_bicep_inches: last.right_bicep_inches != null ? String(last.right_bicep_inches) : "",
          left_thigh_inches: last.left_thigh_inches != null ? String(last.left_thigh_inches) : "",
          right_thigh_inches: last.right_thigh_inches != null ? String(last.right_thigh_inches) : "",
          left_calf_inches: last.left_calf_inches != null ? String(last.left_calf_inches) : "",
          right_calf_inches: last.right_calf_inches != null ? String(last.right_calf_inches) : "",
          notes: "",
        });
      }

      setLoading(false);
    }
    load();
  }, []);

  const latest = measurements.length > 0 ? measurements[0] : null;
  const oldest = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const chronological = [...measurements].reverse();

  // --------------- Handlers ---------------

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function getDelta(siteKey: string): { diff: number; display: string; color: string } | null {
    if (!latest) return null;
    const prev = (latest as Record<string, unknown>)[siteKey];
    const curr = form[siteKey];
    if (prev == null || curr === "") return null;
    const diff = Number(curr) - Number(prev);
    if (diff === 0) return { diff: 0, display: "=", color: "#9A9A9A" };
    if (diff < 0) return { diff, display: `\u2193 ${Math.abs(diff).toFixed(1)}`, color: "#2A6A4A" };
    return { diff, display: `\u2191 ${diff.toFixed(1)}`, color: "#C45B28" };
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const heightInches =
      form.height_ft !== "" || form.height_in !== ""
        ? (Number(form.height_ft) || 0) * 12 + (Number(form.height_in) || 0)
        : null;

    const row: Record<string, unknown> = {
      user_id: userId,
      height_inches: heightInches,
      weight_lbs: form.weight_lbs !== "" ? Number(form.weight_lbs) : null,
      measured_at: new Date().toISOString(),
      notes: form.notes || null,
    };

    for (const s of CIRCUMFERENCE_SITES) {
      row[s.key] = form[s.key] !== "" ? Number(form[s.key]) : null;
    }

    row.total_inches = calcTotalInches(row as Record<string, number | null | string>);
    if (row.total_inches === 0) row.total_inches = null;

    const { error } = await supabase.from("body_measurements").insert(row);

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    // Reload measurements
    const { data } = await supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(50);

    if (data) setMeasurements(data as Measurement[]);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setTab("dashboard");
    }, 1200);
  }

  async function handleSaveGoal() {
    if (!userId || goalTarget === "") return;
    setGoalSaving(true);
    const { error, data } = await supabase
      .from("body_measurement_goals")
      .insert({
        user_id: userId,
        site: goalSite,
        target_inches: Number(goalTarget),
        target_date: goalDate || null,
      })
      .select("*")
      .single();

    if (!error && data) {
      setGoals((prev) => [data as MeasurementGoal, ...prev]);
      setGoalTarget("");
      setGoalDate("");
      setGoalFormOpen(false);
    }
    setGoalSaving(false);
  }

  async function handleDeleteGoal(goalId: string) {
    await supabase.from("body_measurement_goals").delete().eq("id", goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  }

  function getCurrentValue(site: string): number | null {
    if (!latest) return null;
    return (latest as Record<string, unknown>)[site] as number | null;
  }

  function getFirstValue(site: string): number | null {
    if (!oldest) return null;
    return (oldest as Record<string, unknown>)[site] as number | null;
  }

  // --------------- Sub-components ---------------

  function TabBar() {
    const tabs: { key: TabKey; label: string }[] = [
      { key: "log", label: "Log" },
      { key: "dashboard", label: "Dashboard" },
      { key: "history", label: "History" },
      { key: "goals", label: "Goals" },
    ];
    return (
      <div style={{ display: "flex", gap: "8px", backgroundColor: "#111111", padding: "6px", borderRadius: "12px" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              backgroundColor: tab === t.key ? "#C45B28" : "#1A1A1A",
              color: tab === t.key ? "#FFFFFF" : "#9A9A9A",
              borderRadius: "8px",
              padding: "8px 18px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-inter)",
              transition: "background-color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  function NumberInput({ label, formKey, step = "0.25" }: { label: string; formKey: string; step?: string }) {
    const delta = getDelta(formKey);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label style={{ fontSize: "13px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{label}</label>
          {delta && (
            <span style={{ fontSize: "12px", color: delta.color, fontFamily: "var(--font-inter)", fontWeight: 600 }}>
              {delta.display}
            </span>
          )}
        </div>
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          value={form[formKey]}
          onChange={(e) => updateForm(formKey, e.target.value)}
          style={{
            backgroundColor: "#0F0F0F",
            border: "1px solid #333333",
            borderRadius: "8px",
            color: "#E8E2D8",
            fontFamily: "var(--font-inter)",
            padding: "12px 14px",
            fontSize: "16px",
            width: "100%",
            outline: "none",
          }}
        />
      </div>
    );
  }

  function LogTab() {
    return (
      <div className="flex flex-col gap-6">
        {/* Body Stats */}
        <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Body Stats
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label style={{ fontSize: "13px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Height</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="8"
                    value={form.height_ft}
                    onChange={(e) => updateForm("height_ft", e.target.value)}
                    placeholder="ft"
                    style={{
                      backgroundColor: "#0F0F0F",
                      border: "1px solid #333333",
                      borderRadius: "8px",
                      color: "#E8E2D8",
                      fontFamily: "var(--font-inter)",
                      padding: "12px 14px",
                      fontSize: "16px",
                      width: "100%",
                      outline: "none",
                    }}
                  />
                  <span style={{ color: "#9A9A9A", fontSize: "13px" }}>ft</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="11"
                    step="0.5"
                    value={form.height_in}
                    onChange={(e) => updateForm("height_in", e.target.value)}
                    placeholder="in"
                    style={{
                      backgroundColor: "#0F0F0F",
                      border: "1px solid #333333",
                      borderRadius: "8px",
                      color: "#E8E2D8",
                      fontFamily: "var(--font-inter)",
                      padding: "12px 14px",
                      fontSize: "16px",
                      width: "100%",
                      outline: "none",
                    }}
                  />
                  <span style={{ color: "#9A9A9A", fontSize: "13px" }}>in</span>
                </div>
              </div>
            </div>
            <NumberInput label="Weight (lbs)" formKey="weight_lbs" step="0.1" />
          </div>
        </fieldset>

        {/* Circumference Sites */}
        <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Circumference Sites
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CIRCUMFERENCE_SITES.map((site) => (
              <NumberInput key={site.key} label={site.label} formKey={site.key} />
            ))}
          </div>
        </fieldset>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: "13px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Notes (optional)
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            style={{
              backgroundColor: "#0F0F0F",
              border: "1px solid #333333",
              borderRadius: "8px",
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
              padding: "12px 14px",
              fontSize: "16px",
              width: "100%",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        {saveError && (
          <p style={{ color: "#E87070", fontSize: "14px", fontFamily: "var(--font-inter)" }}>{saveError}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || saveSuccess}
          style={{
            backgroundColor: saveSuccess ? "#2A6A4A" : "#C45B28",
            color: "#FFFFFF",
            borderRadius: "12px",
            height: "56px",
            fontFamily: "var(--font-oswald)",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            width: "100%",
            transition: "background-color 0.2s",
          }}
        >
          {saveSuccess ? "Saved!" : saving ? "Saving..." : "Save Measurements"}
        </button>
      </div>
    );
  }

  function DashboardTab() {
    if (measurements.length === 0) {
      return (
        <EmptyState message="Log your first measurement to see your dashboard." actionLabel="Go to Log" onAction={() => setTab("log")} />
      );
    }

    const totalFirst = oldest?.total_inches ?? 0;
    const totalLatest = latest?.total_inches ?? 0;
    const totalLoss = totalFirst - totalLatest;
    const isGain = totalLoss < 0;
    const milestonePct = Math.min(100, Math.max(0, (Math.abs(totalLoss) / 10) * 100));

    return (
      <div className="flex flex-col gap-6">
        {/* Total Inch Loss Hero Card */}
        <div
          style={{
            backgroundColor: "#1A0A00",
            border: "1px solid #C45B28",
            borderRadius: "16px",
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "72px",
              fontFamily: "var(--font-oswald)",
              color: isGain ? "#E87070" : "#C45B28",
              fontWeight: 900,
              lineHeight: 1,
              margin: 0,
            }}
          >
            {Math.abs(totalLoss).toFixed(1)}
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#E8E2D8",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "var(--font-inter)",
              marginTop: "8px",
            }}
          >
            {isGain ? "Total Inches Gained" : "Total Inches Lost"}
          </p>
          <p style={{ fontSize: "12px", color: "#9A9A9A", fontFamily: "var(--font-inter)", marginTop: "4px" }}>
            Since {formatDate(oldest?.measured_at ?? "")}
          </p>
        </div>

        {/* Progress Ring */}
        <div className="flex flex-col items-center gap-2">
          <svg width={100} height={100} viewBox="0 0 100 100">
            <circle cx={50} cy={50} r={40} fill="none" stroke="#252525" strokeWidth={8} />
            <circle
              cx={50}
              cy={50}
              r={40}
              fill="none"
              stroke="#C45B28"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${(milestonePct / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
              transform="rotate(-90 50 50)"
            />
            <text
              x={50}
              y={50}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#E8E2D8"
              fontSize="18"
              fontWeight={700}
              fontFamily="var(--font-oswald)"
            >
              {Math.round(milestonePct)}%
            </text>
          </svg>
          <p style={{ fontSize: "12px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Progress toward 10-inch milestone
          </p>
        </div>

        {/* Site Breakdown */}
        {measurements.length >= 2 && <SiteBreakdown />}

        {/* Latest Measurements */}
        {latest && <LatestMeasurementCard />}
      </div>
    );
  }

  function SiteBreakdown() {
    const first = oldest;
    const last = latest;
    if (!first || !last) return null;

    const changes: { label: string; firstVal: number; lastVal: number; change: number }[] = [];
    for (const s of CIRCUMFERENCE_SITES) {
      const fv = (first as Record<string, unknown>)[s.key] as number | null;
      const lv = (last as Record<string, unknown>)[s.key] as number | null;
      if (fv != null && lv != null) {
        changes.push({ label: s.label, firstVal: fv, lastVal: lv, change: lv - fv });
      }
    }

    changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    const maxAbs = Math.max(...changes.map((c) => Math.abs(c.change)), 1);

    return (
      <div>
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
        >
          Where You&apos;re Changing
        </p>
        <div className="flex flex-col gap-3">
          {changes.map((c) => {
            const pct = (Math.abs(c.change) / maxAbs) * 100;
            const color = c.change < 0 ? "#2A6A4A" : c.change > 0 ? "#E87070" : "#9A9A9A";
            const arrow = c.change < 0 ? "\u2193" : c.change > 0 ? "\u2191" : "=";
            return (
              <div
                key={c.label}
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: "10px",
                  padding: "12px 16px",
                }}
              >
                <div className="flex items-center justify-between" style={{ fontFamily: "var(--font-inter)" }}>
                  <span style={{ fontSize: "14px", color: "#E8E2D8" }}>{c.label}</span>
                  <span style={{ fontSize: "13px", color: "#9A9A9A" }}>
                    {c.firstVal}&quot; &rarr; {c.lastVal}&quot;{" "}
                    <span style={{ color, fontWeight: 600 }}>
                      {arrow} {Math.abs(c.change).toFixed(1)}
                    </span>
                  </span>
                </div>
                <div
                  className="mt-2 rounded-full overflow-hidden"
                  style={{ height: "4px", backgroundColor: "#252525" }}
                >
                  <div
                    className="rounded-full"
                    style={{ width: `${pct}%`, height: "100%", backgroundColor: color, transition: "width 0.3s" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function LatestMeasurementCard() {
    if (!latest) return null;
    const sites: { label: string; value: string }[] = [];
    if (latest.weight_lbs != null) sites.push({ label: "Weight", value: `${latest.weight_lbs} lbs` });
    for (const s of CIRCUMFERENCE_SITES) {
      const v = (latest as Record<string, unknown>)[s.key] as number | null;
      if (v != null) sites.push({ label: s.label, value: `${v}"` });
    }

    return (
      <div>
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
        >
          Latest Measurements
        </p>
        <div
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <p style={{ fontSize: "12px", color: "#9A9A9A", fontFamily: "var(--font-inter)", marginBottom: "12px" }}>
            {formatDate(latest.measured_at)}
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {sites.map((s) => (
              <div key={s.label} className="flex justify-between" style={{ fontFamily: "var(--font-inter)" }}>
                <span style={{ fontSize: "13px", color: "#9A9A9A" }}>{s.label}</span>
                <span style={{ fontSize: "13px", color: "#E8E2D8", fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function HistoryTab() {
    if (measurements.length === 0) {
      return (
        <EmptyState message="No measurements recorded yet." actionLabel="Log Your First" onAction={() => setTab("log")} />
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {/* Timeline */}
        <div>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Timeline
          </p>
          <div className="flex flex-col gap-3">
            {measurements.map((m) => {
              const isOpen = expandedId === m.id;
              return (
                <div
                  key={m.id}
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedId(isOpen ? null : m.id)}
                >
                  <div className="flex items-center justify-between" style={{ padding: "14px 16px" }}>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "#E8E2D8", fontFamily: "var(--font-oswald)" }}>
                        {formatDate(m.measured_at)}
                      </p>
                      <p style={{ fontSize: "12px", color: "#9A9A9A", fontFamily: "var(--font-inter)", marginTop: "2px" }}>
                        {m.weight_lbs != null ? `${m.weight_lbs} lbs` : ""}{" "}
                        {m.total_inches != null ? `\u00B7 ${m.total_inches}" total` : ""}
                      </p>
                    </div>
                    <svg
                      viewBox="0 0 20 20"
                      width={16}
                      height={16}
                      fill="none"
                      style={{
                        color: "#9A9A9A",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    >
                      <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {isOpen && (
                    <div
                      style={{ padding: "0 16px 14px", borderTop: "1px solid #252525" }}
                      className="grid grid-cols-2 gap-x-6 gap-y-2 pt-3"
                    >
                      {m.height_inches != null && (
                        <div className="flex justify-between" style={{ fontFamily: "var(--font-inter)" }}>
                          <span style={{ fontSize: "13px", color: "#9A9A9A" }}>Height</span>
                          <span style={{ fontSize: "13px", color: "#E8E2D8" }}>
                            {Math.floor(m.height_inches / 12)}&apos;{m.height_inches % 12}&quot;
                          </span>
                        </div>
                      )}
                      {m.weight_lbs != null && (
                        <div className="flex justify-between" style={{ fontFamily: "var(--font-inter)" }}>
                          <span style={{ fontSize: "13px", color: "#9A9A9A" }}>Weight</span>
                          <span style={{ fontSize: "13px", color: "#E8E2D8" }}>{m.weight_lbs} lbs</span>
                        </div>
                      )}
                      {CIRCUMFERENCE_SITES.map((s) => {
                        const v = (m as Record<string, unknown>)[s.key] as number | null;
                        if (v == null) return null;
                        return (
                          <div key={s.key} className="flex justify-between" style={{ fontFamily: "var(--font-inter)" }}>
                            <span style={{ fontSize: "13px", color: "#9A9A9A" }}>{s.label}</span>
                            <span style={{ fontSize: "13px", color: "#E8E2D8" }}>{v}&quot;</span>
                          </div>
                        );
                      })}
                      {m.notes && (
                        <div className="col-span-2" style={{ marginTop: "4px" }}>
                          <p style={{ fontSize: "12px", color: "#9A9A9A", fontFamily: "var(--font-inter)", fontStyle: "italic" }}>
                            {m.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts */}
        {chronological.length >= 2 && (
          <div className="flex flex-col gap-4">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Trends
            </p>
            <MeasurementChart title="Waist" dataKey="waist_inches" data={chronological} />
            <MeasurementChart title="Chest" dataKey="chest_inches" data={chronological} />
            <MeasurementChart title="Weight" dataKey="weight_lbs" data={chronological} unit=" lbs" />
            <MeasurementChart
              title="Biceps (avg)"
              dataKey="__bicep_avg"
              data={chronological}
              transform={(m) => {
                const l = m.left_bicep_inches;
                const r = m.right_bicep_inches;
                if (l != null && r != null) return (l + r) / 2;
                return l ?? r ?? null;
              }}
            />
            <MeasurementChart
              title="Thighs (avg)"
              dataKey="__thigh_avg"
              data={chronological}
              transform={(m) => {
                const l = m.left_thigh_inches;
                const r = m.right_thigh_inches;
                if (l != null && r != null) return (l + r) / 2;
                return l ?? r ?? null;
              }}
            />
          </div>
        )}
      </div>
    );
  }

  function MeasurementChart({
    title,
    dataKey,
    data,
    unit = "\"",
    transform,
  }: {
    title: string;
    dataKey: string;
    data: Measurement[];
    unit?: string;
    transform?: (m: Measurement) => number | null;
  }) {
    const points: { x: number; y: number; label: string; value: number }[] = [];
    const values: number[] = [];

    data.forEach((m, i) => {
      const val = transform ? transform(m) : ((m as Record<string, unknown>)[dataKey] as number | null);
      if (val != null) {
        values.push(val);
        points.push({ x: i, y: val, label: formatShortDate(m.measured_at), value: val });
      }
    });

    if (points.length < 2) return null;

    const vw = 300;
    const vh = 100;
    const pad = { top: 10, bottom: 20, left: 30, right: 10 };
    const chartW = vw - pad.left - pad.right;
    const chartH = vh - pad.top - pad.bottom;
    const minVal = Math.min(...values) - 0.5;
    const maxVal = Math.max(...values) + 0.5;
    const range = maxVal - minVal || 1;

    const svgPoints = points.map((p, i) => {
      const x = pad.left + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
      const y = pad.top + chartH - ((p.y - minVal) / range) * chartH;
      return { x, y, label: p.label, value: p.value };
    });

    const polyline = svgPoints.map((p) => `${p.x},${p.y}`).join(" ");

    // Y-axis: 3 reference lines
    const ySteps = [minVal, (minVal + maxVal) / 2, maxVal];

    return (
      <div style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px", padding: "14px 16px" }}>
        <p
          style={{ fontSize: "13px", color: "#E8E2D8", fontWeight: 600, fontFamily: "var(--font-oswald)", marginBottom: "8px" }}
        >
          {title}
        </p>
        <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="auto">
          {/* Grid lines */}
          {ySteps.map((v) => {
            const y = pad.top + chartH - ((v - minVal) / range) * chartH;
            return (
              <g key={v}>
                <line x1={pad.left} y1={y} x2={vw - pad.right} y2={y} stroke="#252525" strokeWidth="0.5" />
                <text x={pad.left - 3} y={y + 2} textAnchor="end" fill="#9A9A9A" fontSize="4.5" fontFamily="var(--font-inter)">
                  {v.toFixed(1)}
                </text>
              </g>
            );
          })}

          <polyline points={polyline} fill="none" stroke="#C45B28" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Dots */}
          {svgPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2} fill="#C45B28" />
          ))}

          {/* X labels (show first, middle, last) */}
          {svgPoints.length > 0 &&
            [0, Math.floor(svgPoints.length / 2), svgPoints.length - 1]
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .map((idx) => (
                <text
                  key={idx}
                  x={svgPoints[idx].x}
                  y={vh - 4}
                  textAnchor="middle"
                  fill="#9A9A9A"
                  fontSize="4.5"
                  fontFamily="var(--font-inter)"
                >
                  {svgPoints[idx].label}
                </text>
              ))}
        </svg>
        <div className="flex justify-between mt-1" style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#9A9A9A" }}>
          <span>
            First: {values[0].toFixed(1)}{unit}
          </span>
          <span>
            Latest: {values[values.length - 1].toFixed(1)}{unit}
          </span>
        </div>
      </div>
    );
  }

  function GoalsTab() {
    return (
      <div className="flex flex-col gap-6">
        {/* Add Goal Toggle */}
        <button
          onClick={() => setGoalFormOpen(!goalFormOpen)}
          style={{
            backgroundColor: "#1A1A1A",
            border: "1px solid #252525",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "#C45B28",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: "var(--font-inter)",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "18px" }}>{goalFormOpen ? "\u2212" : "+"}</span>
          {goalFormOpen ? "Cancel" : "Add New Goal"}
        </button>

        {/* Goal Form */}
        {goalFormOpen && (
          <div
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
              padding: "16px",
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: "13px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Site</label>
              <select
                value={goalSite}
                onChange={(e) => setGoalSite(e.target.value)}
                style={{
                  backgroundColor: "#0F0F0F",
                  border: "1px solid #333333",
                  borderRadius: "8px",
                  color: "#E8E2D8",
                  fontFamily: "var(--font-inter)",
                  padding: "12px 14px",
                  fontSize: "16px",
                  width: "100%",
                  outline: "none",
                }}
              >
                {GOAL_SITE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: "13px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Target Value {goalSite === "weight_lbs" ? "(lbs)" : "(inches)"}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.25"
                min="0"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                style={{
                  backgroundColor: "#0F0F0F",
                  border: "1px solid #333333",
                  borderRadius: "8px",
                  color: "#E8E2D8",
                  fontFamily: "var(--font-inter)",
                  padding: "12px 14px",
                  fontSize: "16px",
                  width: "100%",
                  outline: "none",
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: "13px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Target Date (optional)
              </label>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                style={{
                  backgroundColor: "#0F0F0F",
                  border: "1px solid #333333",
                  borderRadius: "8px",
                  color: "#E8E2D8",
                  fontFamily: "var(--font-inter)",
                  padding: "12px 14px",
                  fontSize: "16px",
                  width: "100%",
                  outline: "none",
                }}
              />
            </div>
            <button
              onClick={handleSaveGoal}
              disabled={goalSaving || goalTarget === ""}
              style={{
                backgroundColor: "#C45B28",
                color: "#FFFFFF",
                borderRadius: "10px",
                height: "48px",
                fontFamily: "var(--font-oswald)",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "none",
                cursor: goalSaving || goalTarget === "" ? "not-allowed" : "pointer",
                opacity: goalSaving || goalTarget === "" ? 0.5 : 1,
                width: "100%",
              }}
            >
              {goalSaving ? "Saving..." : "Save Goal"}
            </button>
          </div>
        )}

        {/* Goals List */}
        {goals.length === 0 && !goalFormOpen && (
          <EmptyState message="No goals set yet. Add a goal to track your progress." actionLabel="Add Goal" onAction={() => setGoalFormOpen(true)} />
        )}

        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
      </div>
    );
  }

  function GoalCard({ goal }: { goal: MeasurementGoal }) {
    const current = getCurrentValue(goal.site);
    const first = getFirstValue(goal.site);
    const target = goal.target_inches;

    // Determine if goal is reached
    const isCircumference = goal.site !== "weight_lbs";
    const reached = current != null && (isCircumference ? current <= target : current <= target);

    // Progress bar
    let progressPct = 0;
    if (first != null && current != null && first !== target) {
      progressPct = Math.min(100, Math.max(0, ((first - current) / (first - target)) * 100));
    }

    const remaining = current != null ? current - target : null;

    return (
      <div
        style={{
          backgroundColor: reached ? "#0A1A0A" : "#161616",
          border: reached ? "1px solid #2A6A4A" : "1px solid #252525",
          borderRadius: "12px",
          padding: "16px",
          position: "relative",
          overflow: "hidden",
        }}
        className={reached ? "confetti-celebration" : ""}
      >
        {reached && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              animation: "confettiBurst 0.8s ease-out",
            }}
          />
        )}
        <div className="flex items-start justify-between">
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#E8E2D8", fontFamily: "var(--font-oswald)" }}>
              {siteLabel(goal.site)}
            </p>
            <p style={{ fontSize: "13px", color: "#9A9A9A", fontFamily: "var(--font-inter)", marginTop: "2px" }}>
              Target: {target}{goal.site === "weight_lbs" ? " lbs" : "\""}
              {goal.target_date ? ` by ${formatDate(goal.target_date + "T00:00:00")}` : ""}
            </p>
          </div>
          <button
            onClick={() => handleDeleteGoal(goal.id)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#9A9A9A",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 1,
            }}
            aria-label="Delete goal"
          >
            &times;
          </button>
        </div>

        {reached ? (
          <div className="flex items-center gap-2 mt-3">
            <svg viewBox="0 0 20 20" width={20} height={20} fill="none">
              <circle cx={10} cy={10} r={9} stroke="#2A6A4A" strokeWidth={2} />
              <path d="M6 10L9 13L14 7" stroke="#2A6A4A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ color: "#2A6A4A", fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-oswald)", letterSpacing: "0.05em" }}>
              GOAL REACHED!
            </span>
          </div>
        ) : (
          <div className="mt-3">
            <div className="rounded-full overflow-hidden" style={{ height: "6px", backgroundColor: "#252525" }}>
              <div
                className="rounded-full"
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  backgroundColor: "#C45B28",
                  transition: "width 0.3s",
                }}
              />
            </div>
            {remaining != null && (
              <p style={{ fontSize: "12px", color: "#9A9A9A", fontFamily: "var(--font-inter)", marginTop: "6px" }}>
                {remaining > 0
                  ? `${remaining.toFixed(1)} ${goal.site === "weight_lbs" ? "lbs" : "inches"} to go`
                  : "On target!"}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel: string; onAction: () => void }) {
    return (
      <div
        className="flex flex-col items-center text-center gap-4 py-16 rounded-xl"
        style={{ backgroundColor: "#161616", border: "1px solid #252525" }}
      >
        <svg viewBox="0 0 48 48" width={48} height={48} fill="none">
          <circle cx="24" cy="24" r="20" stroke="#C45B28" strokeWidth="2" opacity="0.4" />
          <path d="M16 28C16 28 19 32 24 32C29 32 32 28 32 28" stroke="#C45B28" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="14" x2="24" y2="22" stroke="#C45B28" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="18" x2="28" y2="18" stroke="#C45B28" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p style={{ fontSize: "15px", color: "#9A9A9A", fontFamily: "var(--font-inter)", maxWidth: "260px" }}>{message}</p>
        <button
          onClick={onAction}
          style={{
            backgroundColor: "#C45B28",
            color: "#FFFFFF",
            borderRadius: "10px",
            padding: "10px 24px",
            fontFamily: "var(--font-oswald)",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      </div>
    );
  }

  // --------------- No auth state ---------------

  if (!loading && !userId) {
    return (
      <main className="min-h-screen flex flex-col px-6 py-10" style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}>
        <div className="max-w-2xl w-full mx-auto flex flex-col items-center justify-center gap-4 py-20">
          <p style={{ fontSize: "16px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Please log in to track measurements.
          </p>
          <Link
            href="/login"
            style={{
              backgroundColor: "#C45B28",
              color: "#FFFFFF",
              borderRadius: "10px",
              padding: "12px 28px",
              fontFamily: "var(--font-oswald)",
              fontSize: "16px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            LOG IN
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  // --------------- Main render ---------------

  return (
    <main className="min-h-screen flex flex-col px-6 py-10" style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}>
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-28">
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
              Measurements
            </h1>
          </div>
        </header>

        {/* Tabs */}
        <TabBar />

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-4">
            <Skeleton h={40} />
            <Skeleton h={120} />
            <Skeleton h={80} />
            <Skeleton h={80} />
          </div>
        )}

        {/* Tab Content */}
        {!loading && tab === "log" && <LogTab />}
        {!loading && tab === "dashboard" && <DashboardTab />}
        {!loading && tab === "history" && <HistoryTab />}
        {!loading && tab === "goals" && <GoalsTab />}
      </div>
      <BottomNav />
    </main>
  );
}
