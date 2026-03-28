"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface UsdaFood {
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
}

interface MealLog {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  meal_type: MealType;
  logged_at: string;
}

const GOALS = { calories: 2400, protein: 180, carbs: 250, fat: 80 };

function clamp(val: number, goal: number) {
  return Math.min(Math.round((val / goal) * 100), 100);
}

export default function FuelPage() {
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UsdaFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [loggingId, setLoggingId] = useState<number | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select meal type by time of day
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 10) setMealType("breakfast");
    else if (h < 14) setMealType("lunch");
    else if (h < 17) setMealType("snack");
    else setMealType("dinner");
  }, []);

  // Load today's totals + last 10 meals
  const loadData = useCallback(async () => {
    const today = new Date().toLocaleDateString("en-CA");
    const { data } = await supabase
      .from("meal_logs")
      .select("id, food_name, calories, protein_g, carb_g, fat_g, meal_type, logged_at")
      .order("logged_at", { ascending: false })
      .limit(50);

    if (data) {
      const todayRows = data.filter((m) => m.logged_at?.startsWith(today));
      setTotals(
        todayRows.reduce(
          (acc, m) => ({
            calories: acc.calories + (m.calories || 0),
            protein: acc.protein + Number(m.protein_g || 0),
            carbs: acc.carbs + Number(m.carb_g || 0),
            fat: acc.fat + Number(m.fat_g || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        )
      );
      setRecentMeals(data.slice(0, 10));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Debounced USDA search
  const searchFoods = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("usda_foods")
      .select("fdc_id, description, brand_owner, brand_name, calories, protein_g, carbs_g, fat_g, serving_size, serving_size_unit")
      .ilike("description", `%${q.trim()}%`)
      .not("calories", "is", null)
      .gt("calories", 0)
      .order("description")
      .limit(20);
    setResults(data || []);
    setSearching(false);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFoods(val), 300);
  };

  // Log a food to meal_logs
  const logFood = async (food: UsdaFood) => {
    setLoggingId(food.fdc_id);
    await supabase.from("meal_logs").insert({
      food_name: food.description,
      name: food.description,
      calories: Math.round(food.calories || 0),
      protein_g: Math.round(Number(food.protein_g) || 0),
      carb_g: Math.round(Number(food.carbs_g) || 0),
      fat_g: Math.round(Number(food.fat_g) || 0),
      meal_type: mealType,
      logged_at: new Date().toISOString(),
      date: new Date().toLocaleDateString("en-CA"),
    });
    setLoggingId(null);
    setToast(`Logged — ${Math.round(food.calories || 0)} cal`);
    setTimeout(() => setToast(""), 2500);
    loadData();
  };

  const deleteMeal = async (id: string) => {
    await supabase.from("meal_logs").delete().eq("id", id);
    loadData();
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", padding: "40px 24px 112px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {[180, 56, 56, 56, 56].map((h, i) => (
            <div key={i} className="animate-pulse" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: 12, height: h }} />
          ))}
        </div>
        <BottomNav />
      </main>
    );
  }

  const remaining = Math.max(0, GOALS.calories - totals.calories);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", color: "#E8E2D8", padding: "40px 24px 112px" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          backgroundColor: "#C45B28", color: "#0A0A0A", padding: "10px 24px",
          borderRadius: 24, fontFamily: "var(--font-inter)", fontWeight: 600,
          fontSize: 14, zIndex: 100, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── Header ── */}
        <header>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C45B28", marginBottom: 4 }}>
            Pillar
          </p>
          <h1 style={{ fontFamily: "var(--font-oswald)", fontSize: 36, fontWeight: 700, textTransform: "uppercase", color: "#E8E2D8", lineHeight: 1, margin: 0 }}>
            Fuel
          </h1>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9A9A9A", marginTop: 6, marginBottom: 0 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </header>

        {/* ── Daily Tracker ── */}
        <section style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: 12, padding: "20px 24px" }}>

          {/* Calories */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-oswald)", fontSize: 42, fontWeight: 700, color: "#E8E2D8", lineHeight: 1 }}>
              {Math.round(totals.calories)}
            </span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9A9A9A" }}>
              / {GOALS.calories} cal
            </span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9A9A9A", marginLeft: "auto" }}>
              {remaining > 0 ? `${remaining} remaining` : "Goal reached"}
            </span>
          </div>

          {/* Calorie bar */}
          <div style={{ height: 8, backgroundColor: "#252525", borderRadius: 4, marginBottom: 20, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${clamp(totals.calories, GOALS.calories)}%`,
              backgroundColor: totals.calories >= GOALS.calories ? "#D4637A" : "#C45B28",
              borderRadius: 4,
              transition: "width 0.6s ease",
            }} />
          </div>

          {/* Macro bars */}
          {[
            { label: "Protein", val: totals.protein, goal: GOALS.protein, color: "#5B9BD5" },
            { label: "Carbs",   val: totals.carbs,   goal: GOALS.carbs,   color: "#D4A843" },
            { label: "Fat",     val: totals.fat,     goal: GOALS.fat,     color: "#D4637A" },
          ].map((m) => (
            <div key={m.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-inter)", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "#9A9A9A", textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.label}</span>
                <span style={{ color: "#E8E2D8" }}>{Math.round(m.val)}g <span style={{ color: "#9A9A9A" }}>/ {m.goal}g</span></span>
              </div>
              <div style={{ height: 5, backgroundColor: "#252525", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${clamp(m.val, m.goal)}%`,
                  backgroundColor: m.color,
                  borderRadius: 3,
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          ))}
        </section>

        {/* ── Meal Type ── */}
        <section>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C45B28", marginBottom: 12 }}>
            Log As
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                style={{
                  fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  padding: "13px 0", borderRadius: 24,
                  border: `1px solid ${mealType === t ? "#C45B28" : "#252525"}`,
                  backgroundColor: mealType === t ? "#C45B28" : "#161616",
                  color: mealType === t ? "#0A0A0A" : "#9A9A9A",
                  cursor: "pointer", transition: "all 0.15s ease",
                  minHeight: 48,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* ── Search ── */}
        <section>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C45B28", marginBottom: 12 }}>
            Search Foods
          </p>

          <div style={{ position: "relative" }}>
            <svg viewBox="0 0 24 24" fill="none" width={16} height={16}
              stroke="#9A9A9A" strokeWidth={1.8} strokeLinecap="round"
              style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21L16.65 16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Search foods..."
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "16px 44px",
                fontFamily: "var(--font-inter)", fontSize: 15,
                backgroundColor: "#161616", border: "1px solid #252525",
                borderRadius: 12, color: "#E8E2D8", outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C45B28")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#252525")}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                aria-label="Clear"
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#9A9A9A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minWidth: 32, minHeight: 32,
                }}
              >
                <svg viewBox="0 0 16 16" fill="none" width={14} height={14} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                  <path d="M4 4L12 12M12 4L4 12" />
                </svg>
              </button>
            )}
          </div>

          {searching && (
            <p className="animate-pulse" style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9A9A9A", textAlign: "center", padding: "20px 0" }}>
              Searching...
            </p>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9A9A9A", textAlign: "center", padding: "20px 0" }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {!searching && query.trim().length < 2 && (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9A9A9A", opacity: 0.6, marginTop: 10 }}>
              317,000+ foods — try &ldquo;chicken breast&rdquo; or &ldquo;oats&rdquo;
            </p>
          )}

          {results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {results.map((food) => (
                <button
                  key={food.fdc_id}
                  onClick={() => logFood(food)}
                  disabled={loggingId === food.fdc_id}
                  style={{
                    backgroundColor: "#161616", border: "1px solid #252525", borderRadius: 12,
                    width: "100%", textAlign: "left", padding: "16px 20px",
                    cursor: loggingId === food.fdc_id ? "default" : "pointer",
                    opacity: loggingId === food.fdc_id ? 0.5 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 500, color: "#E8E2D8", marginBottom: 4, lineHeight: 1.3 }}>
                    {food.description}
                  </div>
                  {(food.brand_owner || food.brand_name) && (
                    <div style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9A9A9A", marginBottom: 8 }}>
                      {food.brand_owner || food.brand_name}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontFamily: "var(--font-inter)", fontSize: 12 }}>
                    <span style={{ color: "#C45B28", fontWeight: 600 }}>{Math.round(food.calories || 0)} cal</span>
                    <span style={{ color: "#5B9BD5" }}>P {Math.round(Number(food.protein_g) || 0)}g</span>
                    <span style={{ color: "#D4A843" }}>C {Math.round(Number(food.carbs_g) || 0)}g</span>
                    <span style={{ color: "#D4637A" }}>F {Math.round(Number(food.fat_g) || 0)}g</span>
                    {food.serving_size && (
                      <span style={{ color: "#9A9A9A", marginLeft: "auto" }}>
                        per {food.serving_size}{food.serving_size_unit}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Meals ── */}
        {recentMeals.length > 0 && (
          <section>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C45B28", marginBottom: 12 }}>
              Recent
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentMeals.map((meal) => (
                <div
                  key={meal.id}
                  style={{
                    backgroundColor: "#161616", border: "1px solid #252525", borderRadius: 12,
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    backgroundColor: "#0A0A0A", border: "1px solid #252525", borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", color: "#C45B28",
                  }}>
                    {meal.meal_type?.slice(0, 1).toUpperCase() ?? "?"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500, color: "#E8E2D8",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {meal.food_name}
                    </div>
                    <div style={{ display: "flex", gap: 10, fontFamily: "var(--font-inter)", fontSize: 11, marginTop: 3 }}>
                      <span style={{ color: "#5B9BD5" }}>P{Math.round(Number(meal.protein_g))}g</span>
                      <span style={{ color: "#D4A843" }}>C{Math.round(Number(meal.carb_g))}g</span>
                      <span style={{ color: "#D4637A" }}>F{Math.round(Number(meal.fat_g))}g</span>
                      <span style={{ color: "#9A9A9A" }}>
                        {new Date(meal.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--font-oswald)", fontSize: 16, fontWeight: 700, color: "#C45B28" }}>
                      {meal.calories}
                    </div>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      style={{
                        fontFamily: "var(--font-inter)", fontSize: 10, textTransform: "uppercase",
                        letterSpacing: "0.1em", color: "#9A9A9A", background: "none", border: "none",
                        cursor: "pointer", marginTop: 2, padding: 0,
                      }}
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
      <BottomNav />
    </main>
  );
}
