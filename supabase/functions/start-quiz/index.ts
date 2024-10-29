import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { OptionsRsp, SuccessResponse, HandleEndpointError } from "../_shared/response.ts";
import startQuiz from "./startQuiz.ts";

Deno.serve(async (req: Request) => {

    const request = new EdgeFunctionRequest(import.meta.url, req, { courseId: z.string(), courseAttemptId: z.string() });

    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        await request.validateRequest();

        const rsp = await startQuiz(request);

        return SuccessResponse(rsp);
    } catch (err) {
        return await HandleEndpointError(request, err);
    }
});
