import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getProfile from "./getProfile.ts";
import { uuid } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { userId: uuid().optional() },
        endpointFunction: getProfile
    };

    return await EdgeFunctionRequest.run(parameters);
});
