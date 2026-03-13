import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  getSupabasePublicEnv,
  getSupabaseServiceEnv
} from "@/lib/supabase/config";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          const writableCookieStore = cookieStore as typeof cookieStore & {
            set?: (
              name: string,
              value: string,
              options?: Record<string, unknown>
            ) => void;
          };

          cookiesToSet.forEach(({ name, value, options }) => {
            writableCookieStore.set?.(name, value, options);
          });
        } catch {
          // Cookie writes can fail in Server Components. Route handlers remain writable.
        }
      }
    }
  });
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServiceEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
