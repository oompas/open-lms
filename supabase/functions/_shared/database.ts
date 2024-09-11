import { adminClient } from "./adminClient.ts";

type TableName = "course" | "quiz_question" | "enrolled_course" | "course_attempt" | "quiz_attempt" | "quiz_question_attempt" | "notification";

// Filter docs: https://supabase.com/docs/reference/javascript/using-filters
type Filter = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';

const getRows = async (table: TableName, conditions: [Filter, string, any][] = [], limit: number = 1000) => {
    const query = adminClient.from(table).select();
    conditions.forEach(([filter, key, value]) => query[filter](key, value));

    const { data, error } = await query.limit(limit);

    if (error) {
        console.error(error);
    }

    return data;
}

export { getRows };
