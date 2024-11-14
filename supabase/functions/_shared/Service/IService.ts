import { adminClient } from "../adminClient.ts";
import DatabaseError from "../Error/DatabaseError.ts";
import { log } from "../helpers.ts";

// Filter docs: https://supabase.com/docs/reference/javascript/using-filters
type Filter = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is';
type QueryConditions = [Filter, string, any] | ['null' | 'notnull', string] | ([Filter, string, any] | ['null' | 'notnull', string])[];

abstract class IService {

    private readonly TABLE_NAME: string;

    protected constructor(tblName: string) {
        this.TABLE_NAME = tblName;
    }

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
            log(`Error querying database: ${err.message}`);
            throw new DatabaseError(`Error querying database: ${err.message}`);
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
            log(`Error querying database: ${err.message}`);
            throw new DatabaseError(`Error querying database: ${err.message}`);
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
            log(`Error querying database: ${err.message}`);
            throw new DatabaseError(`Error querying database: ${err.message}`);
        }
    }
}

export default IService;
