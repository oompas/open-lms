import ApiError from "./types/ApiError.ts";

class ValidationError extends ApiError {
    public constructor(message: string) {
        super(message, "ValidationError", "VALIDATION", 400);
    }
}

export default ValidationError;
