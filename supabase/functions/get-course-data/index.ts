import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { generateUUID, log, OptionsRsp, SuccessResponse, validatePayload } from "../_shared/helpers.ts";
import getCourseData from "./getCourseData.ts";
import HandleEndpointError from "../_shared/Error/HandleEndpointError.ts";

Deno.serve(async (req: Request) => {
    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        const uuid = generateUUID();
        log(`uuid: ${uuid}`);

        const schema: Record<string, z.ZodTypeAny> = { courseId: z.string() };
        const payload = await validatePayload(schema, req);

        const rsp = await getCourseData(payload);

        return SuccessResponse(rsp);
    } catch (err) {
        await HandleEndpointError(rsp, err);
    }
});
