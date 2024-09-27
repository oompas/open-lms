import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const { notificationIds } = await req.json();

    // Can apply this to an array of notifications or just one notification
    if (Array.isArray(notificationId)) {
        await Promise.all(notificationIds.map((id) => adminClient.from('notification').delete().eq('id', id)));
    } else {
        await adminClient.from('notification').delete().eq('id', notificationIds);
    }

    return successResponse(null);
});
