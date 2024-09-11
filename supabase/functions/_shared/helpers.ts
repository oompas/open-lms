const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const errorResponse = (errorMessage: string) => new Response(
    JSON.stringify(errorMessage),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
);

const successResponse = (data: any) => new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
);

const log = (message: string) => console.log(message);



export { corsHeaders, errorResponse, successResponse, log };
