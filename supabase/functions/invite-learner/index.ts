import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import inviteLearner from "./inviteLearner.ts";
import { string } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { email: string() },
        endpointFunction: inviteLearner,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
