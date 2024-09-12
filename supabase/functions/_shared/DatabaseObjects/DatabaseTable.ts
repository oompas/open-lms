class DatabaseTable {
    constructor(data = {}) {
        if (new.target === DatabaseTable) {
            throw new Error('DatabaseTable is an abstract class and cannot be instantiated directly');
        }
        this.validateData(data);
        this.initFields(data);
    }

    validateData(data) {
        throw new Error('Subclasses must implement validateData method');
    }

    initFields(data) {
        throw new Error('Subclasses must implement initFields method');
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
