import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getCourseData from "./getCourseData.ts";
import { primaryKeyInt, bool } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { courseId: primaryKeyInt(), adminView: bool() },
        endpointFunction: getCourseData
    };

    return await EdgeFunctionRequest.run(parameters);
});
