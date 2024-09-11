import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, errorResponse, log, successResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Check if already enrolled
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    log(`Token: ${token}`);
    const rsp = await adminClient.auth.getUser(token);
    const userId = rsp.data.user.id;

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
