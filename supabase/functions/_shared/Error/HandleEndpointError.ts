// import { InternalError, logErr } from "../helpers.ts";
// import DatabaseError from "./DatabaseError.ts";

// const HandleEndpointError = async (req: Request, err: any) => {
//     let message;
//     if (err instanceof DatabaseError) {
//         message = err.message || "Internal database error";
//     } else {
//         message = "An unexpected error occurred";
//     }
//
//     logErr(`Error caught: ${message}`);
//     return new InternalError();
// }
//
// // errorHandler.ts

import ValidationError from "./ValidationError.ts";
import DatabaseError from "./DatabaseError.ts";

export async function HandleEndpointError(req: Request, err: any): Promise<Response> {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof ValidationError) {
        statusCode = 400;
        message = 'Bad Request: Validation Error';
    } else if (err instanceof DatabaseError) {
        statusCode = 503;
        message = 'Service Unavailable: Database Error';
    } else if (err instanceof Error) {
        // Log internal details
        console.error(err.name, err.message, err.stack);
        // Save error to database (this is a placeholder, you need to implement actual database logic)
        await saveErrorToDatabase(err);
    } else {
        // Unknown error
        console.error('Unknown error:', err);
        await saveErrorToDatabase(err);
    }

    const response = new Response(message, {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
    });

    return response;
}

async function saveErrorToDatabase(err: any) {
    // Placeholder for actual database error logging
    // You should replace this with your actual database logic
    console.log('Error logged to database:', err.name, err.message, err.stack);
}

export default HandleEndpointError;
