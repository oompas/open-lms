import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getUserProfile from "./getUserProfile.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { userId: z.string() },
        endpointFunction: getUserProfile,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
