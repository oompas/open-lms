import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import markQuizAttempt from "./markQuizAttempt.ts";
import { primaryKeyInt, array, object, number } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { quizAttemptId: primaryKeyInt(), marks: array(object({ questionAttemptId: primaryKeyInt(), marksAchieved: number() })) },
        endpointFunction: markQuizAttempt,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
