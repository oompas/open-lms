import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import setCourseVisibility from "./setCourseVisibility.ts";
import { primaryKeyInt, bool } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { courseId: primaryKeyInt(), active: bool() },
        endpointFunction: setCourseVisibility,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
