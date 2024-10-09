import { adminClient } from "../adminClient.ts";
import DatabaseError from "../Error/DatabaseError.ts";
import { log } from "../helpers.ts";

// Filter docs: https://supabase.com/docs/reference/javascript/using-filters
type Filter = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is';
type QueryConditions = [Filter, string, any] | ['null' | 'notnull', string] | ([Filter, string, any] | ['null' | 'notnull', string])[];

class IService {

    private readonly TABLE_NAME: string;

    protected constructor(tblName: string) {
        log(`Super constructor. tblName: ${tblName} this table: ${this.TABLE_NAME}`);
        this.TABLE_NAME = tblName;
        log(`Super constructor (after). tblName: ${tblName} this table: ${this.TABLE_NAME}`);
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
            log(`Error querying database: ${JSON.stringify(err)}`);
            await DatabaseError.create(err.message);
        }
    }

    /**
     * Gets the document that matches the given id (note: this uses the id column which must be unique)
     */
    public async getById(id: number | string) {
        try {
            log(`getById this table: ${this.TABLE_NAME}`);
            const { data, error } = await adminClient.from(this.TABLE_NAME).select().eq('id', id);
            if (error) {
                throw error;
            }

            if (data.length > 1) {
                throw `More than 1 document in table ${this.TABLE_NAME} found with the id ${id}`;
            }

            return data[0];
        } catch (err) {
            log(`Error querying database: ${JSON.stringify(err)}`);
            await DatabaseError.create(err.message);
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
            log(`query this table: ${this.TABLE_NAME}`);
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
            log(`Error querying database: ${JSON.stringify(err)}`);
            await DatabaseError.create(err.message);
        }
    }
}

export default IService;
