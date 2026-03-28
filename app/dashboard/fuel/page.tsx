"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface UsdaFood {
  fdc_id: number | string;
  description: string;
  brand_owner: string | null;
  brand_name: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  serving_size: number | null;
  serving_size_unit: string | null;
  source?: "usda" | "openfoodfacts";
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

// ── OpenFoodFacts barcode lookup ───────────────────────────────────────────────
async function lookupOpenFoodFacts(barcode: string): Promise<UsdaFood | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const n = p.nutriments ?? {};

    // Prefer per-serving values, fall back to per-100g
    const cal =
      n["energy-kcal_serving"] ??
      n["energy-kcal_100g"] ??
      Math.round((n["energy_serving"] ?? n["energy_100g"] ?? 0) / 4.184) ??
      null;
    const protein = n["proteins_serving"] ?? n["proteins_100g"] ?? null;
    const carbs = n["carbohydrates_serving"] ?? n["carbohydrates_100g"] ?? null;
    const fat = n["fat_serving"] ?? n["fat_100g"] ?? null;

    return {
      fdc_id: `off-${barcode}`,
      description: p.product_name || p.abbreviated_product_name || `Barcode ${barcode}`,
      brand_owner: p.brands || null,
      brand_name: null,
      calories: cal !== null ? Math.round(cal) : null,
      protein_g: protein !== null ? Math.round(protein) : null,
      carbs_g: carbs !== null ? Math.round(carbs) : null,
      fat_g: fat !== null ? Math.round(fat) : null,
      serving_size: p.serving_quantity ? Number(p.serving_quantity) : null,
      serving_size_unit: p.serving_quantity_unit || p.serving_size || null,
      source: "openfoodfacts",
    };
  } catch {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
export default function FuelPage() {
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UsdaFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [loggingId, setLoggingId] = useState<number | string | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "found" | "not_found" | "error">("idle");
  const [scannedFood, setScannedFood] = useState<UsdaFood | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const scannerDivId = "qr-reader-div";

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto meal type
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 10) setMealType("breakfast");
    else if (h < 14) setMealType("lunch");
    else if (h < 17) setMealType("snack");
    else setMealType("dinner");
  }, []);

  // Load today's totals + recent meals
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

  // Log a food
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
    // Clear scanner result if it was from a scan
    if (scannedFood && scannedFood.fdc_id === food.fdc_id) {
      setScannedFood(null);
      setScanStatus("idle");
    }
    loadData();
  };

  const deleteMeal = async (id: string) => {
    await supabase.from("meal_logs").delete().eq("id", id);
    loadData();
  };

  // ── Barcode scanner ────────────────────────────────────────────────────────

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* already stopped */ }
      scannerRef.current = null;
    }
  }, []);

  const handleBarcode = useCallback(async (barcode: string) => {
    await stopScanner();
    setScanStatus("scanning");

    // 1. Try usda_foods by gtin_upc
    const { data } = await supabase
      .from("usda_foods")
      .select("fdc_id, description, brand_owner, brand_name, calories, protein_g, carbs_g, fat_g, serving_size, serving_size_unit")
      .eq("gtin_upc", barcode)
      .not("calories", "is", null)
      .limit(1);

    if (data && data.length > 0) {
      setScannedFood({ ...data[0], source: "usda" });
      setScanStatus("found");
      return;
    }

    // 2. Fallback to OpenFoodFacts
    const offFood = await lookupOpenFoodFacts(barcode);
    if (offFood) {
      setScannedFood(offFood);
      setScanStatus("found");
      return;
    }

    setScanStatus("not_found");
  }, [stopScanner]);

  const openScanner = useCallback(async () => {
    setScannerOpen(true);
    setScanStatus("idle");
    setScannedFood(null);

    // Wait for DOM to mount the div
    await new Promise((r) => setTimeout(r, 150));

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 180 } },
        (decoded) => handleBarcode(decoded),
        () => { /* per-frame errors are normal — ignore */ }
      );
    } catch (err) {
      console.error("Scanner failed to start:", err);
      setScanStatus("error");
    }
  }, [handleBarcode]);

  const closeScanner = useCallback(async () => {
    await stopScanner();
    setScannerOpen(false);
    setScanStatus("idle");
  }, [stopScanner]);

  // Clean up on unmount
  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", padding: "40px 24px 112px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {[180, 56, 64, 56, 56].map((h, i) => (
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
          fontSize: 14, zIndex: 200, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      {/* ── Barcode Scanner Modal ── */}
      {scannerOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 150,
          backgroundColor: "rgba(0,0,0,0.95)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Modal header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #252525",
          }}>
            <span style={{ fontFamily: "var(--font-oswald)", fontSize: 20, fontWeight: 700, textTransform: "uppercase", color: "#E8E2D8" }}>
              Scan Barcode
            </span>
            <button
              onClick={closeScanner}
              style={{
                minWidth: 48, minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center",
                background: "none", border: "none", cursor: "pointer", color: "#9A9A9A",
              }}
              aria-label="Close scanner"
            >
              <svg viewBox="0 0 24 24" fill="none" width={22} height={22} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Camera feed */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 20 }}>

            {/* QR reader container */}
            {scanStatus !== "found" && scanStatus !== "not_found" && (
              <div style={{ width: "100%", maxWidth: 360 }}>
                <div
                  id={scannerDivId}
                  style={{ width: "100%", borderRadius: 12, overflow: "hidden", border: "2px solid #C45B28" }}
                />
                {scanStatus === "scanning" && (
                  <p className="animate-pulse" style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9A9A9A", textAlign: "center", marginTop: 16 }}>
                    Looking up barcode...
                  </p>
                )}
                {scanStatus === "idle" && (
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9A9A9A", textAlign: "center", marginTop: 16 }}>
                    Point camera at a product barcode
                  </p>
                )}
                {scanStatus === "error" && (
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#D4637A", textAlign: "center", marginTop: 16 }}>
                    Camera access denied or unavailable
                  </p>
                )}
              </div>
            )}

            {/* Not found state */}
            {scanStatus === "not_found" && (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: 15, color: "#9A9A9A" }}>
                  Product not found in database
                </p>
                <button
                  onClick={openScanner}
                  style={{
                    fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    padding: "14px 32px", borderRadius: 24,
                    backgroundColor: "#C45B28", color: "#0A0A0A",
                    border: "none", cursor: "pointer", minHeight: 48,
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Found state — food card */}
            {scanStatus === "found" && scannedFood && (
              <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C45B28", textAlign: "center" }}>
                  {scannedFood.source === "openfoodfacts" ? "Found via Open Food Facts" : "Found in USDA Database"}
                </p>
                <button
                  onClick={() => { logFood(scannedFood); closeScanner(); }}
                  disabled={loggingId === scannedFood.fdc_id}
                  style={{
                    backgroundColor: "#161616", border: "2px solid #C45B28", borderRadius: 12,
                    width: "100%", textAlign: "left", padding: "20px",
                    cursor: loggingId === scannedFood.fdc_id ? "default" : "pointer",
                    opacity: loggingId === scannedFood.fdc_id ? 0.5 : 1,
                  }}
                >
                  <div style={{ fontFamily: "var(--font-inter)", fontSize: 15, fontWeight: 600, color: "#E8E2D8", marginBottom: 6, lineHeight: 1.3 }}>
                    {scannedFood.description}
                  </div>
                  {(scannedFood.brand_owner || scannedFood.brand_name) && (
                    <div style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9A9A9A", marginBottom: 12 }}>
                      {scannedFood.brand_owner || scannedFood.brand_name}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontFamily: "var(--font-inter)", fontSize: 13 }}>
                    <span style={{ color: "#C45B28", fontWeight: 700 }}>{Math.round(scannedFood.calories || 0)} cal</span>
                    <span style={{ color: "#5B9BD5" }}>P {Math.round(Number(scannedFood.protein_g) || 0)}g</span>
                    <span style={{ color: "#D4A843" }}>C {Math.round(Number(scannedFood.carbs_g) || 0)}g</span>
                    <span style={{ color: "#D4637A" }}>F {Math.round(Number(scannedFood.fat_g) || 0)}g</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9A9A9A", marginTop: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Tap to log as {mealType}
                  </div>
                </button>

                <button
                  onClick={openScanner}
                  style={{
                    fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    padding: "14px 0", borderRadius: 24, width: "100%",
                    backgroundColor: "transparent", color: "#9A9A9A",
                    border: "1px solid #252525", cursor: "pointer", minHeight: 48,
                  }}
                >
                  Scan Another
                </button>
              </div>
            )}
          </div>
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

          <div style={{ height: 8, backgroundColor: "#252525", borderRadius: 4, marginBottom: 20, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${clamp(totals.calories, GOALS.calories)}%`,
              backgroundColor: totals.calories >= GOALS.calories ? "#D4637A" : "#C45B28",
              borderRadius: 4, transition: "width 0.6s ease",
            }} />
          </div>

          {[
            { label: "Protein", val: totals.protein, goal: GOALS.protein, color: "#5B9BD5" },
            { label: "Carbs",   val: totals.carbs,   goal: GOALS.carbs,   color: "#D4A843" },
            { label: "Fat",     val: totals.fat,     goal: GOALS.fat,     color: "#D4637A" },
          ].map((m) => (
            <div key={m.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-inter)", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "#9A9A9A", textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.label}</span>
                <span style={{ color: "#E8E2D8" }}>
                  {Math.round(m.val)}g <span style={{ color: "#9A9A9A" }}>/ {m.goal}g</span>
                </span>
              </div>
              <div style={{ height: 5, backgroundColor: "#252525", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${clamp(m.val, m.goal)}%`,
                  backgroundColor: m.color, borderRadius: 3, transition: "width 0.6s ease",
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
                  padding: "13px 0", borderRadius: 24, minHeight: 48,
                  border: `1px solid ${mealType === t ? "#C45B28" : "#252525"}`,
                  backgroundColor: mealType === t ? "#C45B28" : "#161616",
                  color: mealType === t ? "#0A0A0A" : "#9A9A9A",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* ── Search + Scan ── */}
        <section>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C45B28", marginBottom: 12 }}>
            Search Foods
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            {/* Search input */}
            <div style={{ position: "relative", flex: 1 }}>
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

            {/* Barcode scan button */}
            <button
              onClick={openScanner}
              aria-label="Scan barcode"
              style={{
                minWidth: 56, height: 56, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "#161616", border: "1px solid #252525",
                borderRadius: 12, cursor: "pointer", color: "#9A9A9A",
                transition: "border-color 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C45B28"; e.currentTarget.style.color = "#C45B28"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#252525"; e.currentTarget.style.color = "#9A9A9A"; }}
            >
              {/* Barcode / camera icon */}
              <svg viewBox="0 0 24 24" fill="none" width={22} height={22} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 7V4a1 1 0 011-1h3M2 17v3a1 1 0 001 1h3M22 7V4a1 1 0 00-1-1h-3M22 17v3a1 1 0 01-1 1h-3" />
                <line x1="7" y1="7" x2="7" y2="17" strokeWidth={2} />
                <line x1="10" y1="7" x2="10" y2="17" />
                <line x1="13" y1="7" x2="13" y2="17" strokeWidth={2} />
                <line x1="16" y1="7" x2="16" y2="17" />
              </svg>
            </button>
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
              317,000+ foods — type to search or tap the barcode button to scan a product
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
