import { adminClient } from "../adminClient.ts";
import DatabaseError from "../Error/DatabaseError.ts";

// Filter docs: https://supabase.com/docs/reference/javascript/using-filters
type Filter = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is';
type QueryConditions = [Filter, string, any] | ['null' | 'notnull', string] | ([Filter, string, any] | ['null' | 'notnull', string])[];

class IService {

    protected abstract readonly TABLE_NAME: string;

    protected constructor() {}

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
            DatabaseError.create(err);
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

            if (data.length > 0) {
                throw `More than 1 document in table ${TABLE_NAME} found with the id ${id}`;
            }

            return data[0];
        } catch (err) {
            DatabaseError.create(err);
        }
    }

    /**
     * Run a query on this table to return desired rows
     */
    public async query(conditions: QueryConditions) {
        try {
            // Wrap single conditions in an array for consistency
            if (conditions.length && !Array.isArray(conditions[0])) {
                conditions = [conditions];
            }

            // Setup query
            const query = adminClient.from(this.TABLE_NAME).select();
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
            return data;
        } catch (err) {
            DatabaseError.create(err);
        }
    }
}

export default IService;
