import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kmnqpargwdxtozknswzk.supabase.co";
const supabaseAnonKey =
  "sb_publishable_i8P9CxBEKkCGsXMWFYNgFw__9piLHu1";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
