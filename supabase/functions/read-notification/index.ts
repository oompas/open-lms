import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { getRequestUserId } from "../_shared/auth.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
      return OptionsRsp();
    }

    const { notificationId, readAll } = await req.json();

    const userId = await getRequestUserId(req);
    const query = adminClient.from('notification').update({ read: true }).eq('user_id', userId);
    if (!readAll) {
        query.eq('id', notificationId);
    }
    await query;

    return SuccessResponse(null);
});
