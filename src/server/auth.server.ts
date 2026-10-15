import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Verifies the bearer token and returns a user-scoped client (RLS applies). */
export async function getUserClient(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const url = process.env['SUPABASE_URL']!;
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { supabase, userId: data.user.id };
}

export function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GATEWAY = {
  baseURL: "https://ai.gateway.lovable.dev/v1",
  model: "openai/gpt-6-astra",
};

export const SYSTEM_BASE = `You are the workplace productivity assistant for Malibongwe Poultries, a poultry farming business in South Africa.
Be practical, clear and professional. Use simple language. Use South African context (Rands, local seasons) when relevant.
Never fabricate business facts, supplier names, prices, deadlines, people, statistics or sources. If information is missing, use clear placeholders like [Supplier name] and tell the user what to confirm.
Remind the user to review important content before using it. Do not make consequential business decisions for the user — offer options.`;
