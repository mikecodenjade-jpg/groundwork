// ExerciseDB OSS API is called directly from the client.
// This route is no longer needed — kept as a placeholder to avoid 404s.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Use the client-side ExerciseDB OSS API directly." }, { status: 410 });
}
