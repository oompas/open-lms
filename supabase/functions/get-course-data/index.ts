import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import getCourseData from "./getCourseData.ts";
import HandleEndpointError from "../_shared/Error/HandleEndpointError.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";

Deno.serve(async (req: Request) => {
    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        const edgeFunctionRequest = await EdgeFunctionRequest.create(req, { courseId: z.string() });

        const rsp = await getCourseData(edgeFunctionRequest);

        return SuccessResponse(rsp);
    } catch (err) {
        return await HandleEndpointError(req, err);
    }
});
