"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Goal types & presets ─────────────────────────────────────────────────────

type FitnessGoal = "lose_weight" | "maintain" | "build_muscle" | "performance";

type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fitnessGoal: FitnessGoal;
};

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2400, protein: 180, carbs: 250, fat: 80, fitnessGoal: "maintain",
};

const GOAL_PRESETS: Record<FitnessGoal, Omit<NutritionGoals, "fitnessGoal">> = {
  lose_weight:   { calories: 2000, protein: 200, carbs: 150, fat: 65 },
  maintain:      { calories: 2400, protein: 180, carbs: 250, fat: 80 },
  build_muscle:  { calories: 2800, protein: 220, carbs: 300, fat: 85 },
  performance:   { calories: 3000, protein: 200, carbs: 350, fat: 90 },
};

const FITNESS_GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: "lose_weight",  label: "Lose Weight" },
  { value: "maintain",     label: "Maintain" },
  { value: "build_muscle", label: "Build Muscle" },
  { value: "performance",  label: "Performance" },
];

// ─── Meal constants ───────────────────────────────────────────────────────────

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEALS: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "lunch",     label: "Lunch"     },
  { type: "dinner",    label: "Dinner"    },
  { type: "snack",     label: "Snacks"    },
];

type FoodEntry = { name: string; cal: number; protein: number; carbs: number; fat: number };

const QUICK_FOODS: FoodEntry[] = [
  { name: "Eggs (2 large)",          cal: 140, protein: 12, carbs:  0, fat: 10 },
  { name: "Chicken Breast (6oz)",    cal: 280, protein: 52, carbs:  0, fat:  6 },
  { name: "Protein Bar",             cal: 200, protein: 20, carbs: 24, fat:  6 },
  { name: "White Rice (1 cup)",      cal: 206, protein:  4, carbs: 45, fat:  0 },
  { name: "Oatmeal (1 cup)",         cal: 158, protein:  6, carbs: 27, fat:  3 },
  { name: "Banana",                  cal: 105, protein:  1, carbs: 27, fat:  0 },
  { name: "Peanut Butter (2 tbsp)", cal: 190, protein:  8, carbs:  6, fat: 16 },
  { name: "Whey Protein (1 scoop)", cal: 120, protein: 25, carbs:  3, fat:  2 },
  { name: "Steak (8oz)",            cal: 540, protein: 56, carbs:  0, fat: 34 },
  { name: "Ground Beef (6oz 80/20)",cal: 430, protein: 38, carbs:  0, fat: 30 },
  { name: "Sweet Potato",           cal: 103, protein:  2, carbs: 24, fat:  0 },
  { name: "Broccoli (1 cup)",       cal:  55, protein:  4, carbs: 11, fat:  0 },
  { name: "Almonds (1oz)",          cal: 164, protein:  6, carbs:  6, fat: 14 },
  { name: "Greek Yogurt (1 cup)",   cal: 130, protein: 17, carbs:  9, fat:  4 },
  { name: "Turkey Sandwich",        cal: 370, protein: 28, carbs: 38, fat: 10 },
  { name: "Burrito Bowl",           cal: 650, protein: 42, carbs: 72, fat: 18 },
];

const FAST_FOOD = [
  { place: "Chick-fil-A",  item: "Grilled Nuggets (12-count)",       name: "Chick-fil-A Grilled Nuggets",    cal: 380, protein: 47, carbs:  9, fat:  9 },
  { place: "Whataburger",  item: "Grilled Chicken (no bun)",         name: "Whataburger Grilled Chicken",    cal: 310, protein: 34, carbs:  6, fat: 16 },
  { place: "Chipotle",     item: "Bowl — Double Protein, No Rice",   name: "Chipotle Double Protein Bowl",   cal: 520, protein: 62, carbs: 28, fat: 18 },
  { place: "McDonald's",   item: "Egg McMuffin",                     name: "McDonald's Egg McMuffin",        cal: 300, protein: 17, carbs: 30, fat: 12 },
  { place: "Subway",       item: "Rotisserie Chicken (6-inch)",      name: "Subway Rotisserie Chicken",      cal: 440, protein: 36, carbs: 48, fat:  8 },
];

// ─── OpenFoodFacts types ──────────────────────────────────────────────────────

type OFFProduct = {
  product_name?: string;
  nutriments?: {
    "energy-kcal_100g"?: number; "energy-kcal"?: number;
    proteins_100g?: number;      proteins?: number;
    carbohydrates_100g?: number; carbohydrates?: number;
    fat_100g?: number;           fat?: number;
  };
};

function offToEntry(p: OFFProduct): FoodEntry | null {
  const name = p.product_name?.trim();
  if (!name) return null;
  const n = p.nutriments ?? {};
  return {
    name,
    cal:     Math.round(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0),
    protein: Math.round(n.proteins_100g ?? n.proteins ?? 0),
    carbs:   Math.round(n.carbohydrates_100g ?? n.carbohydrates ?? 0),
    fat:     Math.round(n.fat_100g ?? n.fat ?? 0),
  };
}

// ─── DB log type ──────────────────────────────────────────────────────────────

type FoodLog = {
  id: string; meal_name: string; meal_type: MealType;
  calories: number; protein_g: number; carbs_g: number; fat_g: number;
  created_at: string;
};

function coerceLog(d: Record<string, unknown>): FoodLog {
  return {
    id:         d.id as string,
    meal_name:  d.meal_name as string,
    meal_type:  ((d.meal_type as string) || "snack") as MealType,
    calories:   (d.calories  as number) ?? 0,
    protein_g:  (d.protein_g as number) ?? 0,
    carbs_g:    (d.carbs_g   as number) ?? 0,
    fat_g:      (d.fat_g     as number) ?? 0,
    created_at: d.created_at as string,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(val: number, target: number) { return Math.min(100, (val / target) * 100); }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// ─── Calorie Ring ─────────────────────────────────────────────────────────────

const RING_R = 64;
const RING_SW = 10;
const RING_CIRC = 2 * Math.PI * RING_R;

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const fraction = Math.min(1, consumed / goal);
  const offset = RING_CIRC * (1 - fraction);
  const remaining = Math.max(0, goal - consumed);
  const over = consumed > goal;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 164, height: 164 }}>
      <svg width={164} height={164} viewBox="0 0 164 164">
        <circle cx={82} cy={82} r={RING_R} fill="none" stroke="#252525" strokeWidth={RING_SW} transform="rotate(-90 82 82)" />
        {consumed > 0 && (
          <circle cx={82} cy={82} r={RING_R} fill="none"
            stroke={over ? "#E87070" : "#C45B28"}
            strokeWidth={RING_SW} strokeLinecap="round"
            strokeDasharray={RING_CIRC} strokeDashoffset={offset}
            transform="rotate(-90 82 82)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center gap-0.5">
        <span className="text-3xl font-bold leading-none"
          style={{ color: over ? "#E87070" : "#E8E2D8", fontFamily: "var(--font-inter)" }}>
          {remaining}
        </span>
        <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          {over ? "over goal" : "cal left"}
        </span>
        <span className="text-[11px] mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          {consumed} / {goal}
        </span>
      </div>
    </div>
  );
}

// ─── Goals Modal ──────────────────────────────────────────────────────────────

function GoalsModal({
  current,
  onSave,
  onClose,
}: {
  current: NutritionGoals;
  onSave: (g: NutritionGoals) => Promise<void>;
  onClose: () => void;
}) {
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(current.fitnessGoal);
  const [calories, setCalories]   = useState(String(current.calories));
  const [protein,  setProtein]    = useState(String(current.protein));
  const [carbs,    setCarbs]      = useState(String(current.carbs));
  const [fat,      setFat]        = useState(String(current.fat));
  const [suggested, setSuggested] = useState(false);
  const [saving, setSaving]       = useState(false);

  function applyPreset(goal: FitnessGoal) {
    const p = GOAL_PRESETS[goal];
    setCalories(String(p.calories));
    setProtein(String(p.protein));
    setCarbs(String(p.carbs));
    setFat(String(p.fat));
    setSuggested(true);
  }

  function handleGoalChange(g: FitnessGoal) {
    setFitnessGoal(g);
    applyPreset(g);
  }

  async function handleSave() {
    setSaving(true);
    await onSave({
      fitnessGoal,
      calories: Number(calories) || DEFAULT_GOALS.calories,
      protein:  Number(protein)  || DEFAULT_GOALS.protein,
      carbs:    Number(carbs)    || DEFAULT_GOALS.carbs,
      fat:      Number(fat)      || DEFAULT_GOALS.fat,
    });
    setSaving(false);
    onClose();
  }

  const inputCls = "w-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]";
  const inputStyle = {
    backgroundColor: "#0A0A0A", border: "1px solid #252525",
    borderRadius: "8px", color: "#E8E2D8", fontFamily: "var(--font-inter)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col gap-5 px-6 py-7"
        style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
              Nutrition
            </p>
            <h2 className="text-xl font-bold uppercase"
              style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>
              Set Goals
            </h2>
          </div>
          <button onClick={onClose} className="transition-opacity hover:opacity-60 mt-1"
            style={{ color: "#9A9A9A" }} aria-label="Close">
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18}>
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Fitness goal selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Fitness Goal
          </label>
          <select
            value={fitnessGoal}
            onChange={(e) => handleGoalChange(e.target.value as FitnessGoal)}
            className={inputCls}
            style={{ ...inputStyle, appearance: "none" as const }}
          >
            {FITNESS_GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Suggestion banner */}
        {suggested && (
          <div className="px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: "#0D1B2A", border: "1px solid #1E3A5F", borderRadius: "8px" }}>
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16} className="shrink-0">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v4m0 3v1" stroke="#C45B28" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Suggested macros applied — customize below if needed.
            </p>
          </div>
        )}

        {/* Macro inputs */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Daily Calories", val: calories, set: setCalories, unit: "kcal" },
            { label: "Protein",        val: protein,  set: setProtein,  unit: "g" },
            { label: "Carbs",          val: carbs,    set: setCarbs,    unit: "g" },
            { label: "Fat",            val: fat,      set: setFat,      unit: "g" },
          ].map(({ label, val, set, unit }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                {label} <span style={{ color: "#5A5A5A" }}>({unit})</span>
              </label>
              <input
                type="number" min="0" value={val}
                onChange={(e) => { set(e.target.value); setSuggested(false); }}
                className={inputCls} style={inputStyle}
              />
            </div>
          ))}
        </div>

        {/* Preset pills */}
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Quick Presets
          </p>
          <div className="flex flex-wrap gap-2">
            {FITNESS_GOAL_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => { setFitnessGoal(o.value); applyPreset(o.value); }}
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: fitnessGoal === o.value ? "#C45B28" : "#252525",
                  color: fitnessGoal === o.value ? "#0A0A0A" : "#9A9A9A",
                  borderRadius: "6px",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{
            backgroundColor: "#C45B28", color: "#0A0A0A",
            borderRadius: "8px", fontFamily: "var(--font-inter)", fontWeight: 600, minHeight: "48px",
          }}
        >
          {saving ? "Saving..." : "Save Goals"}
        </button>
      </div>
    </div>
  );
}

// ─── Barcode Scanner ──────────────────────────────────────────────────────────

type ScanPhase = "starting" | "scanning" | "loading" | "confirm" | "error" | "manual";

function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (food: FoodEntry) => void;
  onClose: () => void;
}) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const frameRef   = useRef<number | null>(null);
  const [phase, setPhase]               = useState<ScanPhase>("starting");
  const [product, setProduct]           = useState<FoodEntry | null>(null);
  const [errMsg, setErrMsg]             = useState("");
  const [manualCode, setManualCode]     = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopStream = useCallback(() => {
    if (frameRef.current !== null) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const lookupBarcode = useCallback(async (code: string) => {
    setBarcodeLoading(true);
    setPhase("loading");
    try {
      const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code.trim())}.json`);
      const data = await res.json() as { status: number; product?: OFFProduct };
      if (data.status === 1 && data.product) {
        const entry = offToEntry(data.product);
        if (entry) { setProduct(entry); setPhase("confirm"); }
        else       { setErrMsg("Product found but missing name or nutrition data."); setPhase("error"); }
      } else {
        setErrMsg("Product not found in the OpenFoodFacts database.");
        setPhase("error");
      }
    } catch {
      setErrMsg("Network error. Check your connection and try again.");
      setPhase("error");
    }
    setBarcodeLoading(false);
  }, []);

  const startCamera = useCallback(async () => {
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stopStream(); return; }
      video.srcObject = stream;
      await video.play();
      setPhase("scanning");

      if (!hasBarcodeDetector) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "code_93"],
      });

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          frameRef.current = requestAnimationFrame(tick); return;
        }
        try {
          const codes = await detector.detect(videoRef.current) as { rawValue: string }[];
          if (codes.length > 0) { stopStream(); await lookupBarcode(codes[0].rawValue); return; }
        } catch { /* ignore */ }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const name = (err as Error).name;
      setErrMsg(name === "NotAllowedError"
        ? "Camera access denied. Allow camera permissions and try again, or enter the barcode manually."
        : "Could not start camera on this device.");
      setPhase("manual");
    }
  }, [hasBarcodeDetector, lookupBarcode, stopStream]);

  useEffect(() => {
    startCamera();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputStyle = { backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "8px", color: "#E8E2D8", fontFamily: "var(--font-inter)" };
  const primaryBtn = { backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "8px", fontFamily: "var(--font-inter)", fontWeight: 600, minHeight: "48px" };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #252525" }}>
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>Nutrition</p>
          <p className="text-lg font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>Scan Barcode</p>
        </div>
        <button onClick={() => { stopStream(); onClose(); }}
          className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
          style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px" }} aria-label="Close scanner">
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
        {phase === "starting" && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Starting camera...</p>
          </div>
        )}

        {phase === "scanning" && (
          <div className="flex flex-col gap-4">
            <div className="relative w-full" style={{ aspectRatio: "4/3", maxHeight: "60vh" }}>
              <video ref={videoRef} className="w-full h-full object-cover" style={{ borderRadius: "12px", backgroundColor: "#161616" }} muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div style={{ width: 200, height: 120, border: "2px solid #C45B28", borderRadius: "8px", boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }} />
              </div>
            </div>
            <p className="text-sm text-center" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {hasBarcodeDetector ? "Point the barcode inside the orange box" : "Barcode detection not supported in this browser. Enter manually below."}
            </p>
            <button onClick={() => setPhase("manual")} className="text-xs font-semibold uppercase tracking-widest text-center transition-opacity hover:opacity-70"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Enter barcode manually →
            </button>
          </div>
        )}

        {phase === "loading" && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Looking up product...</p>
          </div>
        )}

        {phase === "confirm" && product && (
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>Product Found</p>
            <div className="flex flex-col gap-4 px-5 py-5" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}>
              <p className="text-base font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{product.name}</p>
              <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Per 100g serving</p>
              <div className="grid grid-cols-4 gap-3">
                {[{ label: "Cal", val: String(product.cal) }, { label: "Protein", val: `${product.protein}g` }, { label: "Carbs", val: `${product.carbs}g` }, { label: "Fat", val: `${product.fat}g` }]
                  .map(({ label, val }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{label}</span>
                      <span className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{val}</span>
                    </div>
                  ))}
              </div>
            </div>
            <button onClick={() => { stopStream(); onDetected(product); }} className="py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98]" style={primaryBtn}>
              Add to Meal
            </button>
            <button onClick={() => { setProduct(null); startCamera(); }} className="text-xs font-semibold uppercase tracking-widest text-center transition-opacity hover:opacity-70" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Scan Again
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col gap-5">
            <div className="px-5 py-4" style={{ backgroundColor: "#1A0A0A", border: "1px solid #5A1A1A", borderRadius: "8px" }}>
              <p className="text-sm" style={{ color: "#E87070", fontFamily: "var(--font-inter)" }}>{errMsg}</p>
            </div>
            <button onClick={() => setPhase("manual")} className="py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90" style={primaryBtn}>Enter Manually</button>
            <button onClick={() => { setErrMsg(""); startCamera(); }} className="text-xs font-semibold uppercase tracking-widest text-center transition-opacity hover:opacity-70" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Try Again</button>
          </div>
        )}

        {phase === "manual" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Enter the barcode number from the product packaging.</p>
            <input type="text" inputMode="numeric" placeholder="e.g. 0012000161155" value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && manualCode.trim()) lookupBarcode(manualCode); }}
              autoFocus className="w-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]" style={inputStyle} />
            <button onClick={() => lookupBarcode(manualCode)} disabled={!manualCode.trim() || barcodeLoading}
              className="py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-40" style={primaryBtn}>
              {barcodeLoading ? "Looking up..." : "Look Up Product"}
            </button>
            {hasBarcodeDetector && (
              <button onClick={() => { setManualCode(""); startCamera(); }} className="text-xs font-semibold uppercase tracking-widest text-center transition-opacity hover:opacity-70" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                ← Back to Camera
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Food Row ─────────────────────────────────────────────────────────────────

function FoodRow({ food, saving, onAdd, sub }: { food: FoodEntry; saving: boolean; onAdd: () => void; sub?: string }) {
  return (
    <button disabled={saving} onClick={onAdd}
      className="flex items-center justify-between px-3 py-2.5 w-full text-left rounded-lg disabled:opacity-40 transition-colors"
      style={{ fontFamily: "var(--font-inter)" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1E1E1E")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: "#E8E2D8" }}>{food.name}</p>
        <p className="text-xs" style={{ color: "#9A9A9A" }}>{sub ?? `P: ${food.protein}g · C: ${food.carbs}g · F: ${food.fat}g`}</p>
      </div>
      <span className="text-sm font-bold ml-4 shrink-0" style={{ color: "#C45B28" }}>{food.cal} cal</span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-1 pb-0.5 text-xs uppercase tracking-widest font-semibold" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const [todayLogs,      setTodayLogs]      = useState<FoodLog[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [goals,          setGoals]          = useState<NutritionGoals>(DEFAULT_GOALS);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [expandedMeals,  setExpandedMeals]  = useState<Set<MealType>>(
    new Set<MealType>(["breakfast", "lunch", "dinner", "snack"])
  );
  const [addingTo,       setAddingTo]       = useState<MealType | null>(null);
  const [search,         setSearch]         = useState("");
  const [apiResults,     setApiResults]     = useState<FoodEntry[]>([]);
  const [apiLoading,     setApiLoading]     = useState(false);
  const [showCustom,     setShowCustom]     = useState(false);
  const [customName,     setCustomName]     = useState("");
  const [customCal,      setCustomCal]      = useState("");
  const [customProtein,  setCustomProtein]  = useState("");
  const [customCarbs,    setCustomCarbs]    = useState("");
  const [customFat,      setCustomFat]      = useState("");
  const [saving,         setSaving]         = useState(false);
  const [water,          setWater]          = useState(0);
  const [fastFoodPicker, setFastFoodPicker] = useState<number | null>(null);
  const [showHistory,    setShowHistory]    = useState(false);
  const [historyLogs,    setHistoryLogs]    = useState<FoodLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [scannerOpen,    setScannerOpen]    = useState(false);
  const [scannerMeal,    setScannerMeal]    = useState<MealType | null>(null);

  // ── Initial load: today's logs + saved goals ──────────────────────────────

  const fetchTodayLogs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [logsRes, profileRes] = await Promise.all([
      supabase
        .from("meal_logs")
        .select("id, meal_name, meal_type, calories, protein_g, carbs_g, fat_g, created_at")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: true }),
      supabase
        .from("user_profiles")
        .select("nutrition_goals")
        .eq("id", user.id)
        .single(),
    ]);

    setTodayLogs((logsRes.data ?? []).map((d) => coerceLog(d as Record<string, unknown>)));

    const saved = profileRes.data?.nutrition_goals as NutritionGoals | null;
    if (saved?.calories) setGoals({ ...DEFAULT_GOALS, ...saved });

    setLoading(false);
  }, []);

  useEffect(() => { fetchTodayLogs(); }, [fetchTodayLogs]);

  // ── Debounced OpenFoodFacts search ────────────────────────────────────────

  useEffect(() => {
    const q = search.trim();
    if (!q) { setApiResults([]); setApiLoading(false); return; }
    setApiLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10`);
        const data = await res.json() as { products?: OFFProduct[] };
        setApiResults((data.products ?? []).map(offToEntry).filter((e): e is FoodEntry => e !== null).slice(0, 10));
      } catch { setApiResults([]); }
      setApiLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Derived totals (reactive — no refetch needed) ─────────────────────────

  const totals = todayLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories ?? 0),
      protein:  acc.protein  + (log.protein_g ?? 0),
      carbs:    acc.carbs    + (log.carbs_g   ?? 0),
      fat:      acc.fat      + (log.fat_g     ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  function logsForMeal(type: MealType)  { return todayLogs.filter((l) => l.meal_type === type); }
  function mealCalories(type: MealType) { return logsForMeal(type).reduce((a, l) => a + (l.calories ?? 0), 0); }

  // ── Add food — immediate state update, no refetch ─────────────────────────

  async function addFood(mealType: MealType, food: FoodEntry) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data } = await supabase
      .from("meal_logs")
      .insert({
        user_id:   user.id,
        meal_name: food.name,
        meal_type: mealType,
        calories:  food.cal,
        protein_g: food.protein,
        carbs_g:   food.carbs,
        fat_g:     food.fat,
      })
      .select("id, meal_name, meal_type, calories, protein_g, carbs_g, fat_g, created_at")
      .single();

    if (data) {
      // Append immediately — ring, bars, and meal totals update via derived `totals`
      setTodayLogs((prev) => [...prev, coerceLog(data as Record<string, unknown>)]);
    }
    setSaving(false);
  }

  async function addCustomFood(mealType: MealType) {
    if (!customName.trim()) return;
    await addFood(mealType, { name: customName.trim(), cal: Number(customCal) || 0, protein: Number(customProtein) || 0, carbs: Number(customCarbs) || 0, fat: Number(customFat) || 0 });
    setCustomName(""); setCustomCal(""); setCustomProtein(""); setCustomCarbs(""); setCustomFat("");
    setShowCustom(false);
  }

  async function removeLog(id: string) {
    await supabase.from("meal_logs").delete().eq("id", id);
    setTodayLogs((prev) => prev.filter((l) => l.id !== id));
  }

  // ── Save goals ────────────────────────────────────────────────────────────

  async function saveGoals(g: NutritionGoals) {
    setGoals(g); // immediate local update
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").update({ nutrition_goals: g }).eq("id", user.id);
  }

  // ── History ───────────────────────────────────────────────────────────────

  async function loadHistory() {
    setHistoryLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setHistoryLoading(false); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenAgo = new Date(today.getTime() - 6 * 86400000);

    const { data } = await supabase
      .from("meal_logs")
      .select("id, meal_name, meal_type, calories, protein_g, carbs_g, fat_g, created_at")
      .eq("user_id", user.id)
      .gte("created_at", sevenAgo.toISOString())
      .lt("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    setHistoryLogs((data ?? []).map((d) => coerceLog(d as Record<string, unknown>)));
    setHistoryLoading(false);
  }

  function toggleHistory() { if (!showHistory && historyLogs.length === 0) loadHistory(); setShowHistory((v) => !v); }

  const historyByDate = historyLogs.reduce<Map<string, FoodLog[]>>((map, log) => {
    const key = new Date(log.created_at).toLocaleDateString("en-CA");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
    return map;
  }, new Map());

  // ── Meal section helpers ──────────────────────────────────────────────────

  function toggleMeal(type: MealType) {
    setExpandedMeals((prev) => { const n = new Set(prev); if (n.has(type)) n.delete(type); else n.add(type); return n; });
  }

  function openAddFood(type: MealType) {
    setAddingTo(type); setSearch(""); setApiResults([]); setShowCustom(false);
    setCustomName(""); setCustomCal(""); setCustomProtein(""); setCustomCarbs(""); setCustomFat("");
    setExpandedMeals((prev) => { const n = new Set(prev); n.add(type); return n; });
  }

  const q = search.toLowerCase().trim();
  const filteredQuick    = q ? QUICK_FOODS.filter((f) => f.name.toLowerCase().includes(q)) : QUICK_FOODS;
  const filteredFastFood = FAST_FOOD.filter((f) => q === "" || f.place.toLowerCase().includes(q) || f.item.toLowerCase().includes(q));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <main className="min-h-screen flex flex-col px-4 py-10" style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}>
        <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-28">

          {/* Header */}
          <header className="flex items-center gap-5 px-2">
            <Link href="/dashboard"
              className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
              style={{ border: "1px solid #252525", color: "#9A9A9A" }} aria-label="Back to dashboard">
              <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
                <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>Pillar</p>
              <h1 className="text-4xl font-bold uppercase leading-none" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>Fuel</h1>
            </div>
          </header>

          {/* ── Daily Summary ────────────────────────────────────────────── */}
          <section className="px-6 py-7 flex flex-col gap-6" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                Today&apos;s Summary
              </p>
              <button
                onClick={() => setShowGoalsModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#252525", color: "#9A9A9A", borderRadius: "6px", fontFamily: "var(--font-inter)" }}
              >
                <svg viewBox="0 0 20 20" fill="none" width={12} height={12}>
                  <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M10 2v2M10 16v2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M2 10h2M16 10h2M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Set Goals
              </button>
            </div>

            {loading ? (
              <div className="h-40 animate-pulse" style={{ backgroundColor: "#252525", borderRadius: "8px" }} />
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <CalorieRing consumed={totals.calories} goal={goals.calories} />
                <div className="flex-1 flex flex-col gap-4 w-full">
                  {[
                    { label: "Protein", val: totals.protein, target: goals.protein, color: "#C45B28" },
                    { label: "Carbs",   val: totals.carbs,   target: goals.carbs,   color: "#5A8070" },
                    { label: "Fat",     val: totals.fat,     target: goals.fat,     color: "#7A6A3A" },
                  ].map(({ label, val, target, color }) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs" style={{ fontFamily: "var(--font-inter)" }}>
                        <span style={{ color: "#9A9A9A" }}>{label}</span>
                        <span>
                          <span style={{ color, fontWeight: 600 }}>{val}g</span>
                          <span style={{ color: "#9A9A9A" }}> / {target}g</span>
                        </span>
                      </div>
                      <div className="h-2 w-full" style={{ backgroundColor: "#252525", borderRadius: "4px" }}>
                        <div className="h-full transition-all duration-500" style={{ width: `${pct(val, target)}%`, backgroundColor: color, borderRadius: "4px" }} />
                      </div>
                    </div>
                  ))}

                  {/* Active fitness goal pill */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 font-semibold uppercase tracking-widest"
                      style={{ border: "1px solid #252525", borderRadius: "6px", color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      {FITNESS_GOAL_OPTIONS.find((o) => o.value === goals.fitnessGoal)?.label ?? "Goal"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Meal Sections ────────────────────────────────────────────── */}
          {MEALS.map(({ type, label }) => {
            const logs      = logsForMeal(type);
            const isExpanded = expandedMeals.has(type);
            const isAdding   = addingTo === type;
            const mealCal    = mealCalories(type);

            return (
              <section key={type} style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}>

                {/* Header row */}
                <div className="px-5 py-4 flex items-center justify-between cursor-pointer select-none"
                  style={{ borderBottom: isExpanded ? "1px solid #252525" : "none" }}
                  onClick={() => toggleMeal(type)}>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold uppercase tracking-wide" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{label}</p>
                    {mealCal > 0 && <span className="text-xs font-semibold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>{mealCal} cal</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Scan button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setScannerMeal(type); setScannerOpen(true); }}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 transition-opacity hover:opacity-80"
                      style={{ backgroundColor: "#161616", color: "#9A9A9A", border: "1px solid #252525", borderRadius: "6px", fontFamily: "var(--font-inter)" }}
                      aria-label="Scan barcode">
                      <svg viewBox="0 0 20 20" fill="none" width={12} height={12}>
                        <rect x="2"  y="4" width="2" height="12" fill="currentColor" rx="0.5" />
                        <rect x="6"  y="4" width="1" height="12" fill="currentColor" rx="0.5" />
                        <rect x="9"  y="4" width="2" height="12" fill="currentColor" rx="0.5" />
                        <rect x="13" y="4" width="1" height="12" fill="currentColor" rx="0.5" />
                        <rect x="16" y="4" width="2" height="12" fill="currentColor" rx="0.5" />
                      </svg>
                      Scan
                    </button>

                    {/* Add food button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); isAdding ? setAddingTo(null) : openAddFood(type); }}
                      className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 transition-opacity hover:opacity-80"
                      style={{ backgroundColor: isAdding ? "#252525" : "#C45B28", color: isAdding ? "#9A9A9A" : "#0A0A0A", borderRadius: "6px", fontFamily: "var(--font-inter)" }}>
                      {isAdding ? "Cancel" : "+ Add"}
                    </button>

                    <svg viewBox="0 0 20 20" fill="none" width={16} height={16}
                      style={{ color: "#9A9A9A", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="flex flex-col">
                    {/* Logged food rows */}
                    {logs.length > 0 && (
                      <div className="flex flex-col divide-y" style={{ borderColor: "#252525" }}>
                        {logs.map((log) => (
                          <div key={log.id} className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{log.meal_name}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                                P: {log.protein_g}g · C: {log.carbs_g}g · F: {log.fat_g}g
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>{log.calories} cal</span>
                              <button onClick={() => removeLog(log.id)} className="transition-opacity hover:opacity-60" style={{ color: "#5A5A5A" }} aria-label="Remove">
                                <svg viewBox="0 0 20 20" fill="none" width={14} height={14}>
                                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {logs.length === 0 && !isAdding && (
                      <div className="px-5 py-6 text-center">
                        <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                          No meals tracked today
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#555", fontFamily: "var(--font-inter)" }}>
                          Search for a food above to start tracking.
                        </p>
                      </div>
                    )}

                    {/* Add Food Panel */}
                    {isAdding && (
                      <div className="flex flex-col gap-3 px-4 py-4" style={{ borderTop: logs.length > 0 ? "1px solid #252525" : "none" }}>
                        <input type="search" placeholder="Search foods or brands..." value={search}
                          onChange={(e) => setSearch(e.target.value)} autoFocus
                          className="w-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                          style={{ backgroundColor: "#0A0A0A", border: "1px solid #252525", borderRadius: "8px", color: "#E8E2D8", fontFamily: "var(--font-inter)" }} />

                        <div className="flex flex-col max-h-72 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#252525 transparent" }}>
                          {q !== "" && (
                            <>
                              <SectionLabel>Search Results</SectionLabel>
                              {apiLoading && <p className="px-3 py-2 text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Searching OpenFoodFacts...</p>}
                              {!apiLoading && apiResults.map((food) => (
                                <FoodRow key={food.name} food={food} saving={saving} onAdd={() => addFood(type, food)}
                                  sub={`Per 100g · P: ${food.protein}g · C: ${food.carbs}g · F: ${food.fat}g`} />
                              ))}
                              {!apiLoading && apiResults.length === 0 && (
                                <p className="px-3 py-1.5 text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>No results from OpenFoodFacts.</p>
                              )}
                            </>
                          )}

                          {filteredQuick.length > 0 && (
                            <>
                              <SectionLabel>Quick Add</SectionLabel>
                              {filteredQuick.map((food) => <FoodRow key={food.name} food={food} saving={saving} onAdd={() => addFood(type, food)} />)}
                            </>
                          )}

                          {filteredFastFood.length > 0 && (
                            <>
                              <SectionLabel>Fast Food</SectionLabel>
                              {filteredFastFood.map((ff) => (
                                <FoodRow key={ff.place}
                                  food={{ name: ff.name, cal: ff.cal, protein: ff.protein, carbs: ff.carbs, fat: ff.fat }}
                                  saving={saving}
                                  onAdd={() => addFood(type, { name: ff.name, cal: ff.cal, protein: ff.protein, carbs: ff.carbs, fat: ff.fat })}
                                  sub={ff.item} />
                              ))}
                            </>
                          )}
                        </div>

                        <button onClick={() => setShowCustom((v) => !v)}
                          className="text-xs font-semibold uppercase tracking-widest text-left transition-opacity hover:opacity-70"
                          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                          {showCustom ? "− Hide Custom Entry" : "+ Custom Food"}
                        </button>

                        {showCustom && (
                          <div className="flex flex-col gap-3">
                            <input type="text" placeholder="Food name" value={customName} onChange={(e) => setCustomName(e.target.value)}
                              className="w-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                              style={{ backgroundColor: "#0A0A0A", border: "1px solid #252525", borderRadius: "8px", color: "#E8E2D8", fontFamily: "var(--font-inter)" }} />
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: "Cal",     val: customCal,     set: setCustomCal },
                                { label: "Protein", val: customProtein, set: setCustomProtein },
                                { label: "Carbs",   val: customCarbs,   set: setCustomCarbs },
                                { label: "Fat",     val: customFat,     set: setCustomFat },
                              ].map(({ label, val, set }) => (
                                <div key={label} className="flex flex-col gap-1">
                                  <label className="text-xs uppercase tracking-widest" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{label}</label>
                                  <input type="number" min="0" placeholder="0" value={val} onChange={(e) => set(e.target.value)}
                                    className="px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                                    style={{ backgroundColor: "#0A0A0A", border: "1px solid #252525", borderRadius: "8px", color: "#E8E2D8", fontFamily: "var(--font-inter)" }} />
                                </div>
                              ))}
                            </div>
                            <button onClick={() => addCustomFood(type)} disabled={saving || !customName.trim()}
                              className="py-2.5 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-40"
                              style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "8px", fontFamily: "var(--font-inter)", fontWeight: 600, minHeight: "44px" }}>
                              {saving ? "Adding..." : "Add Food"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          {/* ── Water Tracker ────────────────────────────────────────────── */}
          <section className="px-6 py-6 flex flex-col gap-5" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}>
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>Water</p>
              <span className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{water} / 8 glasses</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {Array.from({ length: 8 }, (_, i) => {
                const filled = i < water;
                return (
                  <button key={i} onClick={() => setWater(filled ? i : i + 1)} className="transition-all duration-150 active:scale-95" aria-label={`Glass ${i + 1}`}>
                    <svg viewBox="0 0 28 36" width={36} height={44} fill="none">
                      <path d="M5 3h18l-2.5 30H7.5L5 3z" fill={filled ? "#0D1B2A" : "none"} stroke={filled ? "#2A5A8F" : "#2A2A2A"} strokeWidth="1.5" strokeLinejoin="round" />
                      {filled && <path d="M7.8 17h12.4l-1.8 16H9.6L7.8 17z" fill="#1E3A5F" opacity="0.9" />}
                      <line x1="5" y1="3" x2="23" y2="3" stroke={filled ? "#2A5A8F" : "#2A2A2A"} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                );
              })}
            </div>
            {water > 0 && (
              <div className="h-1.5 w-full" style={{ backgroundColor: "#252525", borderRadius: "4px" }}>
                <div className="h-full transition-all duration-500" style={{ width: `${(water / 8) * 100}%`, backgroundColor: "#1E3A5F", borderRadius: "4px" }} />
              </div>
            )}
            {water === 8 && <p className="text-xs font-semibold" style={{ color: "#5A8A70", fontFamily: "var(--font-inter)" }}>Goal reached. Well done.</p>}
          </section>

          {/* ── Jobsite Eating Guide ─────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>Jobsite Eating Guide</p>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Best options when you&apos;re stuck in a drive-through. Tap Add to log it.</p>
            </div>
            <div className="flex flex-col gap-3">
              {FAST_FOOD.map((ff, idx) => {
                const isPicking = fastFoodPicker === idx;
                return (
                  <div key={ff.place} className="px-5 py-5 flex flex-col gap-3" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{ff.place}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{ff.item}</p>
                        <p className="text-xs mt-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>P: {ff.protein}g · C: {ff.carbs}g · F: {ff.fat}g</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-sm font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>{ff.cal} cal</span>
                        <button onClick={() => setFastFoodPicker(isPicking ? null : idx)}
                          className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 transition-opacity hover:opacity-80"
                          style={{ backgroundColor: isPicking ? "#252525" : "#161616", color: isPicking ? "#9A9A9A" : "#C45B28", border: `1px solid ${isPicking ? "#252525" : "#C45B28"}`, borderRadius: "6px", fontFamily: "var(--font-inter)" }}>
                          {isPicking ? "Cancel" : "Add"}
                        </button>
                      </div>
                    </div>
                    {isPicking && (
                      <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid #252525" }}>
                        <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Add to:</p>
                        <div className="flex flex-wrap gap-2">
                          {MEALS.map(({ type, label }) => (
                            <button key={type} disabled={saving}
                              onClick={async () => { setFastFoodPicker(null); await addFood(type, { name: ff.name, cal: ff.cal, protein: ff.protein, carbs: ff.carbs, fat: ff.fat }); }}
                              className="px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-40"
                              style={{ backgroundColor: "#252525", color: "#E8E2D8", borderRadius: "6px", fontFamily: "var(--font-inter)" }}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Meal History ─────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <button onClick={toggleHistory} className="flex items-center justify-between px-5 py-4 transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}>
              <span className="text-sm font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>Meal History</span>
              <svg viewBox="0 0 20 20" fill="none" width={16} height={16} style={{ color: "#9A9A9A", transform: showHistory ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showHistory && (
              <div className="flex flex-col gap-4">
                {historyLoading ? (
                  [...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }} />)
                ) : historyLogs.length === 0 ? (
                  <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>No history in the past 7 days.</p>
                ) : (
                  Array.from(historyByDate.entries()).map(([, logs]) => {
                    const dayTotal = logs.reduce((acc, l) => acc + (l.calories ?? 0), 0);
                    return (
                      <div key={logs[0].created_at} style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}>
                        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #252525" }}>
                          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{formatDate(logs[0].created_at)}</p>
                          <span className="text-sm font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>{dayTotal} cal</span>
                        </div>
                        <div className="flex flex-col divide-y" style={{ borderColor: "#252525" }}>
                          {logs.map((log) => (
                            <div key={log.id} className="px-5 py-3 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{log.meal_name}</p>
                                <p className="text-xs capitalize" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{log.meal_type}</p>
                              </div>
                              <span className="text-sm font-bold shrink-0" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>{log.calories} cal</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>

        </div>
        <BottomNav />
      </main>

      {/* ── Goals Modal ──────────────────────────────────────────────────── */}
      {showGoalsModal && (
        <GoalsModal
          current={goals}
          onSave={saveGoals}
          onClose={() => setShowGoalsModal(false)}
        />
      )}

      {/* ── Barcode Scanner ──────────────────────────────────────────────── */}
      {scannerOpen && scannerMeal && (
        <BarcodeScanner
          onDetected={async (food) => { setScannerOpen(false); await addFood(scannerMeal, food); }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </>
  );
}
