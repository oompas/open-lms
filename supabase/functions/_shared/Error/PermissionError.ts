import ApiError from "./types/ApiError.ts";

class PermissionError extends ApiError {
    public constructor(message: string) {
        super(message, "PermissionError", "PERMISSION", 400);
    }
}

export default PermissionError;
