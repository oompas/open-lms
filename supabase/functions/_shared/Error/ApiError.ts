class ApiError {

    public readonly uuid: string;
    public readonly timestamp: string;
    public readonly endpoint: string;
    public readonly type: "DATABASE" | "AUTHENTICATION" | "OTHER";
    public readonly request_uid: string | null;
    public readonly payload: string;

    public readonly message: string;
    public readonly stack_trace: string;

    constructor() {
        // Construct the object, save it to database, then return error status Response
    }

    public build() {
        ;
    }
}

export default ApiError;
