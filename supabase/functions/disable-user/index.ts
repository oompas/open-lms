import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, errorResponse, log, successResponse } from "../_shared/helpers.ts";
import { verifyAdministrator } from "../_shared/auth.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const { userId, disable } = await req.json();

    await verifyAdministrator(req);

    const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: disable ? "876600h": "none" // Bans for 100 years
    });

    if (error) {
        log(`Error banning user: ${error.message}`);
        return errorResponse(`Error banning user: ${error.message}`);
    }

    return successResponse(data);
});
