import DatabaseTable from "../DatabaseObjects/DatabaseTable.ts";
import IRepository from "./IRepository.ts";

abstract class BaseRepository<T extends DatabaseTable> implements IRepository<T> {
    protected abstract tableName: string;

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
