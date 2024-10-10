import ApiError from "./ApiError.ts";
import { adminClient } from "../adminClient.ts";
import { log } from "../helpers.ts";

class DatabaseError extends ApiError {

    private constructor(message: string) {
        super(message);
    }

    public static async create(message: string) {
        const err = {
            endpoint: null,
            type: 'DATABASE',
            request_uid: null,
            payload: null,
            message: message ?? '',
            stack_trace: null
        };

        const { error } = await adminClient.from('error_log').insert(err);
        if (error) {
            log(`Error logging error: ${JSON.stringify(error, null, 4)}`);
        }

        throw new DatabaseError(message);
    }
}

export default DatabaseError;
