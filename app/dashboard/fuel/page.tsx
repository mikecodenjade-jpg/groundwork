"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FoodResult {
  id: string;
  description: string;
  brand_owner: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

interface MealLog {
  id: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ─── Daily Goals ─────────────────────────────────────────────────────────────
const GOALS = { calories: 2500, protein: 150, carbs: 300, fat: 80 };

function pct(val: number, goal: number) {
  return Math.min(Math.round((val / goal) * 100), 100);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function FuelPage() {
  const [totals, setTotals] = useState<DailyTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load today's totals + last 10 recent logs ───────────────────────────
  const loadData = useCallback(async () => {
    const today = new Date().toLocaleDateString("en-CA");

    const [todayResult, recentResult] = await Promise.all([
      supabase
        .from("meal_logs")
        .select("calories, protein_g, carbs_g, fat_g")
        .gte("logged_at", `${today}T00:00:00`)
        .lte("logged_at", `${today}T23:59:59`),
      supabase
        .from("meal_logs")
        .select("id, description, calories, protein_g, carbs_g, fat_g, logged_at")
        .order("logged_at", { ascending: false })
        .limit(10),
    ]);

    if (todayResult.data) {
      const t = todayResult.data.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories || 0),
          protein: acc.protein + Number(m.protein_g || 0),
          carbs: acc.carbs + Number(m.carbs_g || 0),
          fat: acc.fat + Number(m.fat_g || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setTotals(t);
    }

    if (recentResult.data) {
      setRecentMeals(recentResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Search USDA foods ────────────────────────────────────────────────────
  const searchFoods = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("usda_foods")
      .select("id, description, brand_owner, calories, protein_g, carbs_g, fat_g")
      .ilike("description", `%${query}%`)
      .not("calories", "is", null)
      .gt("calories", 0)
      .order("description")
      .limit(20);

    setSearchResults(data || []);
    setSearching(false);
  }, []);

  const onSearchInput = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFoods(val), 300);
  };

  // ─── Log a food immediately on tap ───────────────────────────────────────
  const logFood = async (food: FoodResult) => {
    setLogging(food.id);
    const { error } = await supabase.from("meal_logs").insert({
      fdc_id: food.id,
      description: food.description,
      calories: Math.round(food.calories || 0),
      protein_g: Math.round(Number(food.protein_g) || 0),
      carbs_g: Math.round(Number(food.carbs_g) || 0),
      fat_g: Math.round(Number(food.fat_g) || 0),
      logged_at: new Date().toISOString(),
    });

    setLogging(null);
    if (!error) {
      setToast(`Logged ${Math.round(food.calories || 0)} cal`);
      setTimeout(() => setToast(""), 2500);
      setSearchQuery("");
      setSearchResults([]);
      loadData();
    }
  };

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <main
        className="min-h-screen flex flex-col px-6 py-10"
        style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
      >
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-6 pb-28">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                backgroundColor: "#161616",
                borderRadius: 12,
                height: i === 1 ? 180 : 72,
              }}
            />
          ))}
        </div>
        <BottomNav />
      </main>
    );
  }

  const remaining = Math.max(0, GOALS.calories - totals.calories);

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-6 pb-28">
        {/* Toast */}
        {toast && (
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 font-semibold text-sm shadow-lg z-50"
            style={{
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
              borderRadius: 20,
              fontFamily: "var(--font-inter)",
            }}
          >
            {toast}
          </div>
        )}

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", borderRadius: 8 }}
            aria-label="Back to dashboard"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              width={16}
              height={16}
              stroke="#9A9A9A"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 4L7 10L13 16" />
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

        {/* Date */}
        <p className="text-xs" style={{ color: "#9A9A9A", marginTop: -8 }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>

        {/* ─── Daily Tracker ─── */}
        <div
          className="px-6 py-6"
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: 12,
          }}
        >
          {/* Calorie summary row */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span
                className="text-4xl font-bold"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                {Math.round(totals.calories)}
              </span>
              <span
                className="text-sm ml-1.5"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                / {GOALS.calories} cal
              </span>
            </div>
            <span
              className="text-sm"
              style={{ color: remaining > 0 ? "#9A9A9A" : "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              {remaining > 0 ? `${remaining} remaining` : "Goal reached"}
            </span>
          </div>

          {/* Calorie bar */}
          <div
            className="h-2 mb-5 overflow-hidden"
            style={{ backgroundColor: "#252525", borderRadius: 4 }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct(totals.calories, GOALS.calories)}%`,
                backgroundColor: pct(totals.calories, GOALS.calories) >= 100 ? "#D4637A" : "#C45B28",
                borderRadius: 4,
                transition: "width 0.7s ease",
              }}
            />
          </div>

          {/* Macro rows */}
          {[
            { label: "Protein", val: totals.protein, goal: GOALS.protein, color: "#5B9BD5" },
            { label: "Carbs", val: totals.carbs, goal: GOALS.carbs, color: "#D4A843" },
            { label: "Fat", val: totals.fat, goal: GOALS.fat, color: "#D4637A" },
          ].map((m) => (
            <div key={m.label} className="mb-3">
              <div
                className="flex justify-between text-xs mb-1"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                <span style={{ color: "#9A9A9A" }}>{m.label}</span>
                <span style={{ color: "#E8E2D8" }}>
                  {Math.round(m.val)}g / {m.goal}g
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden"
                style={{ backgroundColor: "#252525", borderRadius: 4 }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct(m.val, m.goal)}%`,
                    backgroundColor: m.color,
                    borderRadius: 4,
                    transition: "width 0.7s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ─── Search ─── */}
        <div>
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke="#9A9A9A"
              strokeWidth={1.8}
              strokeLinecap="round"
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21L16.65 16.65" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchInput(e.target.value)}
              placeholder="Search foods..."
              className="w-full pl-11 pr-10 outline-none transition-colors"
              style={{
                fontFamily: "var(--font-inter)",
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: 12,
                color: "#E8E2D8",
                fontSize: 15,
                height: 56,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C45B28")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#252525")}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  searchRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                style={{ color: "#9A9A9A" }}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M4 4L12 12M12 4L4 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Searching indicator */}
          {searching && (
            <div
              className="text-center py-6 text-sm animate-pulse"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Searching...
            </div>
          )}

          {/* No results */}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div
              className="text-center py-6 text-sm"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              No foods found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => logFood(food)}
                  disabled={logging === food.id}
                  className="w-full text-left px-5 py-4 transition-all duration-150 active:scale-[0.98] hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: 12,
                    minHeight: 48,
                  }}
                >
                  <div
                    className="text-sm font-medium leading-tight mb-1"
                    style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                  >
                    {logging === food.id ? "Logging..." : food.description}
                  </div>
                  {food.brand_owner && (
                    <div className="text-xs mb-2" style={{ color: "#9A9A9A" }}>
                      {food.brand_owner}
                    </div>
                  )}
                  <div
                    className="flex gap-4 text-xs"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    <span style={{ color: "#C45B28", fontWeight: 600 }}>
                      {Math.round(food.calories || 0)} cal
                    </span>
                    <span style={{ color: "#5B9BD5" }}>
                      P {Math.round(Number(food.protein_g) || 0)}g
                    </span>
                    <span style={{ color: "#D4A843" }}>
                      C {Math.round(Number(food.carbs_g) || 0)}g
                    </span>
                    <span style={{ color: "#D4637A" }}>
                      F {Math.round(Number(food.fat_g) || 0)}g
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Recent ─── */}
        {recentMeals.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Recent
            </p>
            <div className="flex flex-col gap-2">
              {recentMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: 12,
                    minHeight: 48,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                    >
                      {meal.description}
                    </div>
                    <div
                      className="flex gap-3 text-xs mt-0.5"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      <span style={{ color: "#9A9A9A" }}>
                        {new Date(meal.logged_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span style={{ color: "#5B9BD5" }}>P{Math.round(Number(meal.protein_g))}g</span>
                      <span style={{ color: "#D4A843" }}>C{Math.round(Number(meal.carbs_g))}g</span>
                      <span style={{ color: "#D4637A" }}>F{Math.round(Number(meal.fat_g))}g</span>
                    </div>
                  </div>
                  <div
                    className="font-bold text-sm flex-shrink-0"
                    style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
                  >
                    {meal.calories} cal
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
