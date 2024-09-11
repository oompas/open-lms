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

export { corsHeaders, internalError, errorResponse, successResponse, log };
