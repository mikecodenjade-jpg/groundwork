"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// âââ Types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface FoodResult {
  id: string;
  description: string;
  brand_owner: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  serving_size: number | null;
  serving_size_unit: string | null;
  household_serving_text: string | null;
}

interface MealLog {
  id: string;
  food_name: string;
  name: string;
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  meal_type: MealType;
  logged_at: string;
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// âââ Goals (later pull from user profile) ââââââââââââââââââââââââââââââââââââ
const GOALS = { calories: 2800, protein: 180, carbs: 300, fat: 90 };

function pct(val: number, goal: number) {
  return Math.min(Math.round((val / goal) * 100), 100);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// MAIN COMPONENT
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export default function FuelPage() {
  const [mode, setMode] = useState<"home" | "search" | "confirm">("home");
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [totals, setTotals] = useState<DailyTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [servings, setServings] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // âââ Load today's meals ââââââââââââââââââââââââââââââââââââââââââââââââââ
  const loadMeals = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("meal_logs")
      .select("*")
      .gte("logged_at", `${today}T00:00:00`)
      .lte("logged_at", `${today}T23:59:59`)
      .order("logged_at", { ascending: false });

    if (data) {
      setMeals(data);
      const t = data.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories || 0),
          protein: acc.protein + Number(m.protein_g || 0),
          carbs: acc.carbs + Number(m.carb_g || 0),
          fat: acc.fat + Number(m.fat_g || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setTotals(t);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  // âââ Auto-detect meal type by time of day ââââââââââââââââââââââââââââââââ
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 10) setSelectedMealType("breakfast");
    else if (h < 14) setSelectedMealType("lunch");
    else if (h < 17) setSelectedMealType("snack");
    else setSelectedMealType("dinner");
  }, []);

  // âââ Search USDA foods via full-text search âââââââââââââââââââââââââââââââââ
  const searchFoods = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const tsQuery = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(" & ");
    const { data } = await supabase
      .from("usda_foods")
      .select(
        "id, description, brand_owner, calories, protein_g, carbs_g, fat_g, serving_size, serving_size_unit, household_serving_text"
      )
      .textSearch("search_vector", tsQuery, { type: "plain" })
      .not("calories", "is", null)
      .gt("calories", 0)
      .order("description")
      .limit(25);

    setSearchResults(data || []);
    setSearching(false);
  }, []);

  const onSearchInput = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFoods(val), 300);
  };

  // âââ Log meal ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const logMeal = async () => {
    if (!selectedFood) return;
    setSaving(true);
    const cal = Math.round((selectedFood.calories || 0) * servings);
    const pro = Math.round((Number(selectedFood.protein_g) || 0) * servings);
    const carb = Math.round((Number(selectedFood.carbs_g) || 0) * servings);
    const fat = Math.round((Number(selectedFood.fat_g) || 0) * servings);

    const { error } = await supabase.from("meal_logs").insert({
      food_name: selectedFood.description,
      name: selectedFood.description,
      calories: cal,
      protein_g: pro,
      carb_g: carb,
      fat_g: fat,
      meal_type: selectedMealType,
      logged_at: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
    });

    setSaving(false);
    if (!error) {
      setToast(`Logged ${cal} cal`);
      setTimeout(() => setToast(""), 2000);
      setMode("home");
      setSelectedFood(null);
      setSearchQuery("");
      setSearchResults([]);
      setServings(1);
      loadMeals();
    }
  };

  // âââ Delete meal âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const deleteMeal = async (id: string) => {
    await supabase.from("meal_logs").delete().eq("id", id);
    loadMeals();
  };

  // âââ Loading skeleton ââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
                height: i === 1 ? 160 : 72,
              }}
            />
          ))}
        </div>
        <BottomNav />
      </main>
    );
  }

  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // CONFIRM SCREEN
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  if (mode === "confirm" && selectedFood) {
    const cal = Math.round((selectedFood.calories || 0) * servings);
    const pro = Math.round((Number(selectedFood.protein_g) || 0) * servings);
    const carb = Math.round((Number(selectedFood.carbs_g) || 0) * servings);
    const fat = Math.round((Number(selectedFood.fat_g) || 0) * servings);

    return (
      <main
        className="min-h-screen flex flex-col px-6 py-10"
        style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
      >
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-6 pb-28">
          {/* Header */}
          <header className="flex items-center gap-4">
            <button
              onClick={() => {
                setMode("search");
                setSelectedFood(null);
              }}
              className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
              style={{ border: "1px solid #252525", borderRadius: 8 }}
              aria-label="Back to search"
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
            </button>
            <h1
              className="text-2xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              Log Food
            </h1>
          </header>

          {/* Food info card */}
          <div
            className="px-6 py-5"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: 12,
            }}
          >
            <h2
              className="text-lg font-bold mb-1"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              {selectedFood.description}
            </h2>
            {selectedFood.brand_owner && (
              <p className="text-sm mb-2" style={{ color: "#9A9A9A" }}>
                {selectedFood.brand_owner}
              </p>
            )}
            <p className="text-sm" style={{ color: "#9A9A9A" }}>
              Serving: {selectedFood.serving_size}
              {selectedFood.serving_size_unit}
              {selectedFood.household_serving_text &&
                ` (${selectedFood.household_serving_text})`}
            </p>
          </div>

          {/* Servings adjuster */}
          <div
            className="px-6 py-5"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: 12,
            }}
          >
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Servings
            </p>
            <div className="flex items-center gap-5 justify-center">
              <button
                onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                className="flex items-center justify-center w-12 h-12 text-xl font-bold transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #252525",
                  borderRadius: "50%",
                  color: "#E8E2D8",
                }}
              >
                -
              </button>
              <span
                className="text-3xl font-bold min-w-[3rem] text-center"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                {servings}
              </span>
              <button
                onClick={() => setServings(servings + 0.5)}
                className="flex items-center justify-center w-12 h-12 text-xl font-bold transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #252525",
                  borderRadius: "50%",
                  color: "#E8E2D8",
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Meal type selector */}
          <div
            className="px-6 py-5"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: 12,
            }}
          >
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Meal
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedMealType(type)}
                    className="py-3 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-150 active:scale-95"
                    style={{
                      fontFamily: "var(--font-inter)",
                      borderRadius: 20,
                      backgroundColor:
                        selectedMealType === type ? "#C45B28" : "#0A0A0A",
                      color:
                        selectedMealType === type ? "#0A0A0A" : "#9A9A9A",
                      border: `1px solid ${selectedMealType === type ? "#C45B28" : "#252525"}`,
                    }}
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Macro preview */}
          <div
            className="px-6 py-5"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: 12,
            }}
          >
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "var(--font-oswald)",
                    color: "#C45B28",
                  }}
                >
                  {cal}
                </div>
                <div
                  className="text-xs uppercase tracking-wider mt-1"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  cal
                </div>
              </div>
              <div>
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-oswald)", color: "#5B9BD5" }}
                >
                  {pro}g
                </div>
                <div
                  className="text-xs uppercase tracking-wider mt-1"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  protein
                </div>
              </div>
              <div>
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-oswald)", color: "#D4A843" }}
                >
                  {carb}g
                </div>
                <div
                  className="text-xs uppercase tracking-wider mt-1"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  carbs
                </div>
              </div>
              <div>
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-oswald)", color: "#D4637A" }}
                >
                  {fat}g
                </div>
                <div
                  className="text-xs uppercase tracking-wider mt-1"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  fat
                </div>
              </div>
            </div>
          </div>

          {/* Log button */}
          <button
            onClick={logMeal}
            disabled={saving}
            className="w-full py-4 text-sm font-semibold uppercase tracking-[0.15em] transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{
              fontFamily: "var(--font-inter)",
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
              border: "1px solid #C45B28",
              borderRadius: 20,
            }}
          >
            {saving ? "Logging..." : `Log ${cal} Calories`}
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // SEARCH SCREEN
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  if (mode === "search") {
    return (
      <main
        className="min-h-screen flex flex-col px-6 py-10"
        style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
      >
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-4 pb-28">
          {/* Header */}
          <header className="flex items-center gap-4 mb-2">
            <button
              onClick={() => {
                setMode("home");
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
              style={{ border: "1px solid #252525", borderRadius: 8 }}
              aria-label="Back to fuel"
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
            </button>
            <h1
              className="text-2xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              Search Food
            </h1>
          </header>

          {/* Search input */}
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchInput(e.target.value)}
              placeholder="Search 300,000+ foods..."
              autoFocus
              className="w-full px-5 py-4 text-sm outline-none transition-colors"
              style={{
                fontFamily: "var(--font-inter)",
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: 12,
                color: "#E8E2D8",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "#C45B28")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "#252525")
              }
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  searchRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm transition-opacity hover:opacity-60"
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
              className="text-center py-8 text-sm animate-pulse"
              style={{ color: "#9A9A9A" }}
            >
              Searching...
            </div>
          )}

          {/* No results */}
          {!searching &&
            searchQuery.length >= 2 &&
            searchResults.length === 0 && (
              <div
                className="text-center py-8 text-sm"
                style={{ color: "#9A9A9A" }}
              >
                No foods found for &ldquo;{searchQuery}&rdquo;
              </div>
            )}

          {/* Results list */}
          <div className="flex flex-col gap-2">
            {searchResults.map((food) => (
              <button
                key={food.id}
                onClick={() => {
                  setSelectedFood(food);
                  setMode("confirm");
                }}
                className="w-full text-left px-5 py-4 transition-all duration-150 active:scale-[0.98] hover:opacity-80"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #252525",
                  borderRadius: 12,
                }}
              >
                <div
                  className="text-sm font-medium leading-tight mb-1"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "#E8E2D8",
                  }}
                >
                  {food.description}
                </div>
                {food.brand_owner && (
                  <div
                    className="text-xs mb-2"
                    style={{ color: "#9A9A9A" }}
                  >
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

          {/* Empty prompt */}
          {!searching && searchQuery.length < 2 && (
            <div className="text-center py-16">
              <svg
                viewBox="0 0 24 24"
                width={32}
                height={32}
                fill="none"
                stroke="#9A9A9A"
                strokeWidth={1.5}
                strokeLinecap="round"
                className="mx-auto mb-4 opacity-40"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21L16.65 16.65" />
              </svg>
              <p className="text-sm" style={{ color: "#9A9A9A" }}>
                Type at least 2 characters to search
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: "#9A9A9A", opacity: 0.6 }}
              >
                Try &ldquo;chicken breast&rdquo;, &ldquo;protein bar&rdquo;,
                or a brand name
              </p>
            </div>
          )}
        </div>
        <BottomNav />
      </main>
    );
  }

  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // HOME SCREEN
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const calPct = pct(totals.calories, GOALS.calories);
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
              animation: "fadeInUp 0.3s ease-out",
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

        {/* Date subtitle */}
        <p className="text-xs" style={{ color: "#9A9A9A", marginTop: -8 }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>

        {/* Calorie Ring + Macros card */}
        <div
          className="px-6 py-6"
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: 12,
          }}
        >
          <div className="flex items-center gap-6">
            {/* SVG ring */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#252525"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={calPct >= 100 ? "#D4637A" : "#C45B28"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${calPct * 2.64} 264`}
                  style={{ transition: "stroke-dasharray 0.7s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "var(--font-oswald)",
                    color: "#E8E2D8",
                  }}
                >
                  {Math.round(totals.calories)}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "#9A9A9A" }}
                >
                  cal
                </span>
              </div>
            </div>

            {/* Macro bars */}
            <div className="flex-1">
              <div className="text-sm mb-1" style={{ color: "#E8E2D8" }}>
                {remaining > 0
                  ? `${remaining} cal remaining`
                  : "Goal reached"}
              </div>
              <div
                className="text-xs mb-4"
                style={{ color: "#9A9A9A", opacity: 0.6 }}
              >
                of {GOALS.calories} daily goal
              </div>

              {[
                {
                  label: "Protein",
                  val: totals.protein,
                  goal: GOALS.protein,
                  color: "#5B9BD5",
                },
                {
                  label: "Carbs",
                  val: totals.carbs,
                  goal: GOALS.carbs,
                  color: "#D4A843",
                },
                {
                  label: "Fat",
                  val: totals.fat,
                  goal: GOALS.fat,
                  color: "#D4637A",
                },
              ].map((m) => (
                <div key={m.label} className="mb-2">
                  <div
                    className="flex justify-between text-xs mb-0.5"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    <span style={{ color: "#9A9A9A" }}>{m.label}</span>
                    <span style={{ color: "#E8E2D8" }}>
                      {Math.round(m.val)}/{m.goal}g
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
          </div>
        </div>

        {/* Log Food CTA */}
        <button
          onClick={() => setMode("search")}
          className="w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] transition-all duration-150 active:scale-[0.98]"
          style={{
            fontFamily: "var(--font-inter)",
            backgroundColor: "#C45B28",
            color: "#0A0A0A",
            border: "1px solid #C45B28",
            borderRadius: 20,
          }}
        >
          <svg
            viewBox="0 0 16 16"
            width={14}
            height={14}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M8 3V13M3 8H13" />
          </svg>
          Log Food
        </button>

        {/* Today's Meals */}
        {meals.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Today
            </p>
            <div className="flex flex-col gap-2">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: 12,
                  }}
                >
                  {/* Meal type badge */}
                  <div
                    className="flex items-center justify-center w-9 h-9 text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
                    style={{
                      backgroundColor: "#0A0A0A",
                      border: "1px solid #252525",
                      borderRadius: 8,
                      color: "#C45B28",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {meal.meal_type?.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{
                        fontFamily: "var(--font-inter)",
                        color: "#E8E2D8",
                      }}
                    >
                      {meal.food_name || meal.name}
                    </div>
                    <div
                      className="flex gap-3 text-xs mt-0.5"
                      style={{ color: "#9A9A9A" }}
                    >
                      <span>{formatTime(meal.logged_at)}</span>
                      <span style={{ color: "#5B9BD5" }}>
                        P{Math.round(Number(meal.protein_g))}g
                      </span>
                      <span style={{ color: "#D4A843" }}>
                        C{Math.round(Number(meal.carb_g))}g
                      </span>
                      <span style={{ color: "#D4637A" }}>
                        F{Math.round(Number(meal.fat_g))}g
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="font-bold text-sm"
                      style={{
                        color: "#C45B28",
                        fontFamily: "var(--font-oswald)",
                      }}
                    >
                      {meal.calories}
                    </div>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="text-[10px] uppercase tracking-wider mt-1 transition-opacity hover:opacity-60"
                      style={{
                        color: "#9A9A9A",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {meals.length === 0 && (
          <div className="text-center py-12">
            <svg
              viewBox="0 0 24 24"
              width={40}
              height={40}
              fill="none"
              stroke="#9A9A9A"
              strokeWidth={1}
              strokeLinecap="round"
              className="mx-auto mb-4 opacity-30"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
            >
              No meals logged yet
            </p>
            <p className="text-xs" style={{ color: "#9A9A9A" }}>
              Tap &ldquo;Log Food&rdquo; to get started
            </p>
          </div>
        )}

        {/* Cooler Prep link */}
        <Link
          href="/dashboard/fuel/cooler-prep"
          className="flex items-center justify-between px-6 py-4 transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: 12,
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span
              className="text-sm font-bold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
            >
              Cooler Prep
            </span>
            <span
              className="text-xs"
              style={{ fontFamily: "var(--font-inter)", color: "#9A9A9A" }}
            >
              Plan meals for the job site
            </span>
          </div>
          <span style={{ color: "#C45B28", fontSize: 18 }}>&rsaquo;</span>
        </Link>
      </div>
      <BottomNav />
    </main>
  );
}
