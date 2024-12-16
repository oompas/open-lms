import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import startQuiz from "./startQuiz.ts";
import { primaryKeyInt } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { courseId: primaryKeyInt(), courseAttemptId: primaryKeyInt() },
        endpointFunction: startQuiz
    };

    return await EdgeFunctionRequest.run(parameters);
});
