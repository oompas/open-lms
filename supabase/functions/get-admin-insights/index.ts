import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { getAllUsers, getUserById, verifyAdministrator } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const adminVerify = verifyAdministrator(req);
    if (adminVerify instanceof Response) return adminVerify;

    const quizzesToMark = await getRows({ table: 'quiz_attempt', conditions: [['null', 'pass'], ['notnull', 'end_time']] });
    if (quizzesToMark instanceof Response) return quizzesToMark;

    const courses = await getRows({ table: 'course' });
    if (courses instanceof Response) return courses;

    const users = await getAllUsers();
    if (users instanceof Response) return users;

    const quizAttemptsToMark = quizzesToMark.map((quizAttempt: any) => {

        const course = courses.find((c) => c.id === quizAttempt.course_id);

        const user = users.find((u) => u.id === quizAttempt.user_id);

        return {
            id: quizAttempt.id,
            courseName: course.name,
            timestamp: new Date(quizAttempt.end_time),
            userName: user.user_metadata.name
        }
    });

    const enrollments = await getRows({ table: 'enrolled_course' });
    if (enrollments instanceof Response) return enrollments;

    const courseInsights = courses.map((course: any) => {
        return {
            id: course.id,
            name: course.name,

            numEnrolled: enrollments.filter((e) => e.course_id === course.id).length,
            numComplete: 0,
            avgTime: 0,
            avgQuizScore: 0
        }
    });

    const learners = users.filter((user) => user.user_metadata.role === "Learner")
        .map((user: any) => {
        return {
            id: user.id,
            email: user.email,
            name: user.user_metadata.name,
            role: user.user_metadata.role,

            coursesEnrolled: 0,
            coursesAttempted: 0,
            coursesCompleted: 0
        };
    });

    const admins = users.filter((user) => user.user_metadata.role === "Admin" || user.user_metadata.role === "Developer")
        .map((user: any) => {
            return {
                id: user.id,
                email: user.email,
                name: user.user_metadata.name,
                role: user.user_metadata.role,

                coursesCreated: courses.filter(c => c.user_id === user.id).length,
                coursesPublished: courses.filter(c => c.user_id === user.id && c.active).length
            };
        });

    const rspData = {
        quizAttemptsToMark,
        courseInsights,
        learners,
        admins
    };
    return successResponse(rspData);
});
