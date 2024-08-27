import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

export const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role -> bypass RLS, full control (anon key can't bypass)
);
