abstract class DatabaseObject {

    private readonly id: string;

    protected constructor(id: string) {
        this.id = id;
    }

    public getId(): string {
        return this.id;
    }

    /**
     * Returns the database document as a JSON object with document data & id
     */
    abstract getObject(): object;
}

export { DatabaseObject };
