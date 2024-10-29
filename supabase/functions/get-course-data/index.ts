import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import getCourseData from "./getCourseData.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";

Deno.serve(async (req: Request) => {
    return await EdgeFunctionRequest.run(import.meta.url, req, { courseId: z.string() }, getCourseData);
});
