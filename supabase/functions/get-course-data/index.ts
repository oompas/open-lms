import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import getCourseData from "./getCourseData.ts";
import HandleEndpointError from "../_shared/Error/HandleEndpointError.ts";

Deno.serve(async (req: Request) => {
    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        const rsp = await getCourseData(req);

        return SuccessResponse(rsp);
    } catch (err) {
        await HandleEndpointError(rsp, err);
    }
});
