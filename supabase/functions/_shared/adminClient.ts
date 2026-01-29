import { createClient } from 'npm:@supabase/supabase-js@2.46.1';

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl) {
    console.error("[adminClient] Error: SUPABASE_URL environment variable is not set.");
    throw new Error("[adminClient] SUPABASE_URL environment variable is missing.");
}

if (!supabaseKey) {
    console.error("[adminClient] Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.");
    throw new Error("[adminClient] SUPABASE_SERVICE_ROLE_KEY environment variable is missing.");
}

export const adminClient = createClient(
    supabaseUrl ?? "",
    supabaseKey ?? "",
    {
        db: "public"
    }
);
