import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import createCourse from "./createCourse.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { course: z.object() },
        endpointFunction: createCourse,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
