import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, internalError, successResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const { courseId, active } = await req.json();

    const { data, error } = await adminClient.from('course').update({ active: active }).eq('id', courseId);
    if (error) {
        return internalError();
    }

    return successResponse(null);
});
