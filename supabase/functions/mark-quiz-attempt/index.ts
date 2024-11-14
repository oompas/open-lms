import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import markQuizAttempt from "./markQuizAttempt.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { quizAttemptId: z.number(), marks: z.array(z.object({ questionAttemptId: z.number(), marksAchieved: z.number() })) },
        endpointFunction: markQuizAttempt,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
