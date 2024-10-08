import IDatabaseTable from "../DatabaseObject/IDatabaseTable.ts";

type QueryConditionType = "eq" | "null" | "notnull";
type QueryCondition = { column: string, condition: QueryConditionType, value?: any };

interface IRepository<T extends IDatabaseTable> {
    query: (conditions?: QueryCondition | QueryCondition[]) => Promise<T[]>;

    findAll: (conditions?: object) => Promise<T[]>;
    findOne: (conditions: object) => Promise<T | null>;
    update: (entity: T) => Promise<void>;
    insert: (entity: T) => Promise<void>;
    delete: (conditions: object) => Promise<void>;
}

export default IRepository;
export { QueryCondition, QueryConditionType };
