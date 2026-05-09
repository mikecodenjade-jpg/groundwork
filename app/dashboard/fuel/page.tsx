import { redirect } from "next/navigation";

// /dashboard/fuel is deprecated. The newer /dashboard/nutrition implementation
// uses the FTS search vector and correctly populates user_id and meal_name on
// inserts. Old code path was missing both required NOT NULL columns, so meal
// logging from this route silently failed. Redirect users to the working one.
//
// /dashboard/fuel/cooler-prep still works and is kept untouched.
export default function FuelRedirect(): never {
  redirect("/dashboard/nutrition");
}
