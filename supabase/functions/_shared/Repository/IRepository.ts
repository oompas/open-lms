import DatabaseTable from "../DatabaseObjects/DatabaseTable.ts";

interface IRepository<T extends DatabaseTable> {
    findAll: (conditions?: object) => Promise<T[]>;
    findOne: (conditions: object) => Promise<T | null>;
    update: (entity: T) => Promise<void>;
    insert: (entity: T) => Promise<void>;
    delete: (conditions: object) => Promise<void>;
}

export default IRepository;
