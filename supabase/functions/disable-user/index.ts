import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import disableUser from "./disableUser.ts";
import { bool, uuid } from "../_shared/validation.ts";

Deno.serve(async (req) => {
    const parameters: RunParams = {
        endpointName: import.meta.url,
        req: req,
        schemaRecord: { userId: uuid(), disable: bool() },
        endpointFunction: disableUser,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
