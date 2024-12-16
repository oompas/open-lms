import ApiError from "./ApiError.ts";

class DatabaseError extends ApiError {
    public constructor(message: string) {
        super(message, "DatabaseError", "DATABASE", 500);
    }
}

export default DatabaseError;
