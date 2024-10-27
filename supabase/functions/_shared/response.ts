import ValidationError from "./Error/ValidationError.ts";
import DatabaseError from "./Error/DatabaseError.ts";

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
const HandleEndpointError = (req: Request, err: any): Promise<Response> => {
    let statusCode, message;

    if (err instanceof ValidationError) {
        statusCode = 400;
        message = 'Bad Request: Validation Error';
    } else if (err instanceof DatabaseError) {
        statusCode = 503;
        message = 'Service Unavailable: Database Error';
    } else if (err instanceof Error) {
        console.error(err.name, err.message, err.stack);
        await saveErrorToDatabase(err);
    } else {
        console.error('Unknown error:', err);
        await saveErrorToDatabase(err);
    }

    return new Response(message, {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
    });
}

export { OptionsRsp, SuccessResponse, HandleEndpointError };
