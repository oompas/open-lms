import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse, errorResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req: Request) => {

    // TODO: Verify user is logged in

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    console.log("Staring func...");

    const { data, error } = await adminClient.from('course').select();

    console.log("Called course select...");

    if (error) {
        console.log("Error! " + error.message);
        return errorResponse(error.message);
    }

    console.log("Returning success...");
    return successResponse(data);
});
