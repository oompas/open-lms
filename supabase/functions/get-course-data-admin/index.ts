import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import getCourseDataAdmin from "./getCourseDataAdmin.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { courseId: z.string() },
        endpointFunction: getCourseDataAdmin,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
