import ApiError from "./ApiError.ts";

class ValidationError extends ApiError {
    public constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export default ValidationError;
