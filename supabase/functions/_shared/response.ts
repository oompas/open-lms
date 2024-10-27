import ValidationError from "./Error/ValidationError.ts";
import DatabaseError from "./Error/DatabaseError.ts";
import EdgeFunctionRequest from "./EdgeFunctionRequest.ts";

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

enum ERROR_TYPES {
    VALIDATION = "VALIDATION",
    DATABASE = "DATABASE",
    UNCAUGHT = "UNCAUGHT"
}

/**
 * Handles errors caught in an endpoint
 */
const HandleEndpointError = (request: EdgeFunctionRequest, err: any): Promise<Response> => {
    let errorType, statusCode, message;

    // Handle custom error types, then everything else
    if (err instanceof ValidationError) {
        errorType = ERROR_TYPES.VALIDATION;
        statusCode = 400;
        message = 'Bad Request: Validation Error';
    } else if (err instanceof DatabaseError) {
        errorType = ERROR_TYPES.DATABASE;
        statusCode = 500;
        message = 'Service Unavailable: Database Error';
    } else if (err instanceof Error) {
        console.error(err.name, err.message, err.stack);
        await saveErrorToDatabase(err);
    } else {
        errorType = ERROR_TYPES.UNCAUGHT;
        statusCode = 500;

        console.error('Unknown error:', err);
        await saveErrorToDatabase(err);
    }

    const errObject = {
        endpoint: request.getEndpoint(),
        request_uuid: request.getUUID(),
        type: errorType,
        request_user_id: request.getRequestUserId(),
        payload: request.getPayload(),
        message: message,
        stack_trace: err.stack
    };

    // Just return the uuid - don't expose internal data
    return _makeResponse(request.getUUID(), statusCode);
}

export { OptionsRsp, SuccessResponse, HandleEndpointError };
