import ValidationError from "./ValidationError.ts";
import DatabaseError from "./DatabaseError.ts";

const HandleEndpointError = (req: Request, err: any): Promise<Response> => {
    let statusCode = 500;
    let message = 'Internal Server Error';

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

async function saveErrorToDatabase(err: any) {
    // Placeholder for actual database error logging
    // You should replace this with your actual database logic
    console.log('Error logged to database:', err.name, err.message, err.stack);
}

export default HandleEndpointError;
