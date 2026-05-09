import { createClient } from "@supabase/supabase-js";

// Read from public Next.js env vars. Fall back to the previously-hardcoded
// production values so existing deployments keep working without a config
// change. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
// the deploy environment to override (e.g. for staging or to rotate keys
// without a redeploy).
const FALLBACK_URL = "https://kmnqpargwdxtozknswzk.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbnFwYXJnd2R4dG96a25zd3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDY4MTMsImV4cCI6MjA4OTI4MjgxM30.DuWN9DGRxhxYLqqO633hs0oS0z2XlXT3vFgzdVmlraE";

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_URL;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
