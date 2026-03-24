"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Invisible component — renders nothing.
 * Only purpose: redirect authenticated users to /dashboard after hydration.
 * Keeping this client-only means the landing page itself stays a Server Component
 * and its full HTML is rendered on the server for SEO crawlers.
 */
export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  return null;
}
