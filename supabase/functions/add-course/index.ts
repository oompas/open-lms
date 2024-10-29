import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { OptionsRsp, SuccessResponse, HandleEndpointError } from "../_shared/response.ts";
import addCourse from "./addCourse.ts";

Deno.serve(async (req: Request) => {

    const request = new EdgeFunctionRequest(import.meta.url, req, {});

    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        await request.validateRequest();

        const rsp = await addCourse(request);

        return SuccessResponse(rsp);
    } catch (err) {
        return await HandleEndpointError(request, err);
    }
});
