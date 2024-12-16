import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import sendCourseHelp from "./sendCourseHelp.ts";
import { primaryKeyInt, string } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { courseId: primaryKeyInt(), feedback: string() },
        endpointFunction: sendCourseHelp
    };

    return await EdgeFunctionRequest.run(parameters);
});
