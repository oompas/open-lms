import { adminClient } from "./adminClient.ts";

type TableName = "course" | "quiz_question" | "enrolled_course" | "course_attempt" | "quiz_attempt" | "quiz_question_attempt" | "notification";

const getRows = async (table: TableName, conditions: [string, any][] = [], limit: number = 1000) => {
    const query = adminClient.from(table).select();
    conditions.forEach(([key, value]) => query.eq(key, value));
    return await query.limit(limit);
}

export { getRows };
