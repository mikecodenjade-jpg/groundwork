"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          console.error("Supabase signup error:", JSON.stringify(error, null, 2));
          const msg =
            typeof error.message === "string" && error.message.length > 0
              ? error.message
              : error.status
              ? `Authentication failed (${error.status})`
              : "Sign up failed. Please try again.";
          setError(msg);
        } else {
          router.push("/onboarding");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error("Supabase signin error:", JSON.stringify(error, null, 2));
          const msg =
            typeof error.message === "string" && error.message.length > 0
              ? error.message
              : error.status
              ? `Authentication failed (${error.status})`
              : "Sign in failed. Please try again.";
          setError(msg);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      console.error("Login exception:", err);
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    }

    setLoading(false);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <p
          className="text-center text-xs font-semibold tracking-[0.3em] uppercase mb-3"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
        >
          Build My Groundwork
        </p>
        <h1
          className="text-center text-4xl font-bold uppercase mb-10"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "8px",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #252525",
                borderRadius: "8px",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
              }}
            />
          </div>

          {/* Error / Success messages */}
          {error && (
            <p
              className="text-sm px-4 py-3 border-l-4"
              style={{
                borderColor: "#C45B28",
                backgroundColor: "#1A0E09",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
              }}
            >
              {error}
            </p>
          )}
          {message && (
            <p
              className="text-sm px-4 py-3 border-l-4"
              style={{
                borderColor: "#4CAF50",
                backgroundColor: "#0A130A",
                color: "#E8E2D8",
                fontFamily: "var(--font-inter)",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
              borderRadius: "8px",
              fontFamily: "var(--font-inter)",
              fontWeight: 600,
            }}
          >
            {loading
              ? "Working..."
              : mode === "signin"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Mode toggle */}
        <p
          className="text-center text-sm mt-8"
          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
        >
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setMessage(null);
            }}
            className="font-semibold transition-opacity hover:opacity-80"
            style={{
              color: "#C45B28",
              fontFamily: "var(--font-inter)",
              fontWeight: 600,
            }}
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </main>
  );
}
