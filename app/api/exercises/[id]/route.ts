import { NextRequest, NextResponse } from "next/server";

const YMOVE_BASE = "https://exercise-api.ymove.app/api/v2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.NEXT_PUBLIC_YMOVE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_YMOVE_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const { id } = await params;

  const res = await fetch(`${YMOVE_BASE}/exercises/${encodeURIComponent(id)}`, {
    headers: { "X-API-Key": apiKey },
    next: { revalidate: 3600 },
  });

  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
