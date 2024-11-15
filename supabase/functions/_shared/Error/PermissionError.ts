import ApiError from "./ApiError.ts";

class PermissionError extends ApiError {
    public constructor(message: string) {
        super(message, "PermissionError", "PERMISSION", 500);
    }
}

export default PermissionError;
