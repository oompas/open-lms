import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getUserReports from "./getUserReports.ts";
import { bool } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { withAdmins: bool() },
        endpointFunction: getUserReports,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
