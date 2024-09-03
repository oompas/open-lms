import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, successResponse, errorResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const { id } = await req.json();

    const { data, error } = await adminClient.from('course').select().eq('id', id);

    if (error) {
        return errorResponse(error.message);
    }

    if (data.length === 0) {
        return new Response("Course not found", { status: 404 });
    }

    return successResponse(data[0]);
});
