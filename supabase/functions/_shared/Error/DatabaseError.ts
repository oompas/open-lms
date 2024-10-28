class DatabaseError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "DatabaseError";
    }
}

export default DatabaseError;
