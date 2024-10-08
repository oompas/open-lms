import ApiError from "./ApiError.ts";
import { adminClient } from "../adminClient.ts";

class DatabaseError extends ApiError {

    private constructor(message: string) {
        super(message);
    }

    public static create(message: string) {
        const err = {
            uuid: crypto.randomUUID(),
            endpoint: '',
            type: 'DATABASE',
            request_uid: '',
            payload: '',
            message: message,
            stack_trace: ''
        };

        adminClient.from('error_log').insert(err);

        throw new DatabaseError(message);
    }
}

export default DatabaseError;
