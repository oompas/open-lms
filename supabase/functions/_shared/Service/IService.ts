import { adminClient } from "../adminClient.ts";
import DatabaseError from "../Error/DatabaseError.ts";

// Filter docs: https://supabase.com/docs/reference/javascript/using-filters
type Filter = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';
type NullFilter = 'null' | 'notnull'; // Doesn't exist directly in Supabase, handled through implementation
type Condition = [Filter, string, any] | [NullFilter, string];

type QueryConditions = Condition | Condition[];
type QueryOptions = { order?: string, ascendOrder?: boolean, limit?: number };

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
     * Gets the document that matches the given id (note: this uses the id column which must be unique),
     * throwing an error if no document is found
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
            if (data.length === 0) {
                throw new Error(`No documents queried in table ${this.TABLE_NAME} with id ${id}`);
            }

            return data[0];
        } catch (err) {
            throw new DatabaseError(`Error querying data by id in table ${this.TABLE_NAME}: ${err.message}`);
        }
    }

    /**
     * Gets all rows that have the given column value
     */
    public async getByColumn(column: string, value: any) {
        try {
            const { data, error } = await adminClient.from(this.TABLE_NAME).select().eq(column, value);
            if (error) {
                throw error;
            }

            return data;
        } catch (err) {
            throw new DatabaseError(`Error getting data by column in table ${this.TABLE_NAME}: ${err.message}`);
        }
    }

    /**
     * Run a query on this table to return desired rows
     */
    public async query(select: string = '*', conditions: QueryConditions = [], options: QueryOptions = {}) {
        try {
            // Wrap single conditions in an array for consistency
            const normalizedConditions = Array.isArray(conditions[0]) ? conditions : [conditions];

            // Setup query
            const query = adminClient.from(this.TABLE_NAME).select(select);
            normalizedConditions.forEach(([filter, key, value]) => {
                if (filter === 'null') {
                    query.is(key, null);
                } else if (filter === 'notnull') {
                    query.not(key, 'is', null);
                } else {
                    query[filter](key, value);
                }
            });

            // Apply options (if present)
            if (options.order) {
                query.order(options.order, { ascending: options.ascendOrder ?? false });
            }
            if (typeof options.limit === 'number') {
                if (!Number.isInteger(options.limit) || options.limit < 1) {
                    throw new Error(`options.limit must be undefined or a positive integer, ${options.limit} is invalid`);
                }
                query.limit(options.limit);
            }

            // Run the query, throwing any error it causes
            const { data, error } = await query;
            if (error) {
                throw error;
            }

            // Handle no data returned from the query
            // Note: limit = 1 is a special cases that returns the object (or null) insetad of an array
            if (!data || data.length === 0) {
                return options.limit === 1 ? null : [];
            }

            return options.limit === 1 ? data[0] : data;
        } catch (err) {
            throw new DatabaseError(`Error custom querying data from table ${this.TABLE_NAME}: ${err.message}`);
        }
    }

    /**
     * Adds one new row to this table
     */
    public async insert(rows: object){
        try {
            const { data, error } = await adminClient.from(this.TABLE_NAME).insert(rows);
            if (error) {
                throw error;
            }

            return data;
        } catch (err) {
            throw new DatabaseError(`Error inserting data into table ${this.TABLE_NAME}: ${err.message}`);
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
            throw new DatabaseError(`Error updating data by ID in table ${this.TABLE_NAME}: ${err.message}`);
        }
    }
}

export default IService;
