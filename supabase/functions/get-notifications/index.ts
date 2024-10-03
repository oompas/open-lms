import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { getRequestUser } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const user = await getRequestUser(req);

    const notifications = await getRows({ table: 'notification', conditions: [['eq', 'user_id', user.id], ['eq', 'deleted', false]] });
    if (notifications instanceof Response) return notifications;

    // Mark all as read
    await Promise.all(notifications.filter((n) => !n.read).map((n) => {
        return adminClient.from('notification').update({ read: true }).eq('id', n.id);
    }));

    return SuccessResponse(notifications);
});
