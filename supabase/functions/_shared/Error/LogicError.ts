import ApiError from "./ApiError.ts";

class LogicError extends ApiError {
    public constructor(message: string) {
        super(message, "LogicError", "LOGIC", 500);
    }
}

export default LogicError;
