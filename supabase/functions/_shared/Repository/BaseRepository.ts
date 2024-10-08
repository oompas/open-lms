import IDatabaseTable from "../DatabaseObject/IDatabaseTable.ts";
import IRepository, { QueryCondition } from "./IRepository.ts";
import { adminClient } from "../adminClient.ts";
import { ErrorResponse, log } from "../helpers.ts";

abstract class BaseRepository<T extends IDatabaseTable> implements IRepository<T> {

    protected abstract readonly tableName: string;
    protected abstract readonly entityClass: new (data: any) => T;

    private readonly QUERY_LIMIT = 1000; // Default limit from supabase

    public async query(conditions: QueryCondition | QueryCondition[] = []): Promise<T[]> {

        // Wrap single condition in array for consistency
        if (!Array.isArray(conditions)) {
            conditions = [conditions];
        }

        const query = adminClient.from(table).select('*');
        for (const condition of conditions) {
            switch (condition.condition) {
                case 'eq':
                    query.eq(condition.column, condition.value);
                    break;
                case 'null':
                    query.is(condition.column, null);
                    break;
                case 'notnull':
                    query.not(condition.column, 'is', null);
                    break;
                default:
                    throw new Error(`Invalid query condition type: ${condition.condition}`);
            }
        }

        const { data, error } = await query.limit(QUERY_LIMIT);

        if (error) {
            log(`Error querying data (table: ${table} conditions: ${JSON.stringify(conditions)} limit: ${QUERY_LIMIT}): ${error.message}`);
            return ErrorResponse(error.message);
        }

        return data.map((row: any) => new this.entityClass(row));
    }

    // Generic database query function
    protected async query<Result>(query: string, params?: any[]): Promise<Result> {
        // Implement your database query logic here using Supabase or any other database driver
        // For demonstration purposes, let's use a simple Promise mock.
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ rows: [] });
            }, 100);
        });
    }

    async findAll(conditions?: object): Promise<T[]> {
        const { rows } = await this.query<{ rows: any[] }>(`SELECT * FROM ${this.tableName}`, [conditions]);
        return rows.map((row) => new this.entityClass(row));
    }

    async findOne(conditions: object): Promise<T | null> {
        const { rows } = await this.query<{ rows: any[] }>(`SELECT * FROM ${this.tableName} WHERE ?`, [conditions]);
        return rows.length > 0 ? new this.entityClass(rows[0]) : null;
    }

    async update(entity: T): Promise<void> {
        // Implement update logic using this.query
    }

    async insert(entity: T): Promise<void> {
        // Implement insert logic using this.query
    }

    async delete(conditions: object): Promise<void> {
        // Implement delete logic using this.query
    }
}

export default BaseRepository;
