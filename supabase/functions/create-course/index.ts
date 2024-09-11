import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, errorResponse, successResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { verifyAdministrator } from "../_shared/auth.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const uid = await verifyAdministrator(req);
    if (uid instanceof Response) return uid;

    const { course } = await req.json();

    const courseData = {
        user_id: uid,
        name: course.name,
        description: course.description,
        link: course.link,
        min_time: course.minTime,
    };

    const { data, error } = await adminClient.from('course').insert(courseData);

    if (error) {
        return errorResponse(error.message);
    }

    return successResponse(data);
});
