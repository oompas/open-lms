import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { ErrorResponse, OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import getCourseData from "./getCourseData.ts";

Deno.serve(async (req: Request) => {
    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        const rsp = await getCourseData(req);

        return SuccessResponse(rsp);
    } catch (e) {
        return ErrorResponse(e);
    }
});
