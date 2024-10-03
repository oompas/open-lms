/**
 * Helper for response construction
 */
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
 * Constructs an error response for when the API has an error that shouldn't occur, such as a bug or database error
 */
const InternalError = () => _makeResponse("Internal error - please try again later or contact support", 500);

/**
 * Constructs a response for an error that occurred due to the user or data - i.e. the app is working fine,
 * but the user's request can't be fulfilled
 */
const ErrorResponse = (errorMessage: string) => _makeResponse(errorMessage, 400);

/**
 * Constructions a response for a successful function invocation
 */
const SuccessResponse = (data: any) => _makeResponse(data, 200);

const log = (message: string) => console.log(message);

const getCurrentTimestampTz = () => {
    const now = new Date();
    const isoString = now.toISOString();  // E.g. '2024-09-25T20:12:40.923Z'

    // Replace 'T' with space and keep the precision of the timestamp
    return isoString.replace('T', ' ').replace('Z', '+00');
};

export { corsHeaders, OptionsRsp, InternalError, ErrorResponse, SuccessResponse, log, getCurrentTimestampTz };
