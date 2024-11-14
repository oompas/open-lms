import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import disableUser from "./disableUser.ts";
import { primaryKeyInt, bool } from "../_shared/validation.ts";

Deno.serve(async (req) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { userId: primaryKeyInt(), disable: bool() },
        endpointFunction: disableUser,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
