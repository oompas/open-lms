import { corsHeaders } from "../_config/cors.ts";

const errorResponse = (errorMessage: string) => new Response(
    JSON.stringify({ error: errorMessage }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    { status: 400 }
);

const successResponse = (data: any) => new Response(
    JSON.stringify({ data: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    { status: 200 }
);

export { errorResponse, successResponse };