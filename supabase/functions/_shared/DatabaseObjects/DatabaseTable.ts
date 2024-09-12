type ExpectedType = {
    name: string;
    type: string;
    nullable: boolean;
};

abstract class DatabaseTable {

    validateData(data: ExpectedType[]) {
        data.forEach((expectedType) => {
            const actualType = typeof this[expectedType.name];
            const isTypeValid = actualType === expectedType.type || (expectedType.nullable && this[expectedType.name] === null);

            if (!isTypeValid) {
                throw new Error(`Field ${expectedType.name} has incorrect type: ${actualType}`);
            }
        });
    }

    toJSON() {
        const obj = {};
        Object.getOwnPropertyNames(this).forEach((key) => {
            obj[key] = this[key];
        });
        return obj;
    }
}

export default DatabaseTable;
export { ExpectedType };
