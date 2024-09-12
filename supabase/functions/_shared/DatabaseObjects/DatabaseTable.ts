type ExpectedType = {
    name: string;
    type: string;
    nullable: boolean;
};

abstract class DatabaseTable {

    protected abstract expectedTypes: ExpectedTypes[];
    private nonSerializedFields: string[] = ['nonSerializedFields', 'expectedTypes'];

    protected constructor() {}

    protected validateData(data: object) {

        if (!this.expectedTypes || this.expectedTypes.length === 0) {
            throw new Error(`Field 'expectedTypes' must be explicitly defined in all DatabaseTable subclasses. Value '${JSON.stringify(this.expectedTypes)}' is invalid`);
        }

        const expectedFields = this.expectedTypes.map((field) => field.name);
        const actualFields = Object.getOwnPropertyNames(data);

        const extraFields = actualFields.filter((field) => !expectedFields.includes(field));
        if (extraFields.length > 0) {
            throw new Error(`Unexpected fields in database object input: ${extraFields.join(', ')} (object: ${JSON.stringify(data)})`);
        }

        this.expectedTypes.forEach((expectedType) => {
            const actualType = typeof data[expectedType.name];
            const isTypeValid = actualType === expectedType.type || (expectedType.nullable && data[expectedType.name] === null);

            if (!isTypeValid) {
                throw new Error(`Field ${expectedType.name} has incorrect type: ${actualType}`);
            }
        });
    }

    /**
     * Convert the object to a JSON object
     * @param stringify Stringifies the returned object (with 4-indent) if true
     */
    public toJSON(stringify: boolean = false): object | string {
        const obj = {};
        Object.getOwnPropertyNames(this).forEach((key) => {
            if (!this.nonSerializedFields.includes(key)) {
                obj[key] = this[key];
            }
        });
        return stringify ? JSON.stringify(obj, null, 4) : obj;
    }
}

export default DatabaseTable;
export { ExpectedType };
