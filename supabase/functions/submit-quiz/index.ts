import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import submitQuiz from "./submitQuiz.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { quizAttemptId: z.string(), responses: z.array() },
        endpointFunction: submitQuiz
    };

    return await EdgeFunctionRequest.run(parameters);
});
