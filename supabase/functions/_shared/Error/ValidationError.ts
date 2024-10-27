class ValidationError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export default ValidationError;
