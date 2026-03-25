"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "pay" | "budget" | "savings" | "tips";

interface BudgetCategory {
  label: string;
  amount: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  preset: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUDGET_CATEGORIES: BudgetCategory[] = [
  { label: "Rent / Mortgage", amount: "" },
  { label: "Truck / Gas", amount: "" },
  { label: "Food", amount: "" },
  { label: "Phone", amount: "" },
  { label: "Insurance", amount: "" },
  { label: "Tools", amount: "" },
  { label: "Child Support", amount: "" },
  { label: "Other", amount: "" },
];

const SAVINGS_PRESETS = ["Emergency Fund", "New Truck", "Vacation", "Tools", "Custom"];

const TIPS = [
  {
    title: "Track your per diem",
    body: "If your employer pays a per diem, document every day — it's not taxable income if used for actual expenses. Keep receipts for at least 60 days.",
  },
  {
    title: "Deduct your tools",
    body: "Tools and work equipment you buy out of pocket are tax-deductible. Keep every receipt. A $500 impact driver can lower your tax bill by $100+ depending on your bracket.",
  },
  {
    title: "Size your emergency fund right",
    body: "Construction work can be seasonal. Target 3–6 months of expenses — more if you're in a trade with common layoffs. Even $1,000 in the bank breaks the paycheck-to-paycheck cycle.",
  },
  {
    title: "Know your union benefits",
    body: "If you're in a union, your pension, annuity, and health benefits are part of your total compensation. Review your trust fund statements annually — that money is yours.",
  },
  {
    title: "Start retirement early, even small",
    body: "A Roth IRA lets you contribute up to $7,000/year after-tax. Even $50/week from age 25 can grow to $500K+ by retirement. Your future self will thank your current self.",
  },
  {
    title: "Watch overtime tax withholding",
    body: "Overtime pushes you into a higher tax bracket temporarily. Don't spend it all — set aside an extra 10–15% of OT pay so April doesn't blindside you.",
  },
];

const STORAGE_KEY = "gw_financial_v1";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPay(rate: number, hours: number) {
  const regular = Math.min(hours, 40);
  const overtime = Math.max(hours - 40, 0);
  const weekly = regular * rate + overtime * rate * 1.5;
  const monthly = weekly * 52 / 12;
  const annual = weekly * 52;
  return { weekly, monthly, annual };
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancialPage() {
  const [section, setSection] = useState<Section>("pay");

  // Pay calculator
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");

  // Budget
  const [income, setIncome] = useState("");
  const [categories, setCategories] = useState<BudgetCategory[]>(BUDGET_CATEGORIES);

  // Savings
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalPreset, setNewGoalPreset] = useState("Emergency Fund");
  const [newGoalCustomName, setNewGoalCustomName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalSaved, setNewGoalSaved] = useState("");
  const [addContribGoalId, setAddContribGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.hourlyRate) setHourlyRate(saved.hourlyRate);
      if (saved.hoursWorked) setHoursWorked(saved.hoursWorked);
      if (saved.income) setIncome(saved.income);
      if (saved.categories) setCategories(saved.categories);
      if (saved.goals) setGoals(saved.goals);
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ hourlyRate, hoursWorked, income, categories, goals }));
    } catch {}
  }, [hourlyRate, hoursWorked, income, categories, goals]);

  // ── Pay calc ──
  const rate = parseFloat(hourlyRate) || 0;
  const hours = parseFloat(hoursWorked) || 0;
  const pay = rate > 0 && hours > 0 ? calcPay(rate, hours) : null;
  const overtimeHours = Math.max(hours - 40, 0);

  // ── Budget ──
  const totalExpenses = categories.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const incomeNum = parseFloat(income) || 0;
  const remaining = incomeNum - totalExpenses;
  const barPct = incomeNum > 0 ? Math.min((totalExpenses / incomeNum) * 100, 100) : 0;

  function updateCategory(i: number, val: string) {
    setCategories(prev => prev.map((c, idx) => idx === i ? { ...c, amount: val } : c));
  }

  // ── Savings ──
  function addGoal() {
    if (!newGoalTarget) return;
    const name = newGoalPreset === "Custom" ? newGoalCustomName || "My Goal" : newGoalPreset;
    setGoals(prev => [...prev, {
      id: genId(),
      name,
      target: parseFloat(newGoalTarget) || 0,
      saved: parseFloat(newGoalSaved) || 0,
      preset: newGoalPreset,
    }]);
    setShowNewGoal(false);
    setNewGoalPreset("Emergency Fund");
    setNewGoalCustomName("");
    setNewGoalTarget("");
    setNewGoalSaved("");
  }

  function addContribution(id: string) {
    const amount = parseFloat(contribAmount) || 0;
    if (!amount) return;
    setGoals(prev => prev.map(g => g.id === id ? { ...g, saved: Math.min(g.saved + amount, g.target) } : g));
    setAddContribGoalId(null);
    setContribAmount("");
  }

  function removeGoal(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  const s = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#0a0f1a",
      color: "#f9fafb",
      paddingBottom: 80,
      fontFamily: "var(--font-inter)",
    } as React.CSSProperties,

    header: {
      padding: "20px 16px 0",
    } as React.CSSProperties,

    title: {
      fontFamily: "var(--font-oswald)",
      fontSize: 28,
      fontWeight: 700,
      color: "#f9fafb",
      letterSpacing: "0.02em",
      textTransform: "uppercase" as const,
      margin: 0,
    },

    subtitle: {
      fontSize: 13,
      color: "#6b7280",
      marginTop: 4,
    },

    disclaimer: {
      margin: "12px 16px 0",
      padding: "10px 14px",
      backgroundColor: "#111827",
      border: "1px solid #1f2937",
      borderRadius: 8,
      fontSize: 12,
      color: "#6b7280",
      lineHeight: 1.5,
    } as React.CSSProperties,

    tabs: {
      display: "flex",
      gap: 8,
      padding: "16px 16px 0",
      overflowX: "auto" as const,
    },

    tab: (active: boolean): React.CSSProperties => ({
      flexShrink: 0,
      padding: "10px 16px",
      borderRadius: 8,
      border: active ? "1px solid #f97316" : "1px solid #1f2937",
      backgroundColor: active ? "#f9731618" : "#111827",
      color: active ? "#f97316" : "#9ca3af",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
      minHeight: 40,
    }),

    card: {
      margin: "16px 16px 0",
      padding: "20px 16px",
      backgroundColor: "#111827",
      border: "1px solid #1f2937",
      borderRadius: 12,
    } as React.CSSProperties,

    label: {
      fontSize: 12,
      color: "#9ca3af",
      marginBottom: 6,
      display: "block",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    },

    input: {
      width: "100%",
      height: 48,
      backgroundColor: "#0a0f1a",
      border: "1px solid #1f2937",
      borderRadius: 8,
      color: "#f9fafb",
      fontSize: 16,
      padding: "0 14px",
      outline: "none",
      boxSizing: "border-box" as const,
    },

    row: {
      display: "flex",
      gap: 12,
    } as React.CSSProperties,

    col: {
      flex: 1,
    } as React.CSSProperties,

    resultRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid #1f2937",
    } as React.CSSProperties,

    resultLabel: {
      fontSize: 13,
      color: "#9ca3af",
    },

    resultValue: {
      fontSize: 20,
      fontWeight: 700,
      color: "#22c55e",
      fontFamily: "var(--font-oswald)",
    },

    sectionHead: {
      fontFamily: "var(--font-oswald)",
      fontSize: 16,
      fontWeight: 600,
      color: "#f9fafb",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      marginBottom: 16,
    },

    btn: {
      height: 48,
      padding: "0 20px",
      borderRadius: 8,
      border: "none",
      backgroundColor: "#f97316",
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    } as React.CSSProperties,

    btnGhost: {
      height: 44,
      padding: "0 16px",
      borderRadius: 8,
      border: "1px solid #1f2937",
      backgroundColor: "transparent",
      color: "#9ca3af",
      fontSize: 13,
      cursor: "pointer",
    } as React.CSSProperties,

    otTag: {
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 12,
      backgroundColor: "#f9731622",
      color: "#f97316",
      fontSize: 12,
      fontWeight: 600,
      marginTop: 8,
    },

    tip: {
      margin: "12px 0 0",
      padding: "14px 16px",
      backgroundColor: "#0a0f1a",
      border: "1px solid #1f2937",
      borderRadius: 10,
    } as React.CSSProperties,

    tipTitle: {
      fontSize: 14,
      fontWeight: 600,
      color: "#22c55e",
      marginBottom: 4,
    },

    tipBody: {
      fontSize: 13,
      color: "#9ca3af",
      lineHeight: 1.6,
    },
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Financial</h1>
        <p style={s.subtitle}>Personal tracking — not financial advice</p>
      </div>

      {/* Disclaimer */}
      <div style={s.disclaimer}>
        All data is stored locally on this device only. Nothing is sent to a server.
        This tool is for personal budgeting awareness — not financial advice.
      </div>

      {/* Section Tabs */}
      <div style={s.tabs}>
        {(["pay", "budget", "savings", "tips"] as Section[]).map(sec => (
          <button key={sec} style={s.tab(section === sec)} onClick={() => setSection(sec)}>
            {sec === "pay" && "Pay Calc"}
            {sec === "budget" && "Budget"}
            {sec === "savings" && "Savings Goals"}
            {sec === "tips" && "Tips"}
          </button>
        ))}
      </div>

      {/* ── Pay Calculator ── */}
      {section === "pay" && (
        <>
          <div style={s.card}>
            <p style={s.sectionHead}>Weekly Pay</p>
            <div style={s.row}>
              <div style={s.col}>
                <label style={s.label}>Hourly Rate ($)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 28.50"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(e.target.value)}
                  style={s.input}
                />
              </div>
              <div style={s.col}>
                <label style={s.label}>Hours This Week</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 46"
                  value={hoursWorked}
                  onChange={e => setHoursWorked(e.target.value)}
                  style={s.input}
                />
              </div>
            </div>
            {overtimeHours > 0 && (
              <span style={s.otTag}>
                {overtimeHours}h overtime @ 1.5x
              </span>
            )}
          </div>

          {pay && (
            <div style={s.card}>
              <div style={s.resultRow}>
                <span style={s.resultLabel}>Weekly gross</span>
                <span style={s.resultValue}>{fmt(pay.weekly)}</span>
              </div>
              <div style={s.resultRow}>
                <span style={s.resultLabel}>Monthly (avg)</span>
                <span style={s.resultValue}>{fmt(pay.monthly)}</span>
              </div>
              <div style={{ ...s.resultRow, borderBottom: "none" }}>
                <span style={s.resultLabel}>Annual</span>
                <span style={{ ...s.resultValue, fontSize: 26 }}>{fmt(pay.annual)}</span>
              </div>
              <p style={{ fontSize: 11, color: "#4b5563", marginTop: 12 }}>
                Gross figures before taxes, insurance, or retirement deductions.
              </p>
            </div>
          )}

          {!pay && (
            <div style={{ ...s.card, textAlign: "center" as const, color: "#4b5563", fontSize: 14 }}>
              Enter your hourly rate and hours to see your pay breakdown.
            </div>
          )}
        </>
      )}

      {/* ── Budget Snapshot ── */}
      {section === "budget" && (
        <>
          <div style={s.card}>
            <p style={s.sectionHead}>Income</p>
            <label style={s.label}>Weekly take-home ($)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 1200"
              value={income}
              onChange={e => setIncome(e.target.value)}
              style={s.input}
            />
          </div>

          <div style={s.card}>
            <p style={s.sectionHead}>Expenses</p>
            {categories.map((cat, i) => (
              <div key={cat.label} style={{ marginBottom: 14 }}>
                <label style={s.label}>{cat.label}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={cat.amount}
                  onChange={e => updateCategory(i, e.target.value)}
                  style={s.input}
                />
              </div>
            ))}
          </div>

          {/* Visual Bar */}
          <div style={s.card}>
            <p style={s.sectionHead}>Snapshot</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Income</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>{fmt(incomeNum)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Expenses</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: totalExpenses > incomeNum ? "#ef4444" : "#f9fafb" }}>
                {fmt(totalExpenses)}
              </span>
            </div>
            {/* Bar */}
            <div style={{ height: 16, backgroundColor: "#1f2937", borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
              <div style={{
                height: "100%",
                width: `${barPct}%`,
                backgroundColor: barPct >= 100 ? "#ef4444" : barPct >= 80 ? "#f97316" : "#22c55e",
                borderRadius: 8,
                transition: "width 0.4s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Remaining</span>
              <span style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "var(--font-oswald)",
                color: remaining < 0 ? "#ef4444" : remaining < incomeNum * 0.1 ? "#f97316" : "#22c55e",
              }}>
                {fmt(remaining)}
              </span>
            </div>
            {remaining < 0 && (
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>
                Expenses exceed income by {fmt(Math.abs(remaining))}
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Savings Goals ── */}
      {section === "savings" && (
        <>
          {goals.map(goal => {
            const pct = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
            return (
              <div key={goal.id} style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, color: "#f9fafb", margin: 0 }}>{goal.name}</p>
                    <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
                      {fmt(goal.saved)} of {fmt(goal.target)}
                    </p>
                  </div>
                  <button onClick={() => removeGoal(goal.id)} style={{ background: "none", border: "none", color: "#4b5563", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
                {/* Progress bar */}
                <div style={{ height: 12, backgroundColor: "#1f2937", borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{
                    height: "100%",
                    width: `${pct}%`,
                    backgroundColor: pct >= 100 ? "#22c55e" : "#f97316",
                    borderRadius: 6,
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{Math.round(pct)}% funded</span>
                  {addContribGoalId === goal.id ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="Amount"
                        value={contribAmount}
                        onChange={e => setContribAmount(e.target.value)}
                        style={{ ...s.input, width: 110, height: 40, fontSize: 14 }}
                      />
                      <button style={{ ...s.btn, height: 40, padding: "0 14px", fontSize: 13 }} onClick={() => addContribution(goal.id)}>
                        Add
                      </button>
                      <button style={{ ...s.btnGhost, height: 40 }} onClick={() => setAddContribGoalId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      style={{ ...s.btnGhost, height: 38, fontSize: 13 }}
                      onClick={() => { setAddContribGoalId(goal.id); setContribAmount(""); }}
                    >
                      + Add funds
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* New Goal Form */}
          {showNewGoal ? (
            <div style={s.card}>
              <p style={s.sectionHead}>New Goal</p>
              <label style={s.label}>Goal Type</label>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 16 }}>
                {SAVINGS_PRESETS.map(p => (
                  <button
                    key={p}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: newGoalPreset === p ? "1px solid #f97316" : "1px solid #1f2937",
                      backgroundColor: newGoalPreset === p ? "#f9731618" : "transparent",
                      color: newGoalPreset === p ? "#f97316" : "#9ca3af",
                      fontSize: 13,
                      cursor: "pointer",
                      minHeight: 40,
                    }}
                    onClick={() => setNewGoalPreset(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {newGoalPreset === "Custom" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Goal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Down payment"
                    value={newGoalCustomName}
                    onChange={e => setNewGoalCustomName(e.target.value)}
                    style={s.input}
                  />
                </div>
              )}
              <div style={{ ...s.row, marginBottom: 16 }}>
                <div style={s.col}>
                  <label style={s.label}>Target ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="e.g. 5000"
                    value={newGoalTarget}
                    onChange={e => setNewGoalTarget(e.target.value)}
                    style={s.input}
                  />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Already saved ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={newGoalSaved}
                    onChange={e => setNewGoalSaved(e.target.value)}
                    style={s.input}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ ...s.btn, flex: 1 }} onClick={addGoal}>Save Goal</button>
                <button style={{ ...s.btnGhost, flex: 1 }} onClick={() => setShowNewGoal(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 16px 0" }}>
              <button style={{ ...s.btn, width: "100%" }} onClick={() => setShowNewGoal(true)}>
                + New Savings Goal
              </button>
            </div>
          )}

          {goals.length === 0 && !showNewGoal && (
            <div style={{ ...s.card, textAlign: "center" as const, color: "#4b5563", fontSize: 14 }}>
              No goals yet. Set your first savings target.
            </div>
          )}
        </>
      )}

      {/* ── Tips ── */}
      {section === "tips" && (
        <div style={{ padding: "16px 16px 0" }}>
          <p style={{ ...s.sectionHead, marginBottom: 4 }}>Financial Tips</p>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 0 }}>Practical guidance for construction workers</p>
          {TIPS.map(tip => (
            <div key={tip.title} style={s.tip}>
              <p style={s.tipTitle}>{tip.title}</p>
              <p style={s.tipBody}>{tip.body}</p>
            </div>
          ))}
          <p style={{ fontSize: 11, color: "#374151", textAlign: "center" as const, marginTop: 20 }}>
            This is general information, not professional financial advice.
            Consult a CPA or financial advisor for your specific situation.
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
