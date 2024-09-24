import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { getUserById } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const { userId } = await req.json();

    const user = await getUserById(req, userId);
    if (user instanceof Response) return user;

    const enrollments = await getRows({ table: 'enrolled_course', conditions: ['eq', 'user_id', user.id] });
    if (enrollments instanceof Response) return enrollments;

    const completedCourses = await getRows({ table: 'course_attempt', conditions: [['eq', 'user_id', user.id], ['eq', 'pass', true]] });
    if (completedCourses instanceof Response) return completedCourses;

    const quizAttempts = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'user_id', user.id] });
    if (quizAttempts instanceof Response) return quizAttempts;

    const userData = {
        name: user.user_metadata.name,
        email: user.email,
        role: user.user_metadata.role,
        disabled: false,
        signUpDate: user.created_at,
        lastSignIn: user.last_sign_in_at ?? -1,
        enrolledCourses: enrollments,
        completedCourses: completedCourses,
        quizAttempts: quizAttempts,
    };

    return successResponse(userData);
});
