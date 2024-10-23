import ApiError from "./ApiError.ts";

class ValidationError extends ApiError {
    private constructor(message: string) {
        super(message);
    }
}

export default ValidationError;
