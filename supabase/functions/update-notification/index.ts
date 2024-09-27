import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { getRequestUser } from "../_shared/auth.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const user = await getRequestUser(req);

    const { notificationId, toDelete } = await req.json();

    const applyUpdate = async (id) => {
        // Either delete or read the notification (deleted are gone, read are still there but marked as read)
        if (toDelete) {
            await adminClient.from('notification').delete().eq('id', id);
        } else {
            await adminClient.from('notification').update({ read: true }).eq('id', id);
        }
    }

    // Can apply this to an array of notifications or just one notification
    if (Array.isArray(notificationId)) {
        await Promise.all(notificationId.map((id) => applyUpdate(id)));
    } else {
        await applyUpdate(notificationId);
    }

    return successResponse(null);
});
