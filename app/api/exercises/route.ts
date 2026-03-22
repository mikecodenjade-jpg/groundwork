import { NextRequest, NextResponse } from "next/server";

const YMOVE_BASE = "https://exercise-api.ymove.app/api/v2";

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_YMOVE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_YMOVE_API_KEY is not configured." },
      { status: 500 }
    );
  }

  // Forward all query params (search, muscleGroup, equipment, difficulty, page, limit)
  const { searchParams } = req.nextUrl;
  const upstream = new URL(`${YMOVE_BASE}/exercises`);
  searchParams.forEach((v, k) => {
    if (v) upstream.searchParams.set(k, v);
  });

  const res = await fetch(upstream.toString(), {
    headers: { "X-API-Key": apiKey },
    next: { revalidate: 60 },
  });

  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
