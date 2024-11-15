import { adminClient } from "../adminClient.ts";
import DatabaseError from "../Error/DatabaseError.ts";

// Filter docs: https://supabase.com/docs/reference/javascript/using-filters
type Filter = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is';
type QueryConditions = [Filter, string, any] | ['null' | 'notnull', string] | ([Filter, string, any] | ['null' | 'notnull', string])[];

abstract class IService {

    protected abstract readonly TABLE_NAME: string;

    /**
     * Gets ALL data in this table
     */
    public async getAllRows(): Promise<any> {
        try {
            const { data, error } = await adminClient.from(this.TABLE_NAME).select();
            if (error) {
                throw error;
            }

            return data;
        } catch (err) {
            throw new DatabaseError(`Error getting all rows from ${this.TABLE_NAME}: ${err.message}`);
        }
    }

    /**
     * Gets the document that matches the given id (note: this uses the id column which must be unique)
     */
    public async getById(id: number | string) {
        try {
            const { data, error } = await adminClient.from(this.TABLE_NAME).select().eq('id', id);
            if (error) {
                throw error;
            }

            if (data.length > 1) {
                throw new Error(`More than 1 document in table ${this.TABLE_NAME} found with the id ${id}`);
            }

            return data.length === 1 ? data[0] : null;
        } catch (err) {
            throw new DatabaseError(`Error querying ${this.TABLE_NAME} by ID: ${err.message}`);
        }
    }

    /**
     * Gets all rows that have hte given column value
     */
    public async getByColumn(column: string, value: any) {
        try {
            const { data, error } = await adminClient.from(this.TABLE_NAME).select().eq(column, value);
            if (error) {
                throw error;
            }

            return data;
        } catch (err) {
            throw new DatabaseError(`Error querying ${this.TABLE_NAME} by column: ${err.message}`);
        }
    }

    /**
     * Run a query on this table to return desired rows
     */
    public async query(select: string = '*', conditions: QueryConditions = [], single = false) {
        try {
            // Wrap single conditions in an array for consistency
            if (conditions.length && !Array.isArray(conditions[0])) {
                conditions = [conditions];
            }

            // Setup query
            const query = adminClient.from(this.TABLE_NAME).select(select);
            conditions.forEach(([filter, key, value]) => {
                if (filter === 'null') {
                    query.is(key, null);
                } else if (filter === 'notnull') {
                    query.not(key, 'is', null);
                } else {
                    query[filter](key, value);
                }
            });

            const { data, error } = await query;
            if (error) {
                throw error;
            }
            if (single) {
                if (data.length > 1) {
                    throw new Error("Queried more than 1 result");
                }
                return data[0];
            }

            return data;
        } catch (err) {
            throw new DatabaseError(`Error custom querying ${this.TABLE_NAME}: ${err.message}`);
        }
    }

    /**
     * Adds a new row (or multiple rows) to this table
     */
    public async insert(rows: object){
        try {
            const { data, error } = await adminClient.from(this.TABLE_NAME).insert(rows);
            if (error) {
                throw error;
            }

            return data;
        } catch (err) {
            throw new DatabaseError(`Error adding row to ${this.TABLE_NAME}: ${err.message}`);
        }
    }

    /**
     * Updates the row with the given id with the given update
     */
    public async updateById(id: number | string, update: object) {
        try {
            const { data, error } = await adminClient.from(this.TABLE_NAME).update(update).eq('id', id);
            if (error) {
                throw error;
            }

            return data;
        } catch (err) {
            throw new DatabaseError(`Error updating row in ${this.TABLE_NAME}: ${err.message}`);
        }
    }
}

export default IService;
