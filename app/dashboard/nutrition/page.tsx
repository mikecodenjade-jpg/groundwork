"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { MEAL_DB, MEAL_DB_CATEGORIES, type MealDBCategory } from "@/lib/meal-database";

// ─── Supabase Edge Function constants ─────────────────────────────────────────

const SUPABASE_URL = "https://kmnqpargwdxtozknswzk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_i8P9CxBEKkCGsXMWFYNgFw__9piLHu1";

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

type MealType = "before_shift" | "break" | "lunch" | "after_work" | "evening";

const MEALS: { type: MealType; label: string }[] = [
  { type: "before_shift", label: "Before Shift" },
  { type: "break",        label: "Break"         },
  { type: "lunch",        label: "Lunch"          },
  { type: "after_work",   label: "After Work"     },
  { type: "evening",      label: "Evening"        },
];

type FoodEntry = { name: string; cal: number; protein: number; carbs: number; fat: number };

const QUICK_FOODS: FoodEntry[] = [
  // Quick protein
  { name: "Protein Shake",               cal: 160, protein: 30, carbs:  5, fat:  2 },
  { name: "Eggs (2 large)",              cal: 140, protein: 12, carbs:  1, fat: 10 },
  { name: "Protein Bar",                 cal: 200, protein: 20, carbs: 24, fat:  6 },
  { name: "Greek Yogurt (cup)",          cal: 130, protein: 17, carbs:  9, fat:  4 },
  { name: "Beef Jerky (1 bag)",          cal: 100, protein: 14, carbs:  6, fat:  3 },
  { name: "Hard-Boiled Eggs (2)",        cal: 140, protein: 12, carbs:  1, fat: 10 },
  // Meals
  { name: "Chicken Breast (grilled)",    cal: 165, protein: 31, carbs:  0, fat:  4 },
  { name: "Breakfast Burrito",           cal: 480, protein: 22, carbs: 48, fat: 20 },
  { name: "Grilled Chicken Sandwich",    cal: 400, protein: 30, carbs: 38, fat: 14 },
  { name: "Chipotle Chicken Bowl",       cal: 650, protein: 52, carbs: 72, fat: 18 },
  { name: "McDonald's Egg McMuffin",     cal: 300, protein: 17, carbs: 30, fat: 12 },
  { name: "Subway 6\" Chicken Teriyaki", cal: 345, protein: 26, carbs: 48, fat:  6 },
  { name: "Chick-fil-A Grilled Nuggets", cal: 380, protein: 47, carbs:  9, fat:  9 },
  // Snacks & sides
  { name: "Banana",                      cal: 105, protein:  1, carbs: 27, fat:  0 },
  { name: "Mixed Nuts (1 oz)",           cal: 170, protein:  5, carbs:  6, fat: 15 },
  { name: "PB&J Sandwich",               cal: 370, protein: 13, carbs: 48, fat: 14 },
];

const FAST_FOOD = [
  { place: "Chick-fil-A",    item: "Grilled Nuggets (12-count)",          name: "Chick-fil-A Grilled Nuggets",       cal: 380, protein: 47, carbs:  9, fat:  9 },
  { place: "Chick-fil-A",    item: "Grilled Chicken Sandwich",            name: "Chick-fil-A Grilled Chicken",       cal: 320, protein: 28, carbs: 31, fat:  7 },
  { place: "McDonald's",     item: "Egg McMuffin",                        name: "McDonald's Egg McMuffin",           cal: 300, protein: 17, carbs: 30, fat: 12 },
  { place: "McDonald's",     item: "McDouble",                            name: "McDonald's McDouble",               cal: 400, protein: 22, carbs: 35, fat: 19 },
  { place: "Subway",         item: "6\" Rotisserie Chicken",              name: "Subway Rotisserie Chicken (6\")",   cal: 350, protein: 32, carbs: 40, fat:  7 },
  { place: "Subway",         item: "6\" Turkey Breast",                   name: "Subway Turkey Breast (6\")",        cal: 280, protein: 22, carbs: 40, fat:  4 },
  { place: "Chipotle",       item: "Chicken Bowl (no rice, double protein)", name: "Chipotle Double Chicken Bowl",   cal: 520, protein: 62, carbs: 28, fat: 18 },
  { place: "Wendy's",        item: "Grilled Chicken Sandwich",            name: "Wendy's Grilled Chicken",           cal: 340, protein: 34, carbs: 36, fat:  8 },
  { place: "Raising Cane's", item: "3 Chicken Fingers (no sauce)",        name: "Raising Cane's 3 Fingers",          cal: 340, protein: 29, carbs: 23, fat: 14 },
  { place: "Popeyes",        item: "Blackened Chicken Tenders (3-piece)", name: "Popeyes Blackened Tenders",         cal: 170, protein: 28, carbs:  4, fat:  5 },
  { place: "Wawa",           item: "Grilled Chicken Hoagie",              name: "Wawa Grilled Chicken Hoagie",       cal: 380, protein: 28, carbs: 48, fat:  8 },
  { place: "Taco Bell",      item: "Power Menu Bowl — Chicken",           name: "Taco Bell Power Bowl",              cal: 470, protein: 26, carbs: 50, fat: 16 },
];

// ─── US Jobsite Venue Swap Guide ──────────────────────────────────────────────

type VenueSwap = {
  defaultPick: string;
  defaultCal: number;
  defaultProtein: number;
  swapPick: string;
  swapCal: number;
  swapProtein: number;
  swapCarbs: number;
  swapFat: number;
  swapDesc: string;
};

type JobsiteVenue = {
  venue: string;
  swaps: VenueSwap[];
};

const JOBSITE_VENUES: JobsiteVenue[] = [
  {
    venue: "Gas Station",
    swaps: [
      {
        defaultPick: "Hot dog + chips + energy drink",
        defaultCal: 560, defaultProtein: 13,
        swapPick: "Beef jerky + string cheese + water",
        swapCal: 260, swapProtein: 28, swapCarbs: 8, swapFat: 12,
        swapDesc: "300 fewer calories, 15g more protein. Same grab-and-go.",
      },
      {
        defaultPick: "Energy drink + mini donuts",
        defaultCal: 520, defaultProtein: 3,
        swapPick: "Protein bar (Quest/RXBar) + black coffee",
        swapCal: 205, swapProtein: 21, swapCarbs: 23, swapFat: 7,
        swapDesc: "315 fewer calories, 18g more protein. Skip the sugar crash.",
      },
    ],
  },
  {
    venue: "McDonald's",
    swaps: [
      {
        defaultPick: "Big Mac Meal (large fries + Coke)",
        defaultCal: 1080, defaultProtein: 27,
        swapPick: "2 McChickens no mayo + side salad + water",
        swapCal: 640, swapProtein: 28, swapCarbs: 64, swapFat: 22,
        swapDesc: "440 fewer calories, same protein. Drop the fries and soda.",
      },
      {
        defaultPick: "Sausage McGriddle",
        defaultCal: 550, defaultProtein: 15,
        swapPick: "Egg McMuffin",
        swapCal: 300, swapProtein: 17, swapCarbs: 30, swapFat: 12,
        swapDesc: "250 fewer calories, 2g more protein. Better AM fuel.",
      },
    ],
  },
  {
    venue: "Subway",
    swaps: [
      {
        defaultPick: "Meatball Marinara footlong + chips + soda",
        defaultCal: 1100, defaultProtein: 40,
        swapPick: "Turkey Breast 6-inch + water (no cheese)",
        swapCal: 280, swapProtein: 22, swapCarbs: 40, swapFat: 4,
        swapDesc: "820 fewer calories. Go 6-inch and skip the soda.",
      },
      {
        defaultPick: "Italian BMT footlong with mayo",
        defaultCal: 990, defaultProtein: 44,
        swapPick: "Rotisserie Chicken 6-inch + water",
        swapCal: 350, swapProtein: 32, swapCarbs: 40, swapFat: 7,
        swapDesc: "640 fewer calories, nearly same protein.",
      },
    ],
  },
  {
    venue: "Taco Bell",
    swaps: [
      {
        defaultPick: "Crunchwrap Supreme + chips + large soda",
        defaultCal: 830, defaultProtein: 16,
        swapPick: "Power Menu Bowl (chicken)",
        swapCal: 470, swapProtein: 26, swapCarbs: 50, swapFat: 16,
        swapDesc: "360 fewer calories, 10g more protein. Best on the menu.",
      },
      {
        defaultPick: "Quesarito",
        defaultCal: 650, defaultProtein: 26,
        swapPick: "2 Chicken Soft Tacos (Fresco style)",
        swapCal: 340, swapProtein: 22, swapCarbs: 40, swapFat: 8,
        swapDesc: "310 fewer calories. Fresco = no cheese or sour cream.",
      },
    ],
  },
  {
    venue: "Chick-fil-A",
    swaps: [
      {
        defaultPick: "Spicy Deluxe meal (large fries + lemonade)",
        defaultCal: 1150, defaultProtein: 36,
        swapPick: "Grilled Nuggets 12ct + side salad + water",
        swapCal: 250, swapProtein: 40, swapCarbs: 12, swapFat: 6,
        swapDesc: "900 fewer calories, 4g more protein. Their best option.",
      },
      {
        defaultPick: "Spicy Chicken Sandwich + waffle fries",
        defaultCal: 780, defaultProtein: 30,
        swapPick: "Grilled Chicken Sandwich + fruit cup",
        swapCal: 430, swapProtein: 30, swapCarbs: 52, swapFat: 9,
        swapDesc: "350 fewer calories, same protein. Worth every time.",
      },
    ],
  },
  {
    venue: "Wawa / Sheetz",
    swaps: [
      {
        defaultPick: "Classic hoagie + chips + fountain soda",
        defaultCal: 890, defaultProtein: 28,
        swapPick: "Grilled chicken hoagie + water",
        swapCal: 380, swapProtein: 28, swapCarbs: 48, swapFat: 8,
        swapDesc: "510 fewer calories. Same protein, skip the chips and soda.",
      },
      {
        defaultPick: "Breakfast burrito + energy drink",
        defaultCal: 690, defaultProtein: 19,
        swapPick: "Egg & cheese wrap + black coffee",
        swapCal: 375, swapProtein: 20, swapCarbs: 34, swapFat: 14,
        swapDesc: "315 fewer calories. Coffee beats the sugar rush.",
      },
    ],
  },
];

type MealPrepRecipe = { name: string; tagline: string; prepTime: string; totalMeals: number; cal: number; protein: number; carbs: number; fat: number; coolerRating: number; instructions: string };

const MEAL_PREP_RECIPES: MealPrepRecipe[] = [
  {
    name: "Grilled Chicken + Rice",
    tagline: "The classic. Never fails.",
    prepTime: "30 min",
    totalMeals: 5,
    cal: 420, protein: 45, carbs: 50, fat: 5,
    coolerRating: 5,
    instructions: "Cook 5 lbs chicken, 4 cups rice. Divide into 5 containers. Done.",
  },
  {
    name: "Slow Cooker Pulled Pork",
    tagline: "Set it in the morning. Ready when you're home.",
    prepTime: "15 min active / 8 hr cook",
    totalMeals: 6,
    cal: 490, protein: 38, carbs: 42, fat: 12,
    coolerRating: 5,
    instructions: "Pork shoulder + BBQ sauce, 8 hours on low. Portion with sweet potatoes.",
  },
  {
    name: "Egg Muffins",
    tagline: "Make 12, grab 3 each morning — done.",
    prepTime: "15 min",
    totalMeals: 4,
    cal: 220, protein: 18, carbs: 3, fat: 12,
    coolerRating: 3,
    instructions: "12 eggs + veggies + cheese in muffin tin. Bake 20 min at 375°. Grab 3 each morning.",
  },
  {
    name: "Turkey Taco Bowls",
    tagline: "Flavor without the work.",
    prepTime: "25 min",
    totalMeals: 5,
    cal: 450, protein: 42, carbs: 55, fat: 10,
    coolerRating: 5,
    instructions: "3 lbs ground turkey + taco seasoning. Rice, black beans, salsa. Divide into 5 containers.",
  },
  {
    name: "Overnight Oats",
    tagline: "Zero morning effort. Eat cold.",
    prepTime: "10 min",
    totalMeals: 5,
    cal: 380, protein: 25, carbs: 45, fat: 8,
    coolerRating: 2,
    instructions: "Oats + protein powder + milk in mason jars. Make 5. Eat cold.",
  },
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

// ─── Edamam response mapping ──────────────────────────────────────────────────

type EdamamFood = {
  label?: string;
  nutrients?: { ENERC_KCAL?: number; PROCNT?: number; CHOCDF?: number; FAT?: number; };
  brand?: string;
};
type EdamamResponse = {
  hints?: Array<{ food?: EdamamFood }>;
  foods?: EdamamFood[];
};

function edamamToEntries(data: EdamamResponse): FoodEntry[] {
  const items: EdamamFood[] = [];
  if (data.hints) data.hints.forEach((h) => { if (h.food) items.push(h.food); });
  if (data.foods && !data.hints) data.foods.forEach((f) => items.push(f));
  return items
    .filter((f) => f.label && (f.nutrients?.ENERC_KCAL ?? 0) > 0)
    .map((f) => ({
      name:    f.label!,
      cal:     Math.round(f.nutrients?.ENERC_KCAL ?? 0),
      protein: Math.round(f.nutrients?.PROCNT ?? 0),
      carbs:   Math.round(f.nutrients?.CHOCDF ?? 0),
      fat:     Math.round(f.nutrients?.FAT ?? 0),
    }))
    .slice(0, 10);
}

// ─── Weekly trends data type ──────────────────────────────────────────────────

type WeeklyDay = { date: string; calories: number };

// ─── DB log type ──────────────────────────────────────────────────────────────

type FoodLog = {
  id: string; name: string; meal_type: MealType;
  calories: number; protein_g: number; carb_g: number; fat_g: number;
  logged_at: string;
};

type HydrationLog = {
  id: string;
  amount_ml: number;
  logged_at: string;
};

const WATER_QUICK_ADD = [
  { label: "1 glass",    ml: 250  },
  { label: "2 glasses",  ml: 500  },
  { label: "500ml",      ml: 500  },
  { label: "750ml",      ml: 750  },
  { label: "1 litre",    ml: 1000 },
];
const DAILY_GOAL_ML  = 2000; // 8 glasses
const GLASS_ML       = 250;
const DAILY_GOAL_GLASSES = Math.round(DAILY_GOAL_ML / GLASS_ML); // 8

function coerceLog(d: Record<string, unknown>): FoodLog {
  return {
    id:         d.id as string,
    name:       (d.name as string) ?? "",
    meal_type:  ((d.meal_type as string) || "lunch") as MealType,
    calories:   (d.calories  as number) ?? 0,
    protein_g:  (d.protein_g as number) ?? 0,
    carb_g:     (d.carb_g    as number) ?? 0,
    fat_g:      (d.fat_g     as number) ?? 0,
    logged_at:  (d.logged_at as string) ?? "",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(val: number, target: number) { return Math.min(100, (val / target) * 100); }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/** Auto-detect meal slot based on current time of day */
function detectMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 9)  return "before_shift";
  if (hour < 11) return "break";
  if (hour < 14) return "lunch";
  if (hour < 18) return "after_work";
  return "evening";
}

function mealLabel(type: MealType): string {
  return MEALS.find((m) => m.type === type)?.label ?? type;
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


// ─── Weekly Trends Chart ──────────────────────────────────────────────────────

function WeeklyTrendsChart({ data, goalCalories }: { data: WeeklyDay[]; goalCalories: number }) {
  // SVG bar chart - 7 days
  // Chart dimensions
  const W = 320, H = 160, PAD_L = 8, PAD_R = 8, PAD_T = 24, PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Build 7-day array (most recent 7 days, oldest first)
  const today = new Date();
  const days: WeeklyDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const found = data.find((x) => x.date === key);
    return { date: key, calories: found?.calories ?? 0 };
  });

  const maxCal = Math.max(goalCalories * 1.2, ...days.map((d) => d.calories), 100);
  const barW = (chartW / 7) * 0.6;
  const barGap = chartW / 7;

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (days.every((d) => d.calories === 0)) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <svg viewBox="0 0 40 40" width={40} height={40} fill="none">
          <rect x="4" y="20" width="6" height="16" rx="2" fill="#252525" />
          <rect x="14" y="12" width="6" height="24" rx="2" fill="#252525" />
          <rect x="24" y="16" width="6" height="20" rx="2" fill="#252525" />
          <rect x="34" y="8" width="6" height="28" rx="2" fill="#252525" />
        </svg>
        <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Fuel up. Log your first meal and see where you stand.</p>
      </div>
    );
  }

  const goalY = PAD_T + chartH * (1 - Math.min(1, goalCalories / maxCal));

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 280 }}>
        {/* Goal line */}
        <line x1={PAD_L} y1={goalY} x2={W - PAD_R} y2={goalY}
          stroke="#252525" strokeWidth="1" strokeDasharray="4 3" />
        <text x={W - PAD_R - 2} y={goalY - 4} textAnchor="end" fontSize="8" fill="#9A9A9A" fontFamily="var(--font-inter)">
          goal
        </text>

        {/* Bars */}
        {days.map((day, i) => {
          const cx = PAD_L + i * barGap + barGap / 2;
          const barH = day.calories > 0 ? chartH * Math.min(1, day.calories / maxCal) : 0;
          const barX = cx - barW / 2;
          const barY = PAD_T + chartH - barH;
          const dayLabel = DAY_LABELS[new Date(day.date + "T12:00:00").getDay()];
          const isToday = day.date === today.toISOString().split("T")[0];

          return (
            <g key={day.date}>
              {barH > 0 && (
                <rect x={barX} y={barY} width={barW} height={barH} rx="3"
                  fill={isToday ? "#C45B28" : "#4A3020"} />
              )}
              {barH === 0 && (
                <rect x={barX} y={PAD_T + chartH - 3} width={barW} height={3} rx="1.5"
                  fill="#252525" />
              )}
              {day.calories > 0 && (
                <text x={cx} y={barY - 4} textAnchor="middle" fontSize="8" fill="#9A9A9A" fontFamily="var(--font-inter)">
                  {day.calories}
                </text>
              )}
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="9"
                fill={isToday ? "#C45B28" : "#9A9A9A"} fontFamily="var(--font-inter)"
                fontWeight={isToday ? "600" : "400"}>
                {dayLabel}
              </text>
            </g>
          );
        })}
      </svg>
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
    new Set<MealType>(["before_shift", "break", "lunch", "after_work", "evening"])
  );
  const [addingTo,       setAddingTo]       = useState<MealType | null>(null);
  const [lastLoggedFood, setLastLoggedFood] = useState<{ food: FoodEntry; mealType: MealType } | null>(null);
  const [selectedVenue,  setSelectedVenue]  = useState<string | null>(null);
  const [venuePicker,    setVenuePicker]    = useState<{ venue: string; swapIdx: number } | null>(null);
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
const [showHistory,    setShowHistory]    = useState(false);
  const [historyLogs,    setHistoryLogs]    = useState<FoodLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast,          setToast]          = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Meal database
  const [dbCategory, setDbCategory] = useState<MealDBCategory | "all">("all");
  const [dbSearch,   setDbSearch]   = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Weekly trends state
  const [showWeeklyTrends, setShowWeeklyTrends] = useState(false);
  const [weeklyData,       setWeeklyData]       = useState<WeeklyDay[]>([]);
  const [weeklyLoading,    setWeeklyLoading]    = useState(false);

  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [hydrationLoading, setHydrationLoading] = useState(false);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());

  function flash(msg: string, type: "ok" | "err" = "ok") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  // ── Initial load: today's logs + saved goals ──────────────────────────────

  const fetchTodayLogs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const todayStr = new Date().toISOString().split("T")[0];

    const [logsRes, profileRes] = await Promise.all([
      supabase
        .from("meal_logs")
        .select("id, name, meal_type, calories, protein_g, carb_g, fat_g, logged_at")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .order("logged_at", { ascending: true }),
      supabase
        .from("user_profiles")
        .select("nutrition_goals")
        .eq("id", user.id)
        .single(),
    ]);

    setTodayLogs((logsRes.data ?? []).map((d) => coerceLog(d as Record<string, unknown>)));

    const saved = profileRes.data?.nutrition_goals as NutritionGoals | null;
    if (saved?.calories) setGoals({ ...DEFAULT_GOALS, ...saved });

    // Load today's hydration
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: hydData } = await supabase
      .from("hydration_logs")
      .select("id, amount_ml, logged_at")
      .eq("user_id", user.id)
      .gte("logged_at", todayStart.toISOString())
      .order("logged_at", { ascending: false });
    setHydrationLogs((hydData ?? []) as HydrationLog[]);

    setLoading(false);
  }, []);

  useEffect(() => { fetchTodayLogs(); }, [fetchTodayLogs]);

  // ── Debounced food search via edge function ───────────────────────────────

  useEffect(() => {
    const q = search.trim();
    if (!q) { setApiResults([]); setApiLoading(false); return; }
    setApiLoading(true);
    const timer = setTimeout(async () => {
      try {
        // Try nutrition-search edge function first
        const res = await fetch(`${SUPABASE_URL}/functions/v1/nutrition-search`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        if (res.ok) {
          const data = await res.json() as EdamamResponse;
          const entries = edamamToEntries(data);
          if (entries.length > 0) { setApiResults(entries); setApiLoading(false); return; }
        }
      } catch { /* fall through to OpenFoodFacts */ }
      // Fallback: OpenFoodFacts
      try {
        const res  = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10`);
        const data = await res.json() as { products?: OFFProduct[] };
        setApiResults((data.products ?? []).map(offToEntry).filter((e): e is FoodEntry => e !== null).slice(0, 10));
      } catch { setApiResults([]); }
      setApiLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Load weekly trends from edge function ─────────────────────────────────

  async function loadWeeklyTrends() {
    if (weeklyLoading) return;
    setWeeklyLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/nutrition-daily-summary`, {
        headers: { "Authorization": `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}` },
      });
      if (res.ok) {
        const json = await res.json() as { weekly?: Array<{ date: string; calories: number }> };
        if (json.weekly && Array.isArray(json.weekly)) {
          setWeeklyData(json.weekly.map((d) => ({ date: d.date, calories: d.calories ?? 0 })));
        }
      }
    } catch { /* ignore */ }
    setWeeklyLoading(false);
  }

  // ── Derived totals (reactive — no refetch needed) ─────────────────────────

  const totals = todayLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories ?? 0),
      protein:  acc.protein  + (log.protein_g ?? 0),
      carbs:    acc.carbs    + (log.carb_g    ?? 0),
      fat:      acc.fat      + (log.fat_g     ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // ── Daily score / grade ────────────────────────────────────────────────────
  const totalMlHydration = hydrationLogs.reduce((s, l) => s + l.amount_ml, 0);
  const proteinScore  = Math.round(Math.min(1, totals.protein  / goals.protein)  * 50);
  const calorieScore  = totals.calories > 0
    ? (totals.calories > goals.calories * 1.1
        ? Math.max(0, Math.round(30 - ((totals.calories - goals.calories * 1.1) / (goals.calories * 0.4)) * 30))
        : Math.round((totals.calories / goals.calories) * 30))
    : 0;
  const hydrationScore = Math.round(Math.min(1, totalMlHydration / DAILY_GOAL_ML) * 20);
  const dailyScore  = proteinScore + calorieScore + hydrationScore;
  const scoreGrade  = dailyScore >= 90 ? "A" : dailyScore >= 75 ? "B" : dailyScore >= 60 ? "C" : dailyScore >= 40 ? "D" : "F";
  const scoreColor  = scoreGrade === "A" ? "#4CAF50" : scoreGrade === "B" ? "#8BC34A" : scoreGrade === "C" ? "#C45B28" : scoreGrade === "D" ? "#FF9800" : "#E87070";

  function logsForMeal(type: MealType)  { return todayLogs.filter((l) => l.meal_type === type); }
  function mealCalories(type: MealType) { return logsForMeal(type).reduce((a, l) => a + (l.calories ?? 0), 0); }

  // ── Add food — immediate state update, no refetch ─────────────────────────

  async function addFood(mealType: MealType, food: FoodEntry) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { flash("Sign in to track meals", "err"); setSaving(false); return; }

      const { data, error } = await supabase
        .from("meal_logs")
        .insert({
          user_id:   user.id,
          date:      new Date().toISOString().split("T")[0],
          name:      food.name,
          meal_type: mealType,
          calories:  Math.round(food.cal),
          protein_g: Math.round(food.protein),
          carb_g:    Math.round(food.carbs),
          fat_g:     Math.round(food.fat),
        })
        .select("id, name, meal_type, calories, protein_g, carb_g, fat_g, logged_at")
        .single();

      if (error) {
        console.error("meal_logs insert error:", error);
        flash("Could not save — try again", "err");
      } else if (data) {
        setTodayLogs((prev) => [...prev, coerceLog(data as Record<string, unknown>)]);
        // Auto-expand the meal section so the user sees it
        setExpandedMeals((prev) => { const n = new Set(prev); n.add(mealType); return n; });
        setLastLoggedFood({ food, mealType });
        flash(`Fuelled up — ${food.name} logged`);
      }
    } catch (err) {
      console.error("addFood error:", err);
      flash("Network error — check connection", "err");
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

    const todayStr = new Date().toISOString().split("T")[0];
    const sevenAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];

    const { data } = await supabase
      .from("meal_logs")
      .select("id, name, meal_type, calories, protein_g, carb_g, fat_g, logged_at")
      .eq("user_id", user.id)
      .gte("date", sevenAgo)
      .lt("date", todayStr)
      .order("logged_at", { ascending: false });

    setHistoryLogs((data ?? []).map((d) => coerceLog(d as Record<string, unknown>)));
    setHistoryLoading(false);
  }

  function toggleHistory() { if (!showHistory && historyLogs.length === 0) loadHistory(); setShowHistory((v) => !v); }

  const historyByDate = historyLogs.reduce<Map<string, FoodLog[]>>((map, log) => {
    const key = new Date(log.logged_at).toLocaleDateString("en-CA");
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

  async function logWater(ml: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setHydrationLoading(true);
    const { data } = await supabase
      .from("hydration_logs")
      .insert({ user_id: user.id, amount_ml: ml, logged_at: new Date().toISOString() })
      .select("id, amount_ml, logged_at")
      .single();
    if (data) setHydrationLogs((prev) => [data as HydrationLog, ...prev]);
    setHydrationLoading(false);
  }

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

          {/* ── Cooler Prep Banner ───────────────────────────────────────── */}
          <Link
            href="/dashboard/fuel/cooler-prep"
            className="flex items-center justify-between gap-4 px-6 py-4 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1A0A00", border: "1px solid #2A1A00", borderRadius: "12px" }}
          >
            <div className="flex items-center gap-4">
              <span style={{ fontSize: "22px" }}>🧊</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Cooler Prep
                </p>
                <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  20 job-ready meals that pack in a cooler
                </p>
              </div>
            </div>
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16} style={{ flexShrink: 0, color: "#f97316" }}>
              <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* ── Daily Summary ────────────────────────────────────────────── */}
          <section className="px-6 py-7 flex flex-col gap-6" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                  Today&apos;s Fuel
                </p>
                {/* Daily score badge */}
                {!loading && totals.calories > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${scoreColor}22`, color: scoreColor, border: `1px solid ${scoreColor}55`, fontFamily: "var(--font-inter)" }}
                    title={`Score: ${dailyScore}/100 — Protein: ${proteinScore}/50, Calories: ${calorieScore}/30, Hydration: ${hydrationScore}/20`}
                  >
                    {scoreGrade}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowGoalsModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#252525", color: "#9A9A9A", borderRadius: "6px", fontFamily: "var(--font-inter)" }}
              >
                <svg viewBox="0 0 20 20" fill="none" width={12} height={12}>
                  <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M10 2v2M10 16v2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M2 10h2M16 10h2M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Goals
              </button>
            </div>

            {loading ? (
              <div className="h-40 animate-pulse" style={{ backgroundColor: "#252525", borderRadius: "8px" }} />
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <CalorieRing consumed={totals.calories} goal={goals.calories} />
                <div className="flex-1 flex flex-col gap-4 w-full">
                  {/* Remaining calories row */}
                  <div className="flex items-center justify-between px-3 py-2.5" style={{ backgroundColor: "#0A0A0A", borderRadius: "8px" }}>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      {totals.calories > goals.calories ? "Over target" : "Remaining"}
                    </span>
                    <span className="text-base font-bold" style={{ color: totals.calories > goals.calories ? "#E87070" : "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                      {Math.abs(goals.calories - totals.calories)} cal
                    </span>
                  </div>
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

          {/* ── Weekly Trends ────────────────────────────────────────────── */}
          <section style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}>
            <button
              onClick={() => {
                setShowWeeklyTrends((v) => !v);
                if (!showWeeklyTrends && weeklyData.length === 0) loadWeeklyTrends();
              }}
              className="w-full flex items-center justify-between px-6 py-4"
            >
              <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                Weekly Trends
              </p>
              <svg viewBox="0 0 20 20" fill="none" width={16} height={16}
                style={{ color: "#9A9A9A", transform: showWeeklyTrends ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showWeeklyTrends && (
              <div className="px-4 pb-5 flex flex-col gap-3" style={{ borderTop: "1px solid #252525" }}>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Calorie intake — past 7 days</p>
                  <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Goal: {goals.calories} cal</span>
                </div>
                {weeklyLoading ? (
                  <div className="h-40 animate-pulse" style={{ backgroundColor: "#252525", borderRadius: "8px" }} />
                ) : (
                  <WeeklyTrendsChart data={weeklyData} goalCalories={goals.calories} />
                )}
                {!weeklyLoading && weeklyData.length === 0 && (
                  <p className="text-xs text-center pb-2" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    Log meals for a few days to see your trends here.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ── Quick Add — always visible ───────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                Quick Add
              </p>
              <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                → {mealLabel(detectMealType())}
              </p>
            </div>

            {/* Repeat last meal */}
            {lastLoggedFood && (
              <button
                disabled={saving}
                onClick={() => addFood(detectMealType(), lastLoggedFood.food)}
                className="flex items-center justify-between px-4 py-3 w-full text-left transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ backgroundColor: "#161616", border: "1px solid #C45B2855", borderRadius: "10px", fontFamily: "var(--font-inter)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg viewBox="0 0 20 20" fill="none" width={14} height={14} className="shrink-0" style={{ color: "#C45B28" }}>
                    <path d="M4 10a6 6 0 1 0 1.06-3.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M2 6l2.06.58L6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#C45B28" }}>Repeat Last</p>
                    <p className="text-sm font-semibold truncate" style={{ color: "#E8E2D8" }}>{lastLoggedFood.food.name}</p>
                  </div>
                </div>
                <span className="text-sm font-bold shrink-0 ml-3" style={{ color: "#C45B28" }}>{lastLoggedFood.food.cal} cal</span>
              </button>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_FOODS.slice(0, 6).map((food) => (
                <button
                  key={food.name}
                  disabled={saving}
                  onClick={() => addFood(detectMealType(), food)}
                  className="flex flex-col gap-1 px-4 py-3 text-left transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "10px",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <span className="text-sm font-semibold truncate w-full" style={{ color: "#E8E2D8" }}>{food.name}</span>
                  <span className="text-xs" style={{ color: "#C45B28", fontWeight: 600 }}>{food.cal} cal</span>
                  <span className="text-[11px]" style={{ color: "#9A9A9A" }}>P:{food.protein}g C:{food.carbs}g F:{food.fat}g</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Empty Meals Prompt ─────────────────────────────────────────── */}
          {!loading && todayLogs.length === 0 && (
            <div
              className="flex items-center gap-4 px-5 py-4 animate-fade-up"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "12px",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" width={24} height={24} style={{ color: "#C45B28", flexShrink: 0 }}>
                <path d="M12 3v6M12 21v-6M3 12h6M21 12h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  Nothing logged yet today.
                </p>
                <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Log your first meal to start tracking your protein and calories.
                </p>
              </div>
            </div>
          )}

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
                              <p className="text-sm font-semibold truncate" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{log.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                                P: {log.protein_g}g · C: {log.carb_g}g · F: {log.fat_g}g
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
                      <div className="px-5 py-5 text-center">
                        <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                          Nothing logged yet
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); openAddFood(type); }}
                          className="text-xs font-semibold uppercase tracking-widest mt-2 transition-opacity hover:opacity-70"
                          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                          + Tap to add food
                        </button>
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
                              {apiLoading && <p className="px-3 py-2 text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Searching...</p>}
                              {!apiLoading && apiResults.map((food) => (
                                <FoodRow key={food.name} food={food} saving={saving} onAdd={() => addFood(type, food)}
                                  sub={`P: ${food.protein}g · C: ${food.carbs}g · F: ${food.fat}g`} />
                              ))}
                              {!apiLoading && apiResults.length === 0 && (
                                <p className="px-3 py-1.5 text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Nothing came up. Try a different name.</p>
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

          {/* ── Meal Database ────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>MEAL DATABASE</p>
              <h2 className="text-xl font-bold uppercase mb-1" style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>200+ Construction Meals</h2>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Real food workers eat. Tap any meal to log it now.</p>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {MEAL_DB_CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDbCategory(value)}
                  className="px-3 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 shrink-0"
                  style={{
                    backgroundColor: dbCategory === value ? "#C45B28" : "#161616",
                    color:           dbCategory === value ? "#0A0A0A" : "#9A9A9A",
                    border:          `1px solid ${dbCategory === value ? "#C45B28" : "#252525"}`,
                    borderRadius:    "6px",
                    fontFamily:      "var(--font-inter)",
                    minHeight:       "36px",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="search"
              placeholder="Search meals..."
              value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
              className="w-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
              style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "8px", color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
            />

            {/* Meal list */}
            {(() => {
              const q = dbSearch.toLowerCase().trim();
              const filtered = MEAL_DB.filter((m) => {
                const catMatch = dbCategory === "all" || m.category === dbCategory;
                const txtMatch = q === "" || m.name.toLowerCase().includes(q) || m.source.toLowerCase().includes(q);
                return catMatch && txtMatch;
              }).slice(0, 60);

              if (filtered.length === 0) {
                return (
                  <p className="text-sm text-center py-6" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    No meals found. Try a different search.
                  </p>
                );
              }

              return (
                <div className="flex flex-col" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}>
                  {filtered.map((meal, i) => (
                    <button
                      key={`${meal.name}-${i}`}
                      disabled={saving}
                      onClick={() => addFood(detectMealType(), { name: meal.name, cal: meal.cal, protein: meal.protein, carbs: meal.carbs, fat: meal.fat })}
                      className="flex items-center justify-between px-4 py-3 w-full text-left transition-colors disabled:opacity-40"
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1a1a1a" : "none", fontFamily: "var(--font-inter)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1E1E1E")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "#E8E2D8" }}>{meal.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9A9A9A" }}>
                          P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g
                          <span style={{ color: "#5A5A5A" }}> · {meal.serving} · {meal.source}</span>
                        </p>
                      </div>
                      <span className="text-sm font-bold ml-4 shrink-0" style={{ color: "#C45B28" }}>{meal.cal} cal</span>
                    </button>
                  ))}
                  {filtered.length === 60 && (
                    <p className="px-4 py-3 text-xs text-center" style={{ color: "#5A5A5A", fontFamily: "var(--font-inter)", borderTop: "1px solid #1a1a1a" }}>
                      Showing top 60 — refine your search to see more
                    </p>
                  )}
                </div>
              );
            })()}
          </section>

          {/* ── Jobsite Food Guide ──────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>EATING OUT GUIDE</p>
              <h2 className="text-xl font-bold uppercase mb-1" style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>Where Are You Eating?</h2>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Pick a spot — we&apos;ll show you a smarter order.</p>
            </div>

            {/* Venue selector tabs */}
            <div className="flex flex-wrap gap-2">
              {JOBSITE_VENUES.map((v) => (
                <button
                  key={v.venue}
                  onClick={() => { setSelectedVenue(selectedVenue === v.venue ? null : v.venue); setVenuePicker(null); }}
                  className="px-4 py-2.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    backgroundColor: selectedVenue === v.venue ? "#C45B28" : "#161616",
                    color:           selectedVenue === v.venue ? "#0A0A0A" : "#9A9A9A",
                    border:          `1px solid ${selectedVenue === v.venue ? "#C45B28" : "#252525"}`,
                    borderRadius:    "8px",
                    fontFamily:      "var(--font-inter)",
                    minHeight:       "44px",
                  }}
                >
                  {v.venue}
                </button>
              ))}
            </div>

            {/* Swap cards for selected venue */}
            {selectedVenue && (() => {
              const v = JOBSITE_VENUES.find((x) => x.venue === selectedVenue)!;
              return (
                <div className="flex flex-col gap-4">
                  {v.swaps.map((swap, swapIdx) => {
                    const calDiff   = swap.defaultCal - swap.swapCal;
                    const protDiff  = swap.swapProtein - swap.defaultProtein;
                    const isPicking = venuePicker?.venue === v.venue && venuePicker?.swapIdx === swapIdx;
                    return (
                      <div key={swapIdx} className="flex flex-col gap-4 px-5 py-5" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}>
                        {/* Default vs swap comparison */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-2 px-3 py-3" style={{ backgroundColor: "#0A0A0A", borderRadius: "8px", border: "1px solid #2A1A1A" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#E87070", fontFamily: "var(--font-inter)" }}>Usual Pick</p>
                            <p className="text-xs font-semibold leading-snug" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{swap.defaultPick}</p>
                            <div className="flex gap-3 mt-1">
                              <div><p className="text-sm font-bold" style={{ color: "#E87070", fontFamily: "var(--font-inter)" }}>{swap.defaultCal}</p><p className="text-[10px]" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>cal</p></div>
                              <div><p className="text-sm font-bold" style={{ color: "#E87070", fontFamily: "var(--font-inter)" }}>{swap.defaultProtein}g</p><p className="text-[10px]" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>protein</p></div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 px-3 py-3" style={{ backgroundColor: "#0A0A0A", borderRadius: "8px", border: "1px solid #1A2A1A" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>Better Swap</p>
                            <p className="text-xs font-semibold leading-snug" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{swap.swapPick}</p>
                            <div className="flex gap-3 mt-1">
                              <div><p className="text-sm font-bold" style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>{swap.swapCal}</p><p className="text-[10px]" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>cal</p></div>
                              <div><p className="text-sm font-bold" style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}>{swap.swapProtein}g</p><p className="text-[10px]" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>protein</p></div>
                            </div>
                          </div>
                        </div>

                        {/* Savings summary */}
                        <div className="flex items-center gap-3 px-3 py-2.5" style={{ backgroundColor: "#0D1B0D", border: "1px solid #1E3A1E", borderRadius: "8px" }}>
                          <svg viewBox="0 0 20 20" fill="none" width={14} height={14} className="shrink-0">
                            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 5v4l2.5 2.5" stroke="#4CAF50" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                          <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{swap.swapDesc}</p>
                        </div>

                        {/* Diff pills */}
                        <div className="flex gap-2">
                          {calDiff > 0 && (
                            <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ backgroundColor: "#1A2A1A", color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
                              -{calDiff} cal
                            </span>
                          )}
                          {protDiff > 0 && (
                            <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ backgroundColor: "#1A2A1A", color: "#4CAF50", fontFamily: "var(--font-inter)" }}>
                              +{protDiff}g protein
                            </span>
                          )}
                        </div>

                        {/* Log swap button */}
                        <button
                          onClick={() => setVenuePicker(isPicking ? null : { venue: v.venue, swapIdx })}
                          className="py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98]"
                          style={{ backgroundColor: isPicking ? "#252525" : "#C45B28", color: isPicking ? "#9A9A9A" : "#0A0A0A", borderRadius: "8px", fontFamily: "var(--font-inter)", minHeight: "48px" }}
                        >
                          {isPicking ? "Cancel" : "Log the Better Swap"}
                        </button>

                        {isPicking && (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Add to which slot?</p>
                            <div className="flex flex-wrap gap-2">
                              {MEALS.map(({ type, label }) => (
                                <button key={type} disabled={saving}
                                  onClick={async () => {
                                    setVenuePicker(null);
                                    await addFood(type, { name: `${v.venue} — ${swap.swapPick}`, cal: swap.swapCal, protein: swap.swapProtein, carbs: swap.swapCarbs, fat: swap.swapFat });
                                  }}
                                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-40"
                                  style={{ backgroundColor: "#252525", color: "#E8E2D8", borderRadius: "6px", fontFamily: "var(--font-inter)", minHeight: "44px" }}>
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
              );
            })()}
          </section>

          {/* ── Meal Prep Sunday ─────────────────────────────────────────── */}
          <section className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-1" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>MEAL PREP SUNDAY</p>
              <h2 className="text-xl font-bold uppercase mb-1" style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}>Cook once. Eat all week.</h2>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Prep once. Eat clean all week.</p>
            </div>
            <div className="flex flex-col gap-4">
              {MEAL_PREP_RECIPES.map((recipe) => {
                const isExpanded = expandedRecipes.has(recipe.name);
                return (
                  <div key={recipe.name} className="flex flex-col" style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}>
                    {/* Header — always visible, tap to expand */}
                    <button
                      onClick={() => setExpandedRecipes((prev) => {
                        const next = new Set(prev);
                        if (next.has(recipe.name)) next.delete(recipe.name);
                        else next.add(recipe.name);
                        return next;
                      })}
                      className="px-5 py-5 flex items-start justify-between gap-4 text-left w-full transition-opacity hover:opacity-80"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold uppercase" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{recipe.name}</h3>
                        <p className="text-xs mt-0.5 italic" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{recipe.tagline}</p>
                        <p className="text-xs mt-2 font-semibold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                          P{recipe.protein}g · C{recipe.carbs}g · F{recipe.fat}g · {recipe.cal} cal
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Cooler rating */}
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((n) => (
                            <svg key={n} viewBox="0 0 12 12" width={10} height={10}>
                              <rect x="1" y="4" width="10" height="7" rx="1" fill={n <= recipe.coolerRating ? "#C45B28" : "#252525"} />
                              <rect x="3" y="2" width="6" height="3" rx="1" fill={n <= recipe.coolerRating ? "#C45B28" : "#252525"} />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[10px] uppercase tracking-widest" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>Cooler {recipe.coolerRating}/5</span>
                        <svg viewBox="0 0 20 20" fill="none" width={14} height={14} style={{ color: "#9A9A9A", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>
                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 flex flex-col gap-4" style={{ borderTop: "1px solid #1a1a1a" }}>
                        <p className="text-sm leading-relaxed pt-4" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{recipe.instructions}</p>
                        <div className="flex flex-wrap gap-4">
                          {[
                            { label: recipe.prepTime, sub: "Prep Time" },
                            { label: `${recipe.totalMeals} meals`, sub: "Total" },
                            { label: `${recipe.cal} cal`, sub: "Per Serving" },
                          ].map(({ label, sub }) => (
                            <div key={sub} className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>{label}</span>
                              <span className="text-[10px] uppercase tracking-widest" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{sub}</span>
                            </div>
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
                      <div key={logs[0].logged_at} style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}>
                        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #252525" }}>
                          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{formatDate(logs[0].logged_at)}</p>
                          <span className="text-sm font-bold" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>{dayTotal} cal</span>
                        </div>
                        <div className="flex flex-col divide-y" style={{ borderColor: "#252525" }}>
                          {logs.map((log) => (
                            <div key={log.id} className="px-5 py-3 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{log.name}</p>
                                <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{mealLabel(log.meal_type)}</p>
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

        {/* Hydration */}
        <section>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
            Hydration
          </p>
          <div style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}>
            {/* Summary — glasses */}
            <div className="px-6 py-5" style={{ borderBottom: "1px solid #252525" }}>
              {(() => {
                const totalMl      = hydrationLogs.reduce((s, l) => s + l.amount_ml, 0);
                const glassesHad   = Math.floor(totalMl / GLASS_ML);
                const pctVal       = Math.min(100, Math.round((totalMl / DAILY_GOAL_ML) * 100));
                return (
                  <div className="flex flex-col gap-4">
                    {/* Glass icons — tap-to-add */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.from({ length: DAILY_GOAL_GLASSES }).map((_, i) => (
                          <button
                            key={i}
                            disabled={hydrationLoading}
                            onClick={() => { if (i >= glassesHad) logWater(GLASS_ML); }}
                            title={i < glassesHad ? "Logged" : "Tap to add 1 glass"}
                            className="transition-transform active:scale-90"
                            style={{ background: "none", border: "none", padding: 0, cursor: i < glassesHad ? "default" : "pointer" }}
                          >
                            <svg viewBox="0 0 18 24" width={18} height={24} fill="none">
                              <path d="M3 4h12l-1.5 14a1 1 0 01-1 .9H5.5a1 1 0 01-1-.9L3 4z"
                                fill={i < glassesHad ? "#3B8BEB" : "#252525"}
                                stroke={i < glassesHad ? "#3B8BEB" : "#3A3A3A"}
                                strokeWidth="1"
                              />
                              <line x1="3" y1="4" x2="15" y2="4" stroke={i < glassesHad ? "#3B8BEB" : "#3A3A3A"} strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
                          {glassesHad}<span className="text-sm font-normal ml-1" style={{ color: "#9A9A9A" }}>/ {DAILY_GOAL_GLASSES}</span>
                        </p>
                        <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>glasses</p>
                      </div>
                    </div>
                    <div style={{ backgroundColor: "#252525", borderRadius: "4px", height: "6px" }}>
                      <div style={{
                        backgroundColor: pctVal >= 100 ? "#4CAF50" : "#3B8BEB",
                        width: `${pctVal}%`,
                        height: "100%",
                        borderRadius: "4px",
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                    <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      {Math.round(totalMl)} ml logged — {DAILY_GOAL_GLASSES} glasses = {DAILY_GOAL_ML} ml goal
                    </p>
                  </div>
                );
              })()}
            </div>
            {/* Quick add buttons */}
            <div className="px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Add Water
              </p>
              <div className="flex flex-wrap gap-2">
                {WATER_QUICK_ADD.map(({ label, ml }, idx) => (
                  <button
                    key={idx}
                    onClick={() => logWater(ml)}
                    disabled={hydrationLoading}
                    className="px-4 py-2.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-95"
                    style={{
                      backgroundColor: "#0A0A0A",
                      border: "1px solid #252525",
                      borderRadius: "8px",
                      color: "#E8E2D8",
                      fontFamily: "var(--font-inter)",
                      opacity: hydrationLoading ? 0.5 : 1,
                      minHeight: "48px",
                    }}
                  >
                    + {label}
                  </button>
                ))}
              </div>
              {/* Recent logs */}
              {hydrationLogs.length > 0 && (
                <div className="mt-4 flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    Today&apos;s Log
                  </p>
                  {hydrationLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                        {new Date(log.logged_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                        +{Math.round(log.amount_ml / GLASS_ML * 10) / 10} glasses ({log.amount_ml} ml)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Supplements ──────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
            Supplements
          </p>
          <div
            style={{
              backgroundColor: "#111111",
              border: "1px solid #252525",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Partner header */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid #1c1c1c", backgroundColor: "#0d0d0d" }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded"
                  style={{ backgroundColor: "#C45B2822", border: "1px solid #C45B2844" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" width={16} height={16} style={{ color: "#C45B28" }}>
                    <path d="M12 2L9 9H2L7.5 13.5L5.5 20.5L12 16L18.5 20.5L16.5 13.5L22 9H15L12 2Z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                    5 Star Nutrition
                  </p>
                  <p className="text-[10px]" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    Partner
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
                style={{ backgroundColor: "#1a4a20", color: "#4CAF50", border: "1px solid #2a6a30", fontFamily: "var(--font-inter)" }}
              >
                Member Deal
              </span>
            </div>

            {/* Deal body */}
            <div className="px-5 py-5 flex flex-col gap-4">
              <div>
                <p className="text-2xl font-black uppercase leading-tight"
                  style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}>
                  20% Off
                </p>
                <p className="text-sm font-semibold"
                  style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                  For Groundwork Members
                </p>
                <p className="text-xs mt-1 leading-relaxed"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                  Everything from protein to pre-workout, creatine, vitamins, and more.
                  Use your member discount at checkout.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Protein", "Pre-Workout", "Creatine", "Vitamins", "BCAAs"].map((item) => (
                  <span
                    key={item}
                    className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded"
                    style={{ backgroundColor: "#1a1a1a", color: "#9A9A9A", border: "1px solid #252525", fontFamily: "var(--font-inter)" }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <a
                href="https://www.5starnutrition.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Shop Now →
              </a>
            </div>
          </div>
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

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 px-5 py-3 text-sm font-semibold uppercase tracking-widest transition-all duration-300 animate-[fadeInUp_0.25s_ease]"
          style={{
            bottom: 90,
            backgroundColor: toast.type === "ok" ? "#1A2A1A" : "#2A1A1A",
            border: `1px solid ${toast.type === "ok" ? "#2A5A2A" : "#5A2A2A"}`,
            color: toast.type === "ok" ? "#5A8A5A" : "#E87070",
            borderRadius: "10px",
            fontFamily: "var(--font-inter)",
            whiteSpace: "nowrap",
          }}
        >
          {toast.type === "ok" ? "\u2713 " : ""}{toast.msg}
        </div>
      )}
    </>
  );
}
