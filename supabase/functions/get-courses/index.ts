import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { successResponse, errorResponse } from "../_helpers/response.ts";
import { adminClient } from "../_config/adminClient.ts";

Deno.serve(async (req) => {

    // TODO: Verify user is logged in

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
