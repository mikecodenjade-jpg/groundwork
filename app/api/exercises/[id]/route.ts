import { NextRequest, NextResponse } from "next/server";

const BASE = "https://exercises2.p.rapidapi.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEXT_PUBLIC_RAPIDAPI_KEY is not configured." }, { status: 500 });
  }

  const { id } = await params;

  const res = await fetch(`${BASE}/exercises/${encodeURIComponent(id)}`, {
    headers: {
      "x-rapidapi-host": "exercises2.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
