import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kmnqpargwdxtozknswzk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbnFwYXJnd2R4dG96a25zd3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDY4MTMsImV4cCI6MjA4OTI4MjgxM30.DuWN9DGRxhxYLqqO633hs0oS0z2XlXT3vFgzdVmlraE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
