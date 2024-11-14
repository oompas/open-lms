import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import readNotification from "./readNotification.ts";
import { primaryKeyInt } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { notificationId: primaryKeyInt().nullable() },
        endpointFunction: readNotification
    };

    return await EdgeFunctionRequest.run(parameters);
});
