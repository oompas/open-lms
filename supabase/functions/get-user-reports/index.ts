import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getUserReports from "./getUserReports.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: {},
        endpointFunction: getUserReports,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
