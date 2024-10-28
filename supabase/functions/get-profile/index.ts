import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { OptionsRsp, SuccessResponse, HandleEndpointError } from "../_shared/response.ts";
import getProfile from "./getProfile.ts";

Deno.serve(async (req) => {

    const request = new EdgeFunctionRequest("get-profile", req, {});

    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        await request.validateRequest();

        const rsp = await getProfile(request);

        return SuccessResponse(rsp);
    } catch (err) {
        return await HandleEndpointError(request, err);
    }
});
