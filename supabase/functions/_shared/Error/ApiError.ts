abstract class ApiError extends Error {
    protected constructor(message: string, name: string, type: string, statusCode: number) {
        super(message);

        this.name = name;
        this.type = type;
        this.statusCode = statusCode;
    }
}

export default ApiError;
