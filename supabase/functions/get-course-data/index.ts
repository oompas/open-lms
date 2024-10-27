import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import getCourseData from "./getCourseData.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { OptionsRsp, SuccessResponse, HandleEndpointError } from "../_shared/response.ts";

Deno.serve(async (req: Request) => {
    let edgeFunctionRequest;

    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        edgeFunctionRequest = new EdgeFunctionRequest(req, { courseId: z.string() });
        await edgeFunctionRequest.validatePayload();

        const rsp = await getCourseData(edgeFunctionRequest);

        return SuccessResponse(rsp);
    } catch (err) {
        return await HandleEndpointError(req, err);
    }
});
