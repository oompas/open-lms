import { createClient } from 'npm:@supabase/supabase-js@2.46.1';

export const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
        db: "public"
    }
);
