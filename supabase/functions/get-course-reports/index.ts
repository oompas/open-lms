import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getCourseReports from "./getCourseReports.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: {},
        endpointFunction: getCourseReports,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
