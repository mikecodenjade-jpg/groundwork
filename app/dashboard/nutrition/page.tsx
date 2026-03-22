"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const TARGETS = { calories: 2400, protein: 180, carbs: 250, fat: 80 };

const FAST_FOOD = [
  { place: "Chick-fil-A", item: "Grilled Nuggets (12-count)", cal: 380, protein: 47, carbs: 9, fat: 9 },
  { place: "Whataburger", item: "Grilled Chicken (no bun)", cal: 310, protein: 34, carbs: 6, fat: 16 },
  { place: "Chipotle", item: "Bowl — Double Protein, No Rice", cal: 520, protein: 62, carbs: 28, fat: 18 },
  { place: "McDonald's", item: "Egg McMuffin", cal: 300, protein: 17, carbs: 30, fat: 12 },
  { place: "Subway", item: "Rotisserie Chicken (6-inch)", cal: 440, protein: 36, carbs: 48, fat: 8 },
];

type MealLog = {
  id: string;
  meal_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
};

function pct(val: number, target: number) {
  return Math.min(100, Math.round((val / target) * 100));
}

export default function NutritionPage() {
  const [todayLogs, setTodayLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function fetchTodayLogs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    setTodayLogs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchTodayLogs(); }, []);

  const totals = todayLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories ?? 0),
      protein: acc.protein + (log.protein_g ?? 0),
      carbs: acc.carbs + (log.carbs_g ?? 0),
      fat: acc.fat + (log.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("meal_logs").insert({
      user_id: user.id,
      meal_name: mealName.trim(),
      calories: Number(calories) || 0,
      protein_g: Number(protein) || 0,
      carbs_g: Number(carbs) || 0,
      fat_g: Number(fat) || 0,
    });

    setMealName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    fetchTodayLogs();
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
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back to dashboard"
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
              Pillar
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Fuel
            </h1>
          </div>
        </header>

        {/* Daily Tracker */}
        <section
          className="px-7 py-6 flex flex-col gap-5"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
        >
          <div className="flex items-baseline justify-between">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Today&apos;s Intake
            </p>
            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
              {totals.calories}{" "}
              <span className="text-sm font-normal" style={{ color: "#9A9A9A" }}>
                / {TARGETS.calories} cal
              </span>
            </span>
          </div>

          {/* Calorie bar */}
          <div className="h-2 w-full" style={{ backgroundColor: "#252525" }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${pct(totals.calories, TARGETS.calories)}%`, backgroundColor: "#C45B28" }}
            />
          </div>

          {/* Macro bars */}
          {[
            { label: "Protein", val: totals.protein, target: TARGETS.protein, unit: "g", color: "#C45B28" },
            { label: "Carbs", val: totals.carbs, target: TARGETS.carbs, unit: "g", color: "#9A9A9A" },
            { label: "Fat", val: totals.fat, target: TARGETS.fat, unit: "g", color: "#9A9A9A" },
          ].map(({ label, val, target, unit, color }) => (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs" style={{ color: "#9A9A9A" }}>
                <span style={{ fontFamily: "var(--font-inter)", letterSpacing: "0.1em" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-inter)" }}>
                  {val}
                  {unit} / {target}
                  {unit}
                </span>
              </div>
              <div className="h-1.5 w-full" style={{ backgroundColor: "#252525" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct(val, target)}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* Log Meal */}
        <section className="flex flex-col gap-5">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Log a Meal
          </p>
          <form onSubmit={handleLog} className="flex flex-col gap-4">
            <input
              type="text"
              required
              placeholder="Meal name"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "8px",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
              }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Calories", val: calories, set: setCalories },
                { label: "Protein (g)", val: protein, set: setProtein },
                { label: "Carbs (g)", val: carbs, set: setCarbs },
                { label: "Fat (g)", val: fat, set: setFat },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label
                    className="text-xs uppercase tracking-widest"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    className="px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                    style={{
                      backgroundColor: "#161616",
                      border: "1px solid #252525",
                      borderRadius: "8px",
                      color: "#E8E2D8",
                      fontFamily: "var(--font-inter)",
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "#C45B28",
                color: "#0A0A0A",
                borderRadius: "8px",
                fontFamily: "var(--font-inter)",
                fontWeight: 600,
                minHeight: "48px",
              }}
            >
              {saved ? "✓ Logged" : saving ? "Saving..." : "Log Meal"}
            </button>
          </form>
        </section>

        {/* Today's meals */}
        {!loading && todayLogs.length > 0 && (
          <section className="flex flex-col gap-4">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Logged Today
            </p>
            <div className="flex flex-col gap-3">
              {todayLogs.map((log) => (
                <div
                  key={log.id}
                  className="px-5 py-4 flex items-center justify-between"
                  style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
                >
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                      {log.meal_name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      P: {log.protein_g}g · C: {log.carbs_g}g · F: {log.fat_g}g
                    </p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                    {log.calories} cal
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Jobsite Eating Guide */}
        <section className="flex flex-col gap-5">
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Jobsite Eating Guide
            </p>
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Best options when you&apos;re stuck in a drive-through.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {FAST_FOOD.map((item) => (
              <div
                key={item.place}
                className="px-6 py-5"
                style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h3
                    className="text-base font-bold uppercase"
                    style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                  >
                    {item.place}
                  </h3>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                  >
                    {item.cal} cal
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  {item.item}
                </p>
                <div className="flex gap-4 text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  <span>
                    Protein:{" "}
                    <span style={{ color: "#9A9A9A" }}>{item.protein}g</span>
                  </span>
                  <span>
                    Carbs:{" "}
                    <span style={{ color: "#9A9A9A" }}>{item.carbs}g</span>
                  </span>
                  <span>
                    Fat:{" "}
                    <span style={{ color: "#9A9A9A" }}>{item.fat}g</span>
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
