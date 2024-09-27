import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { getRequestUser } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const user = await getRequestUser(req);

    const notifications = await getRows({ table: 'notification', conditions: ['eq', 'user_id', user.id] });
    if (notifications instanceof Response) return notifications;

    return successResponse(notifications);
});