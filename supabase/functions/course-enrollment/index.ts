import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, errorResponse, getRequestUserId, successResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const userId = await getRequestUserId(req);

    const { id } = await req.json();

    const { data, error } = await adminClient.from('enrolled_course').select().eq('user_id', userId).eq('course_id', id);

    if (error) {
        return errorResponse(error.message);
    }

    if (data.length === 0) {
        const { error: error2 } = await adminClient.from('enrolled_course').insert({ user_id: userId, course_id: id });

        if (error2) {
            return errorResponse(error2.message);
        }
    } else {
        const { error: error3 } = await adminClient.from('enrolled_course').delete().eq('user_id', userId).eq('course_id', id);

        if (error3) {
            return errorResponse(error3.message);
        }
    }

    return successResponse({ enrolled: data.length === 0 });
});
