import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import { primaryKeyInt } from "../_shared/validation.ts";
import getQuiz from "./getQuiz.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { quizAttemptId: primaryKeyInt() },
        endpointFunction: getQuiz
    };

    return await EdgeFunctionRequest.run(parameters);
});
