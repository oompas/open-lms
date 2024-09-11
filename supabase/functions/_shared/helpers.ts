import { adminClient } from "./adminClient.ts";

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

/**
 * Get the user object from the edge function request
 * @param req The incoming request
 * @returns The user object, or null if no user authorization in the request
 */
const getRequestUser = async (req: Request): Promise<object> => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const user = await adminClient.auth.getUser(token);

    return user ? user.data.user : null;
}

/**
 * Get the user ID from the edge function request
 * @param req The incoming request
 * @returns The user ID, or null if no user authorization in the request
 */
const getRequestUserId = async (req: Request): Promise<string> => await getRequestUser(req)?.id;

export { corsHeaders, errorResponse, successResponse, log, getRequestUser, getRequestUserId };
