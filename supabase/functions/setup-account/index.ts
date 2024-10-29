import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { OptionsRsp, SuccessResponse, HandleEndpointError } from "../_shared/response.ts";
import setupAccount from "./setupAccount.ts";

Deno.serve(async (req: Request) => {

    const request = new EdgeFunctionRequest(import.meta.url, req, { userId: z.string(), name: z.string() });

    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        await request.validateRequest();

        const rsp = await setupAccount(request);

        return SuccessResponse(rsp);
    } catch (err) {
        return await HandleEndpointError(request, err);
    }
});
