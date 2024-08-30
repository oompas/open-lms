import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { successResponse } from "../_shared/response.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await adminClient.auth.getUser(token);

    return successResponse(data.user);
});
