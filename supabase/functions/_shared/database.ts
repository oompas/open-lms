import { adminClient } from "./adminClient.ts";
import { errorResponse, internalError, log } from "./helpers.ts";

type TableName = "course" | "quiz_question" | "enrolled_course" | "course_attempt" | "quiz_attempt" | "quiz_question_attempt" | "notification";

// Filter docs: https://supabase.com/docs/reference/javascript/using-filters
type Filter = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';

type QueryParams = {
    table: TableName,
    conditions?: [Filter, string, any][],
    expectResults?: ['eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte', number] | ['range', [number, number]],
    limit?: number,
};

/**
 * Queries a database table for rows of data
 *
 * @param table The table name to query
 * @param conditions An array of conditions to filter the rows by
 * @param expectResults Optionally verify the number of results returned is the desired amount
 * @param limit The maximum number of rows to return (default and maximum of 1000)
 * @returns The rows of data from the query as an array of objects
 */
const getRows = async ({ table, conditions = [], expectResults, limit = 1000 }: QueryParams): Promise<{}[]> => {

    if (limit > 1000) {
        log(`Database query limit cannot exceed 1000: '${limit}' is too much`);
        return errorResponse(`Database query limit cannot exceed 1000: '${limit}' is too much`);
    }

    const query = adminClient.from(table).select();
    conditions.forEach(([filter, key, value]) => query[filter](key, value));

    const { data, error } = await query.limit(limit);

    if (error) {
        log(`Error querying data (table: ${table} conditions: ${JSON.stringify(conditions)} limit: ${limit}): ${error.message}`);
        return errorResponse(error.message);
    }

    if (expectResults) {
        const [operator, value] = expectResults;

        const error = () => {
            log(`[getRows] Expected ${operator} ${value} results, but got ${data.length}`);
            return internalError();
        }

        if (operator === 'eq' && data.length !== value) error();
        else if (operator === 'neq' && data.length === value) error();
        else if (operator === 'gt' && data.length <= value) error();
        else if (operator === 'gte' && data.length < value) error();
        else if (operator === 'lt' && data.length >= value) error();
        else if (operator === 'lte' && data.length > value) error();
        else if (operator === 'range' && (data.length < value[0] || data.length > value[1])) error();
    }

    return data;
}

export { getRows };
