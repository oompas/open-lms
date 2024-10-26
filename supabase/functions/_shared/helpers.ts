import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import ValidationError from "./Error/ValidationError.ts";

/**
 * Generates a UUID (v4)
 */
function generateUUID(): string {
    try {
        return crypto.randomUUID();
    } catch (error) {
        console.error(`UUID generation failed: ${error.message}`);
        throw error;
    }
}

/**
 * Validates and returns an API payload for the given schema
 */
const validatePayload = async (schemaObject: Record<string, z.ZodTypeAny>, req: Request) => {
    try {
        const schema: z.ZodSchema = z.object(schemaObject).strict();
        const payload = await req.json();
        schema.parse(payload);

        return payload;
    } catch (error) {
        if (error instanceof ZodError) {
            logErr(`Incoming payload doesn't match schema: ${error.message}`);
            throw new ValidationError("Payload validation failed: " + error.errors.map(err => err.message).join(", "));
        }

        logErr(`Internal error validating payload: ${error.message}`);
        throw error;
    }
}

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

const logErr = (message: string) => console.error(message);

const getCurrentTimestampTz = () => {
    const now = new Date();
    const isoString = now.toISOString();  // E.g. '2024-09-25T20:12:40.923Z'

    // Replace 'T' with space and keep the precision of the timestamp
    return isoString.replace('T', ' ').replace('Z', '+00');
};

export { generateUUID, validatePayload, OptionsRsp, InternalError, ErrorResponse, SuccessResponse, log, logErr, getCurrentTimestampTz };
