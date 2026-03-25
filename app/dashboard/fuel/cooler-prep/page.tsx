"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

// ── Types ──────────────────────────────────────────────────────────────────────

type Category = "All" | "High Protein" | "Quick & Easy" | "Budget Friendly" | "No Reheat Needed";

type Recipe = {
  id: string;
  name: string;
  prepTime: string;
  category: Exclude<Category, "All">;
  ingredients: string[];
  instructions: string[];
  calories: number;
  protein: number;
  coolerTip: string;
};

// ── Data ───────────────────────────────────────────────────────────────────────

const RECIPES: Recipe[] = [
  // ── High Protein ─────────────────────────────────────────
  {
    id: "turkey-egg-rollups",
    name: "Turkey & Hard-Boiled Egg Roll-Ups",
    prepTime: "10 min",
    category: "High Protein",
    ingredients: [
      "4 large eggs",
      "4 slices deli turkey",
      "4 slices provolone",
      "Yellow mustard",
      "Salt & pepper",
    ],
    instructions: [
      "Boil eggs 10 minutes, peel, slice in half.",
      "Lay turkey flat, add a slice of provolone, a drizzle of mustard.",
      "Place egg half at edge, roll up tight, secure with toothpick.",
      "Pack in a zip bag or small container.",
    ],
    calories: 320,
    protein: 38,
    coolerTip: "Keeps 4–5 hours in a cold cooler. Store in a sealed container so they don't dry out.",
  },
  {
    id: "greek-yogurt-parfait",
    name: "Greek Yogurt Parfait",
    prepTime: "5 min",
    category: "High Protein",
    ingredients: [
      "1 cup plain Greek yogurt (2%)",
      "¼ cup granola",
      "½ cup mixed berries",
      "1 tbsp honey",
    ],
    instructions: [
      "Layer yogurt, berries, and granola in a mason jar or container with a lid.",
      "Drizzle honey on top.",
      "Pack granola separately if you want it crunchy at lunch.",
    ],
    calories: 340,
    protein: 22,
    coolerTip: "Store upright. Keeps 6+ hours cold. Granola in a separate bag to stay crisp.",
  },
  {
    id: "tuna-pepper-cups",
    name: "Tuna Salad Bell Pepper Cups",
    prepTime: "10 min",
    category: "High Protein",
    ingredients: [
      "2 cans tuna in water (5 oz each)",
      "2 tbsp mayo",
      "1 tsp lemon juice",
      "Salt, pepper, celery seed",
      "2 large bell peppers, halved & seeded",
    ],
    instructions: [
      "Drain tuna, mix with mayo, lemon juice, salt, and pepper.",
      "Cut peppers in half lengthwise, remove seeds.",
      "Spoon tuna mix into each pepper half.",
      "Pack in a flat container, cups facing up.",
    ],
    calories: 290,
    protein: 40,
    coolerTip: "Don't stack — pack flat so tuna stays in the cups. Lasts 5 hours cold.",
  },
  {
    id: "chicken-cheese-wrap",
    name: "Grilled Chicken & Cheddar Wrap",
    prepTime: "15 min",
    category: "High Protein",
    ingredients: [
      "6 oz grilled chicken breast, sliced",
      "1 large flour tortilla",
      "2 slices sharp cheddar",
      "Romaine lettuce",
      "Chipotle mayo or hot sauce",
    ],
    instructions: [
      "Grill or slice pre-cooked chicken.",
      "Spread chipotle mayo on tortilla.",
      "Layer cheese, chicken, and lettuce.",
      "Wrap tight, slice in half, wrap in foil.",
    ],
    calories: 480,
    protein: 44,
    coolerTip: "Wrap individually in foil, then a zip bag. Holds texture up to 6 hours.",
  },
  {
    id: "beef-bean-burrito",
    name: "Beef & Black Bean Burrito",
    prepTime: "20 min",
    category: "High Protein",
    ingredients: [
      "½ lb 90% lean ground beef",
      "½ cup black beans, drained",
      "Taco seasoning packet",
      "2 large flour tortillas",
      "Shredded Mexican cheese",
    ],
    instructions: [
      "Brown beef with taco seasoning, drain fat.",
      "Add black beans, stir together.",
      "Fill tortillas with meat mix and cheese.",
      "Roll tight, wrap in foil, refrigerate until morning.",
    ],
    calories: 520,
    protein: 42,
    coolerTip: "Cold burritos hold well 6+ hours. Reheat on a truck dash or eat cold — both work.",
  },

  // ── Quick & Easy ─────────────────────────────────────────
  {
    id: "pb-banana-roll",
    name: "PB & Banana Tortilla Roll",
    prepTime: "5 min",
    category: "Quick & Easy",
    ingredients: [
      "2 tbsp peanut butter",
      "1 large flour tortilla",
      "1 ripe banana",
      "Drizzle of honey (optional)",
    ],
    instructions: [
      "Spread peanut butter across the tortilla.",
      "Place whole banana at one edge.",
      "Roll up tightly.",
      "Slice into rounds or leave whole, wrap in foil.",
    ],
    calories: 380,
    protein: 12,
    coolerTip: "Banana will brown slightly — totally fine to eat. Doesn't need to be cold, but stays better in the cooler.",
  },
  {
    id: "cheese-pepperoni-pack",
    name: "String Cheese & Pepperoni Snack Pack",
    prepTime: "3 min",
    category: "Quick & Easy",
    ingredients: [
      "3 string cheese sticks",
      "2 oz pepperoni slices",
      "1 handful crackers",
      "A few pickles",
    ],
    instructions: [
      "Toss everything into a zip-lock bag or divided snack container.",
      "Done.",
    ],
    calories: 390,
    protein: 22,
    coolerTip: "One of the most packable lunches there is. Keeps 8+ hours no problem.",
  },
  {
    id: "hummus-veggie-cups",
    name: "Hummus & Veggie Cups",
    prepTime: "8 min",
    category: "Quick & Easy",
    ingredients: [
      "½ cup hummus",
      "Carrot sticks",
      "Cucumber rounds",
      "Celery sticks",
      "Mini pita bread",
    ],
    instructions: [
      "Spoon hummus into a small container with a lid.",
      "Pack veggies and pita in a separate bag.",
      "Dip as you go.",
    ],
    calories: 310,
    protein: 10,
    coolerTip: "Veggies stay crisp all day in a cold cooler. Great hot-weather meal — no risk of spoilage.",
  },
  {
    id: "overnight-oats",
    name: "Overnight Oats",
    prepTime: "5 min (night before)",
    category: "Quick & Easy",
    ingredients: [
      "½ cup rolled oats",
      "¾ cup milk (or almond milk)",
      "1 tbsp chia seeds",
      "1 tbsp honey",
      "Sliced banana or berries",
    ],
    instructions: [
      "Mix oats, milk, chia seeds, and honey in a jar with a lid.",
      "Top with fruit.",
      "Seal and refrigerate overnight.",
      "Grab and go in the morning.",
    ],
    calories: 350,
    protein: 11,
    coolerTip: "Already cold — perfect for the cooler. Eat within 24 hours for best texture.",
  },
  {
    id: "trail-mix",
    name: "High-Energy Trail Mix",
    prepTime: "5 min",
    category: "Quick & Easy",
    ingredients: [
      "¼ cup mixed nuts (almonds, cashews, peanuts)",
      "¼ cup dried cranberries or raisins",
      "2 tbsp dark chocolate chips",
      "2 tbsp sunflower seeds",
    ],
    instructions: [
      "Mix everything together in a zip bag.",
      "Pack as many bags as you need for the week.",
    ],
    calories: 360,
    protein: 9,
    coolerTip: "Doesn't need refrigeration at all — but cooler keeps chocolate from melting.",
  },

  // ── Budget Friendly ───────────────────────────────────────
  {
    id: "rice-beans",
    name: "Rice, Black Beans & Hot Sauce",
    prepTime: "10 min",
    category: "Budget Friendly",
    ingredients: [
      "1 cup cooked white rice",
      "½ cup black beans, drained",
      "Hot sauce to taste",
      "Salt, cumin, lime juice",
      "Shredded cheese (optional)",
    ],
    instructions: [
      "Cook rice in bulk at the start of the week.",
      "Mix rice and beans, season with cumin, salt, and lime juice.",
      "Pack into a container, add hot sauce.",
      "Top with cheese if using.",
    ],
    calories: 380,
    protein: 15,
    coolerTip: "Reheat or eat cold — both work. Keeps 5 days refrigerated. One of the cheapest meals here.",
  },
  {
    id: "egg-salad-sandwich",
    name: "Egg Salad Sandwich",
    prepTime: "15 min",
    category: "Budget Friendly",
    ingredients: [
      "4 hard-boiled eggs",
      "2 tbsp mayo",
      "1 tsp mustard",
      "Salt, pepper, paprika",
      "Whole wheat bread",
    ],
    instructions: [
      "Boil and peel eggs, chop roughly.",
      "Mix with mayo, mustard, salt, pepper.",
      "Spread generously on bread.",
      "Wrap sandwich in foil or wax paper.",
    ],
    calories: 410,
    protein: 24,
    coolerTip: "Pack the egg salad and bread separately. Assemble at lunch so bread doesn't get soggy.",
  },
  {
    id: "pb-crackers",
    name: "Peanut Butter & Crackers",
    prepTime: "5 min",
    category: "Budget Friendly",
    ingredients: [
      "3 tbsp peanut butter",
      "Whole wheat or regular crackers",
      "1 apple or banana",
    ],
    instructions: [
      "Pack peanut butter in a small container.",
      "Pack crackers in a bag.",
      "Grab a piece of fruit.",
      "Dip and snack.",
    ],
    calories: 420,
    protein: 14,
    coolerTip: "Peanut butter doesn't need cold, but the fruit does. Easy, cheap, filling.",
  },
  {
    id: "tuna-crackers",
    name: "Canned Tuna with Crackers",
    prepTime: "5 min",
    category: "Budget Friendly",
    ingredients: [
      "1 can tuna in water (5 oz)",
      "1 tbsp mayo or mustard",
      "Whole grain crackers",
      "Hot sauce (optional)",
    ],
    instructions: [
      "Bring the can to the job — open at lunch.",
      "Mix tuna with a little mayo or mustard right in the can.",
      "Eat on crackers.",
    ],
    calories: 280,
    protein: 32,
    coolerTip: "Can is shelf-stable. Keep crackers in a separate bag so they don't get soft.",
  },
  {
    id: "pasta-salad",
    name: "Hearty Pasta Salad",
    prepTime: "20 min",
    category: "Budget Friendly",
    ingredients: [
      "2 cups cooked rotini pasta",
      "½ cup cherry tomatoes, halved",
      "¼ cup black olives",
      "2 oz salami or pepperoni",
      "Italian dressing",
    ],
    instructions: [
      "Cook pasta, drain, and cool completely.",
      "Toss with tomatoes, olives, salami, and dressing.",
      "Refrigerate overnight, pack in containers.",
    ],
    calories: 450,
    protein: 17,
    coolerTip: "Actually gets better overnight as it marinates. Keeps 4 days cold.",
  },

  // ── No Reheat Needed ──────────────────────────────────────
  {
    id: "cold-sub-slices",
    name: "Cold Sub Sandwich Slices",
    prepTime: "10 min",
    category: "No Reheat Needed",
    ingredients: [
      "1 hoagie roll",
      "3 oz deli ham or roast beef",
      "2 slices provolone",
      "Lettuce, tomato, banana peppers",
      "Oil & vinegar or mayo",
    ],
    instructions: [
      "Build the sub the night before.",
      "Wrap in foil, then a zip bag.",
      "Slice in half for easy handling at lunch.",
    ],
    calories: 490,
    protein: 31,
    coolerTip: "Keep tomatoes separate if you hate soggy bread — add at lunchtime.",
  },
  {
    id: "caprese-skewers",
    name: "Caprese Skewers",
    prepTime: "10 min",
    category: "No Reheat Needed",
    ingredients: [
      "8 oz fresh mozzarella balls",
      "1 cup cherry tomatoes",
      "Fresh basil leaves",
      "Balsamic glaze",
      "Salt & pepper",
    ],
    instructions: [
      "Thread mozzarella, tomato, and basil onto toothpicks or small skewers.",
      "Drizzle balsamic glaze over top.",
      "Season with salt and pepper.",
      "Pack in a container with a tight lid.",
    ],
    calories: 300,
    protein: 18,
    coolerTip: "Looks fancy, takes 10 minutes. Best eaten same day — mozzarella doesn't hold great after 6 hours.",
  },
  {
    id: "blt-lettuce-wraps",
    name: "BLT Lettuce Wraps",
    prepTime: "10 min",
    category: "No Reheat Needed",
    ingredients: [
      "6 strips cooked bacon (cook night before)",
      "1 cup cherry tomatoes",
      "6 large romaine lettuce leaves",
      "2 tbsp mayo",
      "Salt & pepper",
    ],
    instructions: [
      "Cook bacon the night before, let cool.",
      "Pack bacon, tomatoes, and lettuce separately.",
      "At lunch: spread mayo on lettuce, add bacon and tomatoes, roll up.",
    ],
    calories: 310,
    protein: 16,
    coolerTip: "Pack components separately — assemble at lunch so lettuce stays crisp.",
  },
  {
    id: "deli-rollups",
    name: "Deli Meat & Cream Cheese Roll-Ups",
    prepTime: "8 min",
    category: "No Reheat Needed",
    ingredients: [
      "4 oz deli turkey or roast beef",
      "3 tbsp cream cheese",
      "4 large pickle spears",
      "Spinach leaves",
    ],
    instructions: [
      "Spread cream cheese on each slice of deli meat.",
      "Add a few spinach leaves and a pickle spear.",
      "Roll up tightly.",
      "Pack in a container, seam side down.",
    ],
    calories: 260,
    protein: 24,
    coolerTip: "Very packable, no fork needed. Great when you need to eat fast.",
  },
  {
    id: "avocado-rice-cakes",
    name: "Avocado & Turkey Rice Cakes",
    prepTime: "8 min",
    category: "No Reheat Needed",
    ingredients: [
      "4 rice cakes",
      "1 ripe avocado",
      "4 slices deli turkey",
      "Lemon juice, salt, red pepper flakes",
    ],
    instructions: [
      "Pack avocado whole (it won't brown if you leave the pit in).",
      "Pack rice cakes in a bag, turkey in a bag.",
      "At lunch: mash avocado with lemon juice and salt, top rice cakes with turkey and avocado.",
    ],
    calories: 340,
    protein: 20,
    coolerTip: "Bring avocado whole — cut and mash at lunch. Much better than pre-made guac after 8 hours.",
  },
];

const CATEGORIES: Category[] = ["All", "High Protein", "Quick & Easy", "Budget Friendly", "No Reheat Needed"];

const CATEGORY_COLORS: Record<Exclude<Category, "All">, string> = {
  "High Protein": "#f97316",
  "Quick & Easy": "#2ab5b5",
  "Budget Friendly": "#eab308",
  "No Reheat Needed": "#a855f7",
};

const COOLER_TIPS = [
  {
    icon: "🧊",
    title: "Best Ice Packs for the Jobsite",
    body: "Freeze water bottles instead of buying ice packs — they last longer, don't make a mess when they melt, and you can drink the water after. 2-liter bottles work best for all-day cold.",
  },
  {
    icon: "🌡️",
    title: "Food Safety in the Heat",
    body: "Keep your cooler out of direct sun. Bacteria grows fast above 40°F. If food has been sitting above 90°F for more than 1 hour, don't risk it — toss it. Not worth getting sick on the job.",
  },
  {
    icon: "⏱️",
    title: "How to Stay Cold 8+ Hours",
    body: "Pre-chill your cooler the night before. Pack food cold — not room temp. Use a 2:1 ice-to-food ratio. Keep the lid closed. A quality hard-sided cooler outperforms soft coolers in heat.",
  },
  {
    icon: "📦",
    title: "Best Cooler for the Job",
    body: "Yeti or RTIC hard-sided coolers hold temp the best. For budget: Igloo MaxCold is solid for the price. Avoid thin-walled plastic — they're basically room temp by 10am in summer.",
  },
];

const STORAGE_KEY = "gw-cooler-prep-saved";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CoolerPrepPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [openRecipe, setOpenRecipe] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSavedIds(new Set(JSON.parse(raw)));
      } catch {
        // ignore
      }
    }
  }, []);

  function toggleSaved(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast("Removed from plan");
      } else {
        next.add(id);
        showToast("Added to your plan");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const filtered =
    activeCategory === "All"
      ? RECIPES
      : RECIPES.filter((r) => r.category === activeCategory);

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0a0f1a", color: "#E8E2D8" }}
    >
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 z-50 px-5 py-3 text-sm font-semibold rounded-xl shadow-lg"
          style={{
            transform: "translateX(-50%)",
            backgroundColor: "#1a2535",
            border: "1px solid #2a3545",
            color: "#E8E2D8",
            fontFamily: "var(--font-inter)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      <div className="max-w-3xl w-full mx-auto flex flex-col gap-10">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/nutrition"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "4px" }}
            aria-label="Back to Fuel"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
              Fuel / Meal Prep
            </p>
            <h1 className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>
              Cooler Prep
            </h1>
          </div>
        </header>

        {/* Intro */}
        <p className="text-sm leading-relaxed -mt-4" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          20 job-ready meals that pack in a cooler and actually hold up through a full shift.
          No stove at lunchtime. No excuses.
        </p>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const accent = cat === "All" ? "#f97316" : CATEGORY_COLORS[cat as Exclude<Category, "All">];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-150"
                style={{
                  fontFamily: "var(--font-inter)",
                  borderRadius: "8px",
                  minHeight: "40px",
                  backgroundColor: isActive ? accent : "#111827",
                  color: isActive ? "#0a0f1a" : "#9A9A9A",
                  border: isActive ? `1px solid ${accent}` : "1px solid #1e2d40",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Saved count */}
        {savedIds.size > 0 && (
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ backgroundColor: "#1A0A00", border: "1px solid #2A1A00", borderRadius: "10px" }}
          >
            <span style={{ color: "#f97316", fontSize: "18px" }}>★</span>
            <p className="text-sm font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
              {savedIds.size} recipe{savedIds.size !== 1 ? "s" : ""} in your plan
            </p>
          </div>
        )}

        {/* Recipe List */}
        <div className="flex flex-col gap-4">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isOpen={openRecipe === recipe.id}
              isSaved={savedIds.has(recipe.id)}
              onToggle={() => setOpenRecipe(openRecipe === recipe.id ? null : recipe.id)}
              onSaveToggle={() => toggleSaved(recipe.id)}
            />
          ))}
        </div>

        {/* Practical Tips */}
        <section className="pb-28">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-5"
            style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
            Cooler Tips
          </p>
          <div className="flex flex-col gap-4">
            {COOLER_TIPS.map((tip) => (
              <div
                key={tip.title}
                className="px-6 py-5 flex gap-4"
                style={{
                  backgroundColor: "#111827",
                  border: "1px solid #1e2d40",
                  borderRadius: "12px",
                }}
              >
                <span style={{ fontSize: "22px", flexShrink: 0 }}>{tip.icon}</span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                    {tip.title}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    {tip.body}
                  </p>
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

// ── Recipe Card ────────────────────────────────────────────────────────────────

function RecipeCard({
  recipe, isOpen, isSaved, onToggle, onSaveToggle,
}: {
  recipe: Recipe;
  isOpen: boolean;
  isSaved: boolean;
  onToggle: () => void;
  onSaveToggle: () => void;
}) {
  const accent = CATEGORY_COLORS[recipe.category];

  return (
    <div
      style={{
        backgroundColor: "#111827",
        border: `1px solid ${isOpen ? accent : "#1e2d40"}`,
        borderRadius: "12px",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4"
        style={{ minHeight: "72px" }}
      >
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold uppercase tracking-widest px-2 py-0.5"
              style={{
                color: accent,
                backgroundColor: `${accent}18`,
                border: `1px solid ${accent}40`,
                borderRadius: "6px",
                fontFamily: "var(--font-inter)",
              }}
            >
              {recipe.category}
            </span>
            <span className="text-xs" style={{ color: "#4a5568", fontFamily: "var(--font-inter)" }}>
              {recipe.prepTime}
            </span>
          </div>
          <h3 className="text-base font-bold leading-snug"
            style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
            {recipe.name}
          </h3>
          <div className="flex gap-4">
            <span className="text-xs font-semibold" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {recipe.calories} cal
            </span>
            <span className="text-xs font-semibold" style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>
              {recipe.protein}g protein
            </span>
          </div>
        </div>
        <span
          className="text-lg shrink-0 mt-1"
          style={{
            color: "#f97316",
            display: "inline-block",
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ▶
        </span>
      </button>

      {/* Expanded */}
      {isOpen && (
        <div className="px-6 pb-6 flex flex-col gap-5" style={{ borderTop: "1px solid #1e2d40" }}>

          {/* Ingredients */}
          <div className="pt-5 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: accent, fontFamily: "var(--font-inter)" }}>
              Ingredients
            </p>
            <ul className="flex flex-col gap-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-xs shrink-0 mt-0.5" style={{ color: accent, fontFamily: "var(--font-inter)" }}>•</span>
                  <span className="text-sm" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Instructions
            </p>
            <ol className="flex flex-col gap-2">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-xs font-bold shrink-0 w-5 mt-0.5"
                    style={{ color: accent, fontFamily: "var(--font-inter)" }}>
                    {i + 1}.
                  </span>
                  <span className="text-sm leading-relaxed"
                    style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nutrition */}
          <div
            className="flex gap-6 px-4 py-3"
            style={{ backgroundColor: "#0a0f1a", borderRadius: "8px", border: "1px solid #1e2d40" }}
          >
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: "#4a5568", fontFamily: "var(--font-inter)" }}>Calories</p>
              <p className="text-lg font-bold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{recipe.calories}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: "#4a5568", fontFamily: "var(--font-inter)" }}>Protein</p>
              <p className="text-lg font-bold" style={{ color: "#f97316", fontFamily: "var(--font-inter)" }}>{recipe.protein}g</p>
            </div>
          </div>

          {/* Cooler Tip */}
          <div
            className="flex gap-3 px-4 py-3"
            style={{ backgroundColor: "#0d1f35", borderRadius: "8px", border: "1px solid #1e2d40" }}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>🧊</span>
            <p className="text-xs leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              {recipe.coolerTip}
            </p>
          </div>

          {/* Add to Plan */}
          <button
            onClick={onSaveToggle}
            className="w-full py-3.5 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
            style={{
              fontFamily: "var(--font-inter)",
              borderRadius: "8px",
              minHeight: "48px",
              backgroundColor: isSaved ? "#111827" : "#f97316",
              color: isSaved ? "#f97316" : "#0a0f1a",
              border: isSaved ? "1px solid #f97316" : "1px solid transparent",
            }}
          >
            {isSaved ? "★ In My Plan" : "Add to My Plan"}
          </button>
        </div>
      )}
    </div>
  );
}
