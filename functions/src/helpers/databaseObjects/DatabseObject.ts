abstract class DatabaseObject {

    protected readonly id: string;

    protected constructor(id: string) {
        this.id = id;
    }

    /**
     * Returns the database document as a JSON object with document data & id
     */
    abstract getObject(): object;
}

export { DatabaseObject };
