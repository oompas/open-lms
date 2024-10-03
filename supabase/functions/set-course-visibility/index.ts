import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { InternalError, OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const { courseId, active } = await req.json();

    const { data, error } = await adminClient.from('course').update({ active: active }).eq('id', courseId);
    if (error) {
        return InternalError();
    }

    return SuccessResponse(null);
});
