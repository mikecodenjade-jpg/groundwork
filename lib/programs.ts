// ─── Types ────────────────────────────────────────────────────────────────────

export type DayWorkout = {
  name: string;
  focus: string;
  duration: number; // minutes
  exercises: number;
};

export type Week = {
  num: number;
  title: string;
  description: string;
  phase: string;
  phaseNum: number;
  dailyTime: number;
  days: DayWorkout[];
};

export type Phase = {
  name: string;
  num: number;
  weekStart: number;
  weekEnd: number;
};

export type Program = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  totalWeeks: number | null;
  workouts: string;
  timePerDay: string;
  difficulty: "Beginner" | "All Levels" | "Advanced";
  phases: Phase[];
  workoutCategory: string; // maps to /dashboard/body/[category]
  ongoing: boolean;
};

// ─── Day templates by program + phase ────────────────────────────────────────

const F16_PHASE_DAYS: Record<number, DayWorkout[]> = {
  1: [
    { name: "Upper Push",   focus: "Chest · Shoulders · Triceps",   duration: 30, exercises: 3 },
    { name: "Lower Body",   focus: "Quads · Hamstrings · Glutes",   duration: 30, exercises: 3 },
    { name: "Upper Pull",   focus: "Back · Biceps · Rear Delt",     duration: 30, exercises: 3 },
    { name: "Core & Carry", focus: "Core · Stability · Grip",       duration: 30, exercises: 3 },
    { name: "Full Circuit", focus: "Full Body · Conditioning",       duration: 35, exercises: 4 },
  ],
  2: [
    { name: "Chest & Triceps",  focus: "Hypertrophy Push",          duration: 35, exercises: 4 },
    { name: "Legs & Glutes",    focus: "Hypertrophy Lower",         duration: 35, exercises: 4 },
    { name: "Back & Biceps",    focus: "Hypertrophy Pull",          duration: 35, exercises: 4 },
    { name: "Shoulders & Core", focus: "Overhead · Stability",      duration: 35, exercises: 4 },
    { name: "Compound Power",   focus: "Full Body · Strength",      duration: 40, exercises: 4 },
  ],
  3: [
    { name: "Heavy Push",        focus: "Chest · Shoulders · Strength", duration: 40, exercises: 4 },
    { name: "Heavy Pull",        focus: "Back · Biceps · Power",         duration: 40, exercises: 4 },
    { name: "Power Lower",       focus: "Squats · Deadlifts · Drive",    duration: 40, exercises: 4 },
    { name: "Metabolic Circuit", focus: "Full Body · Conditioning",      duration: 40, exercises: 5 },
    { name: "Strength Complex",  focus: "Compound · Peak Prep",          duration: 45, exercises: 5 },
  ],
  4: [
    { name: "Max Push",          focus: "Peak Chest · Peak Shoulders", duration: 45, exercises: 5 },
    { name: "Max Pull",          focus: "Peak Back · Peak Biceps",     duration: 45, exercises: 5 },
    { name: "Max Lower",         focus: "Peak Squats · Peak Deadlifts",duration: 45, exercises: 5 },
    { name: "Peak Conditioning", focus: "Full Body · Elite Output",    duration: 45, exercises: 5 },
    { name: "Full Performance",  focus: "Complete · Evaluate",         duration: 45, exercises: 5 },
  ],
};

const F16_WEEK_META: { title: string; description: string }[] = [
  { title: "Ignition",           description: "Start here. Build the habit before you build the muscle." },
  { title: "Pattern",            description: "The movements become yours this week." },
  { title: "Push Further",       description: "You've earned the right to add intensity." },
  { title: "Recovery",           description: "Planned deload. This week makes the next 12 better." },
  { title: "Volume Starts",      description: "More sets, more reps, same form." },
  { title: "Hypertrophy Drive",  description: "This is where muscle gets built." },
  { title: "Progressive Load",   description: "Add weight. Trust the process." },
  { title: "Strength Check",     description: "Test yourself. You're different than week 1." },
  { title: "Power Entry",        description: "Heavier loads. Fewer reps. More intensity." },
  { title: "High Intensity",     description: "You've been preparing for this week." },
  { title: "Max Effort",         description: "Everything you've built, all at once." },
  { title: "Peak Prep",          description: "Dial in form. Prepare to perform." },
  { title: "Competition Mode",   description: "Train like something is on the line." },
  { title: "Max Volume",         description: "The hardest week you've done." },
  { title: "Final Push",         description: "One week left. Go." },
  { title: "Peak Week",          description: "You made it. Finish what you started." },
];

const K8_PHASE_DAYS: Record<number, DayWorkout[]> = {
  1: [
    { name: "Push Intro",   focus: "Chest · Shoulders",        duration: 30, exercises: 3 },
    { name: "Pull Intro",   focus: "Back · Biceps",            duration: 30, exercises: 3 },
    { name: "Legs Intro",   focus: "Quads · Hamstrings",       duration: 30, exercises: 3 },
    { name: "Core Start",   focus: "Core · Stability",         duration: 25, exercises: 3 },
    { name: "Full Body",    focus: "Total Body · Conditioning", duration: 30, exercises: 4 },
  ],
  2: [
    { name: "Push Hard",    focus: "Heavy Chest · Shoulders",  duration: 35, exercises: 4 },
    { name: "Pull Hard",    focus: "Heavy Back · Biceps",      duration: 35, exercises: 4 },
    { name: "Leg Drive",    focus: "Heavy Lower · Power",      duration: 35, exercises: 4 },
    { name: "Conditioning", focus: "Full Body · HIIT",         duration: 35, exercises: 4 },
    { name: "Peak Out",     focus: "Compound Strength",        duration: 35, exercises: 4 },
  ],
};

const K8_WEEK_META: { title: string; description: string }[] = [
  { title: "Day One",          description: "Start. That's the only rule." },
  { title: "Building Baseline",description: "Same time, same effort, better body." },
  { title: "First Test",       description: "Push past where you stopped last time." },
  { title: "Consolidate",      description: "Short deload. Long gains ahead." },
  { title: "Level Up",         description: "Phase 2. Higher stakes, higher results." },
  { title: "Intensity Block",  description: "This is where the work gets real." },
  { title: "Final Push",       description: "One week before the finish line." },
  { title: "Finish Strong",    description: "Eight weeks. Changed. Prove it." },
];

const MF_PHASE_DAYS: Record<number, DayWorkout[]> = {
  1: [
    { name: "Ruck & Run",          focus: "Cardiovascular Base",      duration: 45, exercises: 2 },
    { name: "Functional Strength", focus: "Full Body · Load Carry",   duration: 45, exercises: 4 },
    { name: "Grip & Core",         focus: "Grip · Core · Carry",      duration: 40, exercises: 4 },
    { name: "Interval Circuit",    focus: "High Intensity · Mental",  duration: 45, exercises: 5 },
    { name: "Long Ruck",           focus: "Endurance · Load-Bearing", duration: 60, exercises: 1 },
  ],
  2: [
    { name: "Loaded Run",          focus: "Speed · Load · Endurance", duration: 50, exercises: 2 },
    { name: "Operator Strength",   focus: "Pull · Press · Carry",     duration: 50, exercises: 5 },
    { name: "Combat Core",         focus: "Core · Ground · Recovery", duration: 45, exercises: 5 },
    { name: "TACP Circuit",        focus: "Mixed Modal · High HR",    duration: 50, exercises: 5 },
    { name: "Heavy Ruck",          focus: "Weight · Distance · Grit", duration: 60, exercises: 1 },
  ],
  3: [
    { name: "Speed Ruck",          focus: "Time Trial · Load",        duration: 55, exercises: 2 },
    { name: "Max Strength",        focus: "Compound · Peak Load",     duration: 55, exercises: 5 },
    { name: "Resilience Block",    focus: "Mental · Physical · Core", duration: 50, exercises: 5 },
    { name: "Operator Standard",   focus: "Full Protocol · Complete", duration: 55, exercises: 6 },
    { name: "Peak Ruck",           focus: "Max Weight · Max Distance",duration: 60, exercises: 1 },
  ],
};

const MF_WEEK_META: { title: string; description: string }[] = [
  { title: "Baseline",          description: "Establish what you're working with." },
  { title: "Load Up",           description: "Add weight. Add distance. Hold form." },
  { title: "Mental Toughness",  description: "The body is capable. Train the mind." },
  { title: "Consolidation",     description: "Short recovery before the next block." },
  { title: "Operability",       description: "Move with weight. Move fast. Think." },
  { title: "High Output",       description: "No shortcuts this week." },
  { title: "Threshold",         description: "Push the edge of what you thought possible." },
  { title: "Recovery Block",    description: "Strategic rest before the final phase." },
  { title: "Final Protocol",    description: "Three weeks to operator standard." },
  { title: "Max Load",          description: "Everything is heavier now. Good." },
  { title: "No Quit",           description: "The hardest week in the program." },
  { title: "Operator Standard", description: "You've earned the right to finish." },
];

// ─── Programs list ────────────────────────────────────────────────────────────

export const PROGRAMS: Program[] = [
  {
    slug: "power-block",
    name: "Power Block Training",
    tagline: "The Flagship Program",
    description: "16-week periodized strength program. 4 days/week. Built to get you seriously strong.",
    totalWeeks: 16,
    workouts: "64",
    timePerDay: "30-45 min",
    difficulty: "All Levels",
    workoutCategory: "weightlifting",
    ongoing: false,
    phases: [
      { name: "Activate", num: 1, weekStart: 1,  weekEnd: 4  },
      { name: "Build",    num: 2, weekStart: 5,  weekEnd: 8  },
      { name: "Push",     num: 3, weekStart: 9,  weekEnd: 12 },
      { name: "Peak",     num: 4, weekStart: 13, weekEnd: 14 },
      { name: "Test",     num: 5, weekStart: 15, weekEnd: 16 },
    ],
  },
  {
    slug: "radically-simple-strength",
    name: "Radically Simple Strength",
    tagline: "12-Week Strength Programme",
    description: "No fluff. 3 days a week, compound lifts, progressive overload. Strength you can feel in 12 weeks.",
    totalWeeks: 12,
    workouts: "36",
    timePerDay: "45-60 min",
    difficulty: "All Levels",
    workoutCategory: "weightlifting",
    ongoing: false,
    phases: [
      { name: "Foundation", num: 1, weekStart: 1,  weekEnd: 4  },
      { name: "Build",      num: 2, weekStart: 5,  weekEnd: 8  },
      { name: "Strength",   num: 3, weekStart: 9,  weekEnd: 12 },
    ],
  },
  {
    slug: "back-in-the-groove",
    name: "Back in the Groove",
    tagline: "8-Week Conditioning Reset",
    description: "Jump rope, squats, dumbbells. 8 weeks to feel capable again. No gym required.",
    totalWeeks: 8,
    workouts: "24",
    timePerDay: "20-30 min",
    difficulty: "Beginner",
    workoutCategory: "bodyweight",
    ongoing: false,
    phases: [
      { name: "Restart", num: 1, weekStart: 1, weekEnd: 4 },
      { name: "Groove",  num: 2, weekStart: 5, weekEnd: 8 },
    ],
  },
  {
    slug: "16-week-foundation",
    name: "16-Week Foundation",
    tagline: "The full transformation.",
    description: "4 phases. 16 weeks. Built to change everything permanently.",
    totalWeeks: 16,
    workouts: "64",
    timePerDay: "30–45 min",
    difficulty: "All Levels",
    workoutCategory: "weightlifting",
    ongoing: false,
    phases: [
      { name: "Activate", num: 1, weekStart: 1,  weekEnd: 4  },
      { name: "Build",    num: 2, weekStart: 5,  weekEnd: 8  },
      { name: "Push",     num: 3, weekStart: 9,  weekEnd: 12 },
      { name: "Peak",     num: 4, weekStart: 13, weekEnd: 16 },
    ],
  },
  {
    slug: "8-week-kickstart",
    name: "8-Week Kickstart",
    tagline: "Fast results.",
    description: "Prove it to yourself before going all in.",
    totalWeeks: 8,
    workouts: "32",
    timePerDay: "30 min",
    difficulty: "Beginner",
    workoutCategory: "bodyweight",
    ongoing: false,
    phases: [
      { name: "Wake Up", num: 1, weekStart: 1, weekEnd: 4 },
      { name: "Lock In", num: 2, weekStart: 5, weekEnd: 8 },
    ],
  },
  {
    slug: "daily-blueprint",
    name: "Daily Blueprint",
    tagline: "No program. Just show up.",
    description: "No commitment. Just show up and we handle the rest.",
    totalWeeks: null,
    workouts: "Ongoing",
    timePerDay: "15–60 min",
    difficulty: "All Levels",
    workoutCategory: "bodyweight",
    ongoing: true,
    phases: [],
  },
  {
    slug: "military-functional",
    name: "Operator Conditioning",
    tagline: "12 weeks of no-nonsense functional training. Bodyweight, rucks, and grit.",
    description: "12 weeks of no-nonsense functional training. Bodyweight, rucks, and grit. For guys who want to be hard to kill.",
    totalWeeks: 12,
    workouts: "60",
    timePerDay: "45–60 min",
    difficulty: "Advanced",
    workoutCategory: "hybrid-functional",
    ongoing: false,
    phases: [
      { name: "Foundation",   num: 1, weekStart: 1,  weekEnd: 4  },
      { name: "Operability",  num: 2, weekStart: 5,  weekEnd: 8  },
      { name: "Operator",     num: 3, weekStart: 9,  weekEnd: 12 },
    ],
  },
];

// ─── Week + day generators ────────────────────────────────────────────────────

function phaseNumForWeek(program: Program, weekNum: number): number {
  for (const phase of program.phases) {
    if (weekNum >= phase.weekStart && weekNum <= phase.weekEnd) return phase.num;
  }
  return 1;
}

function phaseNameForWeek(program: Program, weekNum: number): string {
  for (const phase of program.phases) {
    if (weekNum >= phase.weekStart && weekNum <= phase.weekEnd) return phase.name;
  }
  return "";
}

export function getWeeks(slug: string): Week[] {
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program || !program.totalWeeks) return [];

  const meta =
    slug === "16-week-foundation" ? F16_WEEK_META :
    slug === "8-week-kickstart"   ? K8_WEEK_META  :
    slug === "military-functional"? MF_WEEK_META  : [];

  const phaseDays =
    slug === "16-week-foundation" ? F16_PHASE_DAYS :
    slug === "8-week-kickstart"   ? K8_PHASE_DAYS  :
    slug === "military-functional"? MF_PHASE_DAYS  : {};

  return Array.from({ length: program.totalWeeks }, (_, i) => {
    const weekNum = i + 1;
    const pNum = phaseNumForWeek(program, weekNum);
    const pName = phaseNameForWeek(program, weekNum);
    const days: DayWorkout[] = phaseDays[pNum] ?? [];
    const dailyTime = days[0]?.duration ?? 30;
    const m = meta[i] ?? { title: `Week ${weekNum}`, description: "" };

    return {
      num: weekNum,
      title: m.title,
      description: m.description,
      phase: pName,
      phaseNum: pNum,
      dailyTime,
      days,
    };
  });
}

export function getDays(slug: string, weekNum: number): DayWorkout[] {
  const weeks = getWeeks(slug);
  return weeks.find((w) => w.num === weekNum)?.days ?? [];
}

export function getProgramBySlug(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

export function getPhaseForWeek(slug: string, weekNum: number): Phase | undefined {
  const program = getProgramBySlug(slug);
  return program?.phases.find(
    (ph) => weekNum >= ph.weekStart && weekNum <= ph.weekEnd
  );
}
