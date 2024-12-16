import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import setupAccount from "./setupAccount.ts";
import { string, uuid } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { userId: uuid(), name: string() },
        endpointFunction: setupAccount,
        disableAuthCheck: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
