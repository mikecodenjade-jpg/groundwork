import { NextRequest, NextResponse } from "next/server";

const BASE = "https://exercises2.p.rapidapi.com";

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEXT_PUBLIC_RAPIDAPI_KEY is not configured." }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const search    = searchParams.get("search") ?? "";
  const bodyPart  = searchParams.get("bodyPart") ?? "";
  const equipment = searchParams.get("equipment") ?? "";
  const page      = parseInt(searchParams.get("page") ?? "1", 10);
  const limit     = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset    = (page - 1) * limit;

  // ExerciseDB uses separate endpoint paths for each filter type.
  // Priority: search > bodyPart > equipment > all.
  let path: string;
  if (search) {
    path = `/exercises/name/${encodeURIComponent(search.toLowerCase())}`;
  } else if (bodyPart) {
    path = `/exercises/bodyPart/${encodeURIComponent(bodyPart)}`;
  } else if (equipment) {
    path = `/exercises/equipment/${encodeURIComponent(equipment)}`;
  } else {
    path = "/exercises";
  }

  const upstream = new URL(`${BASE}${path}`);
  upstream.searchParams.set("limit", String(limit));
  upstream.searchParams.set("offset", String(offset));

  const res = await fetch(upstream.toString(), {
    headers: {
      "x-rapidapi-host": "exercises2.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: res.status });
  }

  const data = await res.json();

  // ExerciseDB returns a plain array. Wrap it so the client can detect hasMore.
  const arr: unknown[] = Array.isArray(data) ? data : [];

  return NextResponse.json({
    exercises: arr,
    hasMore: arr.length === limit,
    total: null,
  });
}
