import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getQuizAttempt from "./getQuizAttempt.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { quizAttemptId: z.string() },
        endpointFunction: getQuizAttempt,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
