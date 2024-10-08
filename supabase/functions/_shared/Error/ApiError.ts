class ApiError extends Error {
    protected constructor(message: string) {
        super(message);
    }
}

export default ApiError;
