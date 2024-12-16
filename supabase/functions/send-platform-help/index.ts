import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import sendPlatformHelp from "./sendPlatformHelp.ts";
import { string } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { feedback: string() },
        endpointFunction: sendPlatformHelp
    };

    return await EdgeFunctionRequest.run(parameters);
});
