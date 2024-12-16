import ApiError from "./ApiError.ts";

class InputError extends ApiError {
    public constructor(message: string) {
        super(message, "InputError", "INPUT", 400);
    }
}

export default InputError;
