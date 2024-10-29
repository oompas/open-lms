import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import getCourseData from "./getCourseData.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: { courseId: z.string() },
        endpointFunction: getCourseData
    };

    return await EdgeFunctionRequest.run(parameters);
});
