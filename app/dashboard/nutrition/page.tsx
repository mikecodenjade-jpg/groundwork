h"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface FoodResult {
  id: string;
  fdc_id: number;
  description: string;
  brand_owner: string | null;
  brand_name: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  serving_size: number | null;
  serving_size_unit: string | null;
  household_serving_text: string | null;
  gtin_upc: string | null;
}

interface MealLog {
  id: string;
  name: string;
  food_name: string | null;
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  meal_type: string | null;
  logged_at: string;
  date: string;
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ââ Constants ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const GOALS = { calories: 2400, protein: 180, carbs: 250, fat: 80 };

// ââ Component ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export default function NutritionPage() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [mode, setMode] = useState<"home" | "confirm" | "scanner">("home");
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [logging, setLogging] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);

  // ââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const n = (v: number | null | undefined) => Number(v) || 0;

  // ââ Data fetching âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  const fetchTodayMeals = useCallback(async () => {
    const { data } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("date", todayISO())
      .order("logged_at", { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      setRecentMeals(data as MealLog[]);
      const totals = (data as MealLog[]).reduce(
        (acc, m) => ({
          calories: acc.calories + n(m.calories),
          protein: acc.protein + n(m.protein_g),
          carbs: acc.carbs + n(m.carb_g),
          fat: acc.fat + n(m.fat_g),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setDailyTotals(totals);
    } else {
      setRecentMeals([]);
      setDailyTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
  }, []);

  useEffect(() => {
    fetchTodayMeals();
  }, [fetchTodayMeals]);

  // ââ Search with debounce ââââââââââââââââââââââââââââââââââââââââââââââââ

  const searchFoods = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("usda_foods")
      .select("id, fdc_id, description, brand_owner, brand_name, calories, protein_g, carbs_g, fat_g, serving_size, serving_size_unit, household_serving_text, gtin_upc")
      .textSearch("description", query.trim().split(/\s+/).filter(w => w.length > 0).map(w => w + ":*").join(" & "))
      .limit(20);
    setResults((data as FoodResult[]) || []);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => searchFoods(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, searchFoods]);

  // ââ Log a meal ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  const logMeal = async (food: FoodResult) => {
    setLogging(true);
    await supabase.from("meal_logs").insert({
      name: food.description,
      food_name: food.description,
      calories: n(food.calories),
      protein_g: n(food.protein_g),
      carb_g: n(food.carbs_g),
      fat_g: n(food.fat_g),
      meal_type: "logged",
      date: todayISO(),
      logged_at: new Date().toISOString(),
    });
    setLogging(false);
    setMode("home");
    setSelectedFood(null);
    setSearchQuery("");
    setResults([]);
    fetchTodayMeals();
  };

  // ââ Barcode scanner âââââââââââââââââââââââââââââââââââââââââââââââââââââ

  const startScanner = async () => {
    setMode("scanner");
    setScanError("");
    setScanLoading(false);

    // Dynamically import html5-qrcode
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      // Wait for DOM element
      await new Promise((r) => setTimeout(r, 200));
      if (!scannerRef.current) return;

      const scanner = new Html5Qrcode("barcode-reader");
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText: string) => {
          // Stop scanner immediately
          try { await scanner.stop(); } catch {}
          html5QrRef.current = null;
          setScanLoading(true);

          // 1) Check usda_foods gtin_upc column
          const { data: usdaMatch } = await supabase
            .from("usda_foods")
            .select("id, fdc_id, description, brand_owner, brand_name, calories, protein_g, carbs_g, fat_g, serving_size, serving_size_unit, household_serving_text, gtin_upc")
            .eq("gtin_upc", decodedText)
            .limit(1);

          if (usdaMatch && usdaMatch.length > 0) {
            setSelectedFood(usdaMatch[0] as FoodResult);
            setMode("confirm");
            setScanLoading(false);
            return;
          }

          // 2) Fallback: OpenFoodFacts API
          try {
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`);
            const json = await res.json();
            if (json.status === 1 && json.product) {
              const p = json.product;
              const nm = p.nutriments || {};
              const offFood: FoodResult = {
                id: decodedText,
                fdc_id: 0,
                description: p.product_name || "Unknown product",
                brand_owner: p.brands || null,
                brand_name: p.brands || null,
                calories: nm["energy-kcal_100g"] || nm["energy-kcal"] || null,
                protein_g: nm.proteins_100g || nm.proteins || null,
                carbs_g: nm.carbohydrates_100g || nm.carbohydrates || null,
                fat_g: nm.fat_100g || nm.fat || null,
                serving_size: null,
                serving_size_unit: null,
                household_serving_text: p.serving_size || null,
                gtin_upc: decodedText,
              };
              setSelectedFood(offFood);
              setMode("confirm");
              setScanLoading(false);
              return;
            }
          } catch {}

          setScanError(`No food found for barcode ${decodedText}`);
          setScanLoading(false);
          setMode("home");
        },
        () => {} // ignore scan errors silently
      );
    } catch (err: any) {
      setScanError(err?.message || "Camera not available");
      setMode("home");
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
      html5QrRef.current = null;
    }
    setMode("home");
  };

  // ââ Calorie ring SVG âââââââââââââââââââââââââââââââââââââââââââââââââââ

  const CalorieRing = () => {
    const pct = Math.min(dailyTotals.calories / GOALS.calories, 1);
    const r = 54;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct);
    return (
      <svg width={132} height={132} viewBox="0 0 132 132">
        <circle cx={66} cy={66} r={r} fill="none" stroke="#252525" strokeWidth={10} />
        <circle
          cx={66} cy={66} r={r} fill="none"
          stroke="#C45B28" strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 66 66)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text x={66} y={58} textAnchor="middle" fill="#E8E2D8" fontSize={22} fontWeight={700} style={{ fontFamily: "var(--font-oswald)" }}>
          {dailyTotals.calories}
        </text>
        <text x={66} y={78} textAnchor="middle" fill="#9A9A9A" fontSize={11}>
          / {GOALS.calories} cal
        </text>
      </svg>
    );
  };

  // ââ Macro bar ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  const MacroBar = ({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) => {
    const pct = Math.min(current / goal, 1) * 100;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "#E8E2D8", fontSize: 13, fontFamily: "var(--font-inter)" }}>{label}</span>
          <span style={{ color: "#9A9A9A", fontSize: 13, fontFamily: "var(--font-inter)" }}>
            {current}g / {goal}g
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, backgroundColor: "#252525" }}>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
              width: `${pct}%`,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>
    );
  };

  // ââ Scanner mode âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  if (mode === "scanner") {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "#0A0A0A", color: "#E8E2D8" }}>
        <div style={{ padding: "16px 16px 100px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontFamily: "var(--font-oswald)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Scan Barcode
            </h1>
            <button
              onClick={stopScanner}
              style={{ color: "#9A9A9A", fontSize: 14, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
            >
              Cancel
            </button>
          </div>

          {scanLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ color: "#9A9A9A", fontSize: 14 }}>Looking up barcode...</div>
            </div>
          ) : (
            <div
              id="barcode-reader"
              ref={scannerRef}
              style={{
                width: "100%",
                maxWidth: 400,
                margin: "0 auto",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #252525",
              }}
            />
          )}

          {scanError && (
            <div style={{ textAlign: "center", marginTop: 16, color: "#C45B28", fontSize: 14 }}>
              {scanError}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ââ Confirm mode âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  if (mode === "confirm" && selectedFood) {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "#0A0A0A", color: "#E8E2D8" }}>
        <div style={{ padding: "16px 16px 100px" }}>
          <button
            onClick={() => { setMode("home"); setSelectedFood(null); }}
            style={{ color: "#9A9A9A", fontSize: 14, background: "none", border: "none", cursor: "pointer", marginBottom: 16, fontFamily: "var(--font-inter)" }}
          >
            Back
          </button>

          <div style={{
            backgroundColor: "#161616",
            borderRadius: 12,
            border: "1px solid #252525",
            padding: 20,
          }}>
            <h2 style={{ fontSize: 18, fontFamily: "var(--font-oswald)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              {selectedFood.description}
            </h2>
            {selectedFood.brand_owner && (
              <p style={{ color: "#9A9A9A", fontSize: 13, marginBottom: 16 }}>{selectedFood.brand_owner}</p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Cal", value: n(selectedFood.calories) },
                { label: "Protein", value: `${n(selectedFood.protein_g)}g` },
                { label: "Carbs", value: `${n(selectedFood.carbs_g)}g` },
                { label: "Fat", value: `${n(selectedFood.fat_g)}g` },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ color: "#C45B28", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-oswald)" }}>{item.value}</div>
                  <div style={{ color: "#9A9A9A", fontSize: 11 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {selectedFood.household_serving_text && (
              <p style={{ color: "#9A9A9A", fontSize: 12, marginBottom: 16 }}>
                Serving: {selectedFood.household_serving_text}
                {selectedFood.serving_size ? ` (${selectedFood.serving_size}${selectedFood.serving_size_unit || "g"})` : ""}
              </p>
            )}

            <button
              onClick={() => logMeal(selectedFood)}
              disabled={logging}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 8,
                backgroundColor: logging ? "#252525" : "#C45B28",
                color: "#E8E2D8",
                fontWeight: 700,
                fontSize: 15,
                fontFamily: "var(--font-oswald)",
                textTransform: "uppercase",
                letterSpacing: 1,
                border: "none",
                cursor: logging ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
            >
              {logging ? "Logging..." : "Log This Meal"}
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ââ Home mode ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#0A0A0A", color: "#E8E2D8" }}>
      <div style={{ padding: "16px 16px 100px" }}>

        {/* Header */}
        <h1 style={{
          fontSize: 26,
          fontFamily: "var(--font-oswald)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginBottom: 20,
        }}>
          Fuel
        </h1>

        {/* Daily tracker card */}
        <div style={{
          backgroundColor: "#161616",
          borderRadius: 12,
          border: "1px solid #252525",
          padding: 20,
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <CalorieRing />
            <div style={{ flex: 1 }}>
              <MacroBar label="Protein" current={dailyTotals.protein} goal={GOALS.protein} color="#C45B28" />
              <MacroBar label="Carbs" current={dailyTotals.carbs} goal={GOALS.carbs} color="#7A8B5E" />
              <MacroBar label="Fat" current={dailyTotals.fat} goal={GOALS.fat} color="#5B7EC4" />
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 80px 14px 16px",
              borderRadius: 10,
              border: "1px solid #252525",
              backgroundColor: "#161616",
              color: "#E8E2D8",
              fontSize: 15,
              fontFamily: "var(--font-inter)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setResults([]); }}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
              style={{ right: 44, color: "#9A9A9A", background: "none", border: "none", cursor: "pointer" }}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Barcode scanner button */}
          <button
            onClick={startScanner}
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ right: 8, color: "#9A9A9A", background: "none", border: "none", cursor: "pointer" }}
            aria-label="Scan barcode"
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              <path d="M7 8v8M12 8v8M17 8v8" />
            </svg>
          </button>
        </div>

        {/* Helper text */}
        {searchQuery.length === 0 && results.length === 0 && (
          <p style={{ color: "#9A9A9A", fontSize: 13, textAlign: "center", marginBottom: 16, fontFamily: "var(--font-inter)" }}>
            Type at least 2 characters -- try "chicken breast" or "protein bar"
          </p>
        )}

        {/* Searching indicator */}
        {searching && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ color: "#9A9A9A", fontSize: 14 }}>Searching...</div>
          </div>
        )}

        {/* Search error message */}
        {scanError && mode === "home" && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <p style={{ color: "#C45B28", fontSize: 13 }}>{scanError}</p>
            <button onClick={() => setScanError("")} style={{ color: "#9A9A9A", fontSize: 12, background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Search results */}
        {results.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontFamily: "var(--font-oswald)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#9A9A9A", marginBottom: 10 }}>
              Results
            </h2>
            {results.map((food) => (
              <button
                key={food.id}
                onClick={() => { setSelectedFood(food); setMode("confirm"); }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  backgroundColor: "#161616",
                  borderRadius: 10,
                  border: "1px solid #252525",
                  padding: "14px 16px",
                  marginBottom: 8,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ color: "#E8E2D8", fontSize: 14, fontWeight: 600, marginBottom: 4, fontFamily: "var(--font-inter)" }}>
                  {food.description}
                </div>
                {food.brand_owner && (
                  <div style={{ color: "#9A9A9A", fontSize: 12, marginBottom: 6 }}>{food.brand_owner}</div>
                )}
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ color: "#C45B28", fontSize: 13, fontWeight: 600 }}>{n(food.calories)} cal</span>
                  <span style={{ color: "#9A9A9A", fontSize: 13 }}>P {n(food.protein_g)}g</span>
                  <span style={{ color: "#9A9A9A", fontSize: 13 }}>C {n(food.carbs_g)}g</span>
                  <span style={{ color: "#9A9A9A", fontSize: 13 }}>F {n(food.fat_g)}g</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {searchQuery.length >= 3 && !searching && results.length === 0 && (
          <div style={{ textAlign: "center", padding: 20, color: "#9A9A9A", fontSize: 14 }}>
            No foods found for "{searchQuery}"
          </div>
        )}

        {/* Recent meals */}
        {recentMeals.length > 0 && results.length === 0 && (
          <div>
            <h2 style={{ fontSize: 14, fontFamily: "var(--font-oswald)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#9A9A9A", marginBottom: 10 }}>
              Recent
            </h2>
            {recentMeals.map((meal) => (
              <div
                key={meal.id}
                style={{
                  backgroundColor: "#161616",
                  borderRadius: 10,
                  border: "1px solid #252525",
                  padding: "12px 16px",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#E8E2D8", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-inter)" }}>
                    {meal.food_name || meal.name}
                  </div>
                  <div style={{ color: "#C45B28", fontSize: 13, fontWeight: 600 }}>{n(meal.calories)} cal</div>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                  <span style={{ color: "#9A9A9A", fontSize: 12 }}>P {n(meal.protein_g)}g</span>
                  <span style={{ color: "#9A9A9A", fontSize: 12 }}>C {n(meal.carb_g)}g</span>
                  <span style={{ color: "#9A9A9A", fontSize: 12 }}>F {n(meal.fat_g)}g</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
