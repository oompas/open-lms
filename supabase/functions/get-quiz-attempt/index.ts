import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { verifyAdministrator } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const adminStatus = await verifyAdministrator(req);
    if (adminStatus instanceof Response) return adminStatus;

    const { quizAttemptId } = await req.json();

    const quizAttemptQuery = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'id', quizAttemptId] });
    if (quizAttemptQuery instanceof Response) return quizAttemptQuery;
    const quizAttempt = quizAttemptQuery[0];

    return successResponse(quizAttempt);
});
