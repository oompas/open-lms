import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, SuccessResponse} from "../_shared/helpers.ts";
import { getRequestUser } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const user = await getRequestUser(req);

    const completedCoursesQuery = await getRows({ table: 'course_attempt', conditions: [['eq', 'user_id', user.id], ['eq', 'pass', true]] });
    if (completedCoursesQuery instanceof Response) return completedCoursesQuery;

    const completedCourses = await Promise.all(completedCoursesQuery.map(async (courseAttempt) => {
        const course = await getRows({ table: 'course', conditions: ['eq', 'id', courseAttempt.course_id] });
        return {
            courseId: courseAttempt.id,
            name: course[0].name,
            date: courseAttempt.end_time
        };
    }));

    const userData = {
        name: user.user_metadata.name,
        email: user.email,
        role: user.user_metadata.role,
        signUpDate: user.created_at,
        completedCourses: completedCourses
    }

    return SuccessResponse(userData);
});
