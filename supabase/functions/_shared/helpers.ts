const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const internalError = () => new Response(
    JSON.stringify("Internal error - please try again later or contact support"),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
);

const errorResponse = (errorMessage: string) => new Response(
    JSON.stringify(errorMessage),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
);

const successResponse = (data: any) => new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
);

const log = (message: string) => console.log(message);

const getCurrentTimestampTz = () => {
    const now = new Date();
    const isoString = now.toISOString();  // E.g. '2024-09-25T20:12:40.923Z'

    // Replace 'T' with space and keep the precision of the timestamp
    return isoString.replace('T', ' ').replace('Z', '+00');
};

export { corsHeaders, internalError, errorResponse, successResponse, log, getCurrentTimestampTz };
