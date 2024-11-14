import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getAdminInsights from "./getAdminInsights.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: {},
        endpointFunction: getAdminInsights
    };

    return await EdgeFunctionRequest.run(parameters);
});
