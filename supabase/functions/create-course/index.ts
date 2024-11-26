import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import createCourse from "./createCourse.ts";
import { object } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { course: object() },
        endpointFunction: createCourse,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
