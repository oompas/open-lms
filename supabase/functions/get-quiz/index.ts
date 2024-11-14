import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getCourseData from "../get-course-data/getCourseData.ts";
import { primaryKeyInt } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { courseId: primaryKeyInt() },
        endpointFunction: getCourseData
    };

    return await EdgeFunctionRequest.run(parameters);
});
