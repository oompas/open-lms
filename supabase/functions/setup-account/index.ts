import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import setupAccount from "./setupAccount.ts";
import { uuid } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { userId: uuid(), name: z.string() },
        endpointFunction: setupAccount,
        disableAuthCheck: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
