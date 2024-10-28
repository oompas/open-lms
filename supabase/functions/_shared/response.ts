import EdgeFunctionRequest from "./EdgeFunctionRequest.ts";
import { adminClient } from "./adminClient.ts";
import ApiError from "./Error/ApiError.ts";

// Helper for response construction
const _makeResponse = (data: any, status?: number) => {
    const headers = {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            "Content-Type": "application/json",
        },
        ...(status !== undefined && { status })
    };

    return new Response(JSON.stringify(data), headers);
}

/**
 * All endpoints must check if (req.method === 'OPTIONS') then return this response at the start of their execution
 */
const OptionsRsp = () => _makeResponse('ok');

/**
 * Constructions a response for a successful function invocation
 */
const SuccessResponse = (data: any) => _makeResponse(data, 200);

/**
 * Handles errors caught in an endpoint
 */
const HandleEndpointError = async (request: EdgeFunctionRequest, err: any): Promise<Response> => {
    let errorType, statusCode, message;

    // Handle custom error types, then everything else
    if (err instanceof ApiError) {
        errorType = err.type;
        statusCode = err.statusCode;
        message = err.message;
    } else {
        errorType = "UNCAUGHT";
        statusCode = 500;
        message = `Uncaught internal error: ${err.message}`;
    }

    // Log error to database + server console
    const errObject = {
        endpoint: request.getEndpoint(),
        request_uuid: request.getUUID(),
        type: errorType,
        request_user_id: request.getRequestUserId(),
        payload: request.getPayload(),
        message: message,
        stack_trace: err.stack
    };

    const { error } = await adminClient.from('error_log').insert(errObject);
    if (error) {
        request.logErr(`Error logging error: ${JSON.stringify(error)}`, `HandleEndpointError`);
    }

    request.logErr(`Error caught: ${JSON.stringify(errObject)}`, `HandleEndpointError`);

    // Just return the uuid - don't expose internal data
    return _makeResponse(request.getUUID(), statusCode);
}

export { OptionsRsp, SuccessResponse, HandleEndpointError };
