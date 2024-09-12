type ExpectedType = {
    name: string;
    type: string;
    nullable: boolean;
};

abstract class DatabaseTable {

    protected expectedTypes: ExpectedTypes[] = null;

    protected constructor() {}

    protected validateData(data: object) {

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

    // TODO: add stringify option
    public toJSON() {
        const obj = {};
        Object.getOwnPropertyNames(this).forEach((key) => {
            obj[key] = this[key];
        });
        return obj;
    }
}

export default DatabaseTable;
export { ExpectedType };
