import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { getRequestUserId } from "../_shared/auth.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const { notificationId, deleteAll } = await req.json();

    const userId = await getRequestUserId(req);
    if (deleteAll) {
        await adminClient.from('notification').update({ deleted: true }).eq('user_id', userId);
    } else {
        await adminClient.from('notification').delete().eq('id', notificationId).eq('user_id', userId);
    }

    return SuccessResponse(null);
});
