import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { successResponse } from "../_shared/helpers.ts";

Deno.serve(async (req) => {


    // TODO

    const rspData = {
        quizAttemptsToMark: [],
        courseInsights: [],
        learners: [],
        admins: [],
    };
    return successResponse(rspData);
});
