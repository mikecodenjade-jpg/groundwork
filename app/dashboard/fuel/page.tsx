"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Goals ────────────────────────────────────────────────────────────────────

const GOALS = { calories: 2800, protein: 180, carbs: 300, fat: 90 };

function pct(val: number, goal: number) {
  return Math.min(Math.round((val / goal) * 100), 100);
}

// ─── Color tokens ─────────────────────────────────────────────────────────────

const C = {
  bg: "#0A0A0A",
  card: "#161616",
  border: "#252525",
  accent: "#C45B28",
  text: "#E8E2D8",
  muted: "#9A9A9A",
  protein: "#5B9BD5",
  carbs: "#D4A843",
  fat: "#D4637A",
} as const;

// ═════════════════════════════════════════════════════════════════════════════
export default function FuelPage() {
  // ─── State ──────────────────────────────────────────────────────────────
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UsdaFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [logging, setLogging] = useState<number | null>(null); // fdc_id being logged
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [toast, setToast] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Auto meal type by time ──────────────────────────────────────────────
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 10) setMealType("breakfast");
    else if (h < 14) setMealType("lunch");
    else if (h < 17) setMealType("snack");
    else setMealType("dinner");
  }, []);

  // ─── Load today's totals + recent meals ─────────────────────────────────
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
    setDataLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Debounced USDA search ───────────────────────────────────────────────
  const searchFoods = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
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

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFoods(val), 300);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  // ─── Log a food ──────────────────────────────────────────────────────────
  const logFood = async (food: UsdaFood) => {
    setLogging(food.fdc_id);
    const { error } = await supabase.from("meal_logs").insert({
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
    setLogging(null);
    if (!error) {
      setToast(`Logged — ${Math.round(food.calories || 0)} cal`);
      setTimeout(() => setToast(""), 2500);
      loadData();
    }
  };

  // ─── Delete a logged meal ────────────────────────────────────────────────
  const deleteMeal = async (id: string) => {
    await supabase.from("meal_logs").delete().eq("id", id);
    loadData();
  };

  // ─── Shared card style ───────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────
  if (dataLoading) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "40px 24px 112px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {[180, 64, 64, 64].map((h, i) => (
            <div key={i} className="animate-pulse" style={{ ...cardStyle, height: h }} />
          ))}
        </div>
        <BottomNav />
      </main>
    );
  }

  const calPct = pct(totals.calories, GOALS.calories);
  const remaining = Math.max(0, GOALS.calories - totals.calories);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "40px 24px 112px" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: C.accent,
            color: C.bg,
            padding: "10px 24px",
            borderRadius: 24,
            fontFamily: "var(--font-inter)",
            fontWeight: 600,
            fontSize: 14,
            zIndex: 100,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Header ── */}
        <header>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 4 }}>
            Pillar
          </p>
          <h1 style={{ fontFamily: "var(--font-oswald)", fontSize: 36, fontWeight: 700, textTransform: "uppercase", color: C.text, lineHeight: 1 }}>
            Fuel
          </h1>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: C.muted, marginTop: 6 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </header>

        {/* ── Daily Tracker ── */}
        <section style={cardStyle}>
          <div style={{ padding: "20px 24px 16px" }}>
            {/* Calorie summary row */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-oswald)", fontSize: 40, fontWeight: 700, color: C.text, lineHeight: 1 }}>
                {Math.round(totals.calories)}
              </span>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: C.muted }}>
                / {GOALS.calories} cal
              </span>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: C.muted, marginLeft: "auto" }}>
                {remaining > 0 ? `${remaining} remaining` : "Goal reached"}
              </span>
            </div>

            {/* Calorie bar */}
            <div style={{ height: 6, backgroundColor: C.border, borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${calPct}%`,
                  backgroundColor: calPct >= 100 ? C.fat : C.accent,
                  borderRadius: 3,
                  transition: "width 0.6s ease",
                }}
              />
            </div>

            {/* Macro bars */}
            {[
              { label: "Protein", val: totals.protein, goal: GOALS.protein, color: C.protein },
              { label: "Carbs",   val: totals.carbs,   goal: GOALS.carbs,   color: C.carbs   },
              { label: "Fat",     val: totals.fat,     goal: GOALS.fat,     color: C.fat     },
            ].map((m) => (
              <div key={m.label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-inter)", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.label}</span>
                  <span style={{ color: C.text }}>{Math.round(m.val)}g / {m.goal}g</span>
                </div>
                <div style={{ height: 5, backgroundColor: C.border, borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct(m.val, m.goal)}%`,
                      backgroundColor: m.color,
                      borderRadius: 3,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Meal Type Selector ── */}
        <section>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 12 }}>
            Log As
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "12px 0",
                  borderRadius: 24,
                  border: `1px solid ${mealType === t ? C.accent : C.border}`,
                  backgroundColor: mealType === t ? C.accent : C.card,
                  color: mealType === t ? C.bg : C.muted,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* ── Search Bar ── */}
        <section>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 12 }}>
            Search Foods
          </p>
          <div style={{ position: "relative" }}>
            <svg
              viewBox="0 0 24 24" fill="none" width={16} height={16}
              stroke={C.muted} strokeWidth={1.8} strokeLinecap="round"
              style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21L16.65 16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search foods..."
              style={{
                width: "100%",
                padding: "16px 44px",
                fontFamily: "var(--font-inter)",
                fontSize: 15,
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                color: C.text,
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
            {query && (
              <button
                onClick={clearSearch}
                aria-label="Clear"
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: C.muted,
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

          {/* Searching spinner */}
          {searching && (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: C.muted, textAlign: "center", padding: "20px 0" }} className="animate-pulse">
              Searching...
            </p>
          )}

          {/* No results */}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: C.muted, textAlign: "center", padding: "20px 0" }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {/* Hint */}
          {!searching && query.trim().length < 2 && (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: C.muted, opacity: 0.6, marginTop: 10 }}>
              317,000+ foods from the USDA database — try &ldquo;chicken breast&rdquo; or &ldquo;oats&rdquo;
            </p>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {results.map((food) => (
                <button
                  key={food.fdc_id}
                  onClick={() => logFood(food)}
                  disabled={logging === food.fdc_id}
                  style={{
                    ...cardStyle,
                    width: "100%",
                    textAlign: "left",
                    padding: "16px 20px",
                    cursor: logging === food.fdc_id ? "default" : "pointer",
                    opacity: logging === food.fdc_id ? 0.5 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>
                    {food.description}
                  </div>
                  {(food.brand_owner || food.brand_name) && (
                    <div style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: C.muted, marginBottom: 8 }}>
                      {food.brand_owner || food.brand_name}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 16, fontFamily: "var(--font-inter)", fontSize: 12 }}>
                    <span style={{ color: C.accent, fontWeight: 600 }}>{Math.round(food.calories || 0)} cal</span>
                    <span style={{ color: C.protein }}>P {Math.round(Number(food.protein_g) || 0)}g</span>
                    <span style={{ color: C.carbs }}>C {Math.round(Number(food.carbs_g) || 0)}g</span>
                    <span style={{ color: C.fat }}>F {Math.round(Number(food.fat_g) || 0)}g</span>
                    {food.serving_size && (
                      <span style={{ color: C.muted, marginLeft: "auto" }}>
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
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 12 }}>
              Recent
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentMeals.map((meal) => (
                <div
                  key={meal.id}
                  style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, padding: "14px 20px" }}
                >
                  {/* Type badge */}
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    backgroundColor: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-inter)",
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    color: C.accent,
                  }}>
                    {meal.meal_type?.slice(0, 1).toUpperCase() ?? "?"}
                  </div>

                  {/* Name + macros */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {meal.food_name}
                    </div>
                    <div style={{ display: "flex", gap: 10, fontFamily: "var(--font-inter)", fontSize: 11, marginTop: 3 }}>
                      <span style={{ color: C.protein }}>P{Math.round(Number(meal.protein_g))}g</span>
                      <span style={{ color: C.carbs }}>C{Math.round(Number(meal.carb_g))}g</span>
                      <span style={{ color: C.fat }}>F{Math.round(Number(meal.fat_g))}g</span>
                      <span style={{ color: C.muted }}>
                        {new Date(meal.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Calories + remove */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--font-oswald)", fontSize: 16, fontWeight: 700, color: C.accent }}>{meal.calories}</div>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      style={{ fontFamily: "var(--font-inter)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, background: "none", border: "none", cursor: "pointer", marginTop: 2, padding: 0 }}
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
