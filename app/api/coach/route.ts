import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Limits ──────────────────────────────────────────────────────────────────
const MAX_MESSAGES = 40;
const MAX_MESSAGE_LEN = 4000;
const MAX_SYSTEM_LEN = 8000;
const MAX_TOKENS = 1000;
const RATE_LIMIT_PER_MIN = 20;

// ── In-memory rate limiter ──────────────────────────────────────────────────
// Simple per-instance fixed-window counter. Not perfect across multiple
// serverless instances, but good enough to stop trivial abuse without adding
// Redis/Upstash. Resets each minute.
type Bucket = { count: number; windowStart: number };
const rateBuckets = new Map<string, Bucket>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    rateBuckets.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_PER_MIN) return false;
  bucket.count += 1;
  return true;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // same-origin browser fetches often omit Origin
  try {
    const u = new URL(origin);
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith("buildmygroundwork.com")) return true;
    if (host.endsWith(".netlify.app")) return true;
    if (host.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function validateMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length === 0 || input.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    if (content.length === 0 || content.length > MAX_MESSAGE_LEN) return null;
    out.push({ role, content });
  }
  return out;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Coach is unavailable right now." },
      { status: 503 }
    );
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Coach is unavailable right now." },
      { status: 503 }
    );
  }

  // ── Origin check ──────────────────────────────────────────────────────────
  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // ── Auth: require a Supabase bearer token ─────────────────────────────────
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = userData.user.id;

  // ── Rate limit per user ───────────────────────────────────────────────────
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: "Too many requests. Slow down and try again in a minute." },
      { status: 429 }
    );
  }

  // ── Input validation ──────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const rawMessages = (body as { messages?: unknown })?.messages;
  const rawSystem = (body as { system?: unknown })?.system;

  const messages = validateMessages(rawMessages);
  if (!messages) {
    return NextResponse.json(
      { error: "Invalid messages payload." },
      { status: 400 }
    );
  }

  let system: string | undefined;
  if (rawSystem !== undefined) {
    if (typeof rawSystem !== "string") {
      return NextResponse.json(
        { error: "Invalid system prompt." },
        { status: 400 }
      );
    }
    if (rawSystem.length > MAX_SYSTEM_LEN) {
      return NextResponse.json(
        { error: "System prompt too long." },
        { status: 400 }
      );
    }
    system = rawSystem;
  }

  // ── Forward to Anthropic ──────────────────────────────────────────────────
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: MAX_TOKENS,
        system,
        messages,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Coach is unavailable right now." },
      { status: 502 }
    );
  }

  if (!res.ok) {
    // Don't leak Anthropic error bodies to the client.
    const status = res.status >= 500 ? 502 : 502;
    return NextResponse.json(
      { error: "Coach is unavailable right now." },
      { status }
    );
  }

  const data = await res.json();
  const content: string = data?.content?.[0]?.text ?? "";
  return NextResponse.json({ content });
}
