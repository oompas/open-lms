import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { getUserById } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const { userId } = await req.json();

    const user = await getUserById(req, userId);
    if (user instanceof Response) return user;

    const enrollments = await getRows({ table: 'enrolled_course', conditions: ['eq', 'user_id', user.id] });
    if (enrollments instanceof Response) return enrollments;

    const completedCourses = await getRows({ table: 'course_attempt', conditions: [['eq', 'user_id', user.id], ['eq', 'pass', true]] });
    if (completedCourses instanceof Response) return completedCourses;

    const quizAttempts = await getRows({ table: 'quiz_attempt', conditions: [['eq', 'user_id', user.id], ['notnull', 'end_time']] });
    if (quizAttempts instanceof Response) return quizAttempts;

    const enrolledData = await Promise.all(enrollments.map(async (enrolled) => {
        const courses = await getRows({ table: 'course', conditions: ['eq', 'id', enrolled.course_id] });
        return {
            courseId: enrolled.course_id,
            name: courses[0].name
        };
    }));

    const completedCourseData = await Promise.all(completedCourses.map(async (courseAttempt) => {
        const courses = await getRows({ table: 'course', conditions: ['eq', 'id', courseAttempt.course_id] });
        return {
            name: courses[0].name,
            completionTime: courseAttempt.end_time
        };
    }));

    const quizAttemptData = (await Promise.all(quizAttempts.map(async (quizAttempt) => {
        const courses = await getRows({ table: 'course', conditions: ['eq', 'id', quizAttempt.course_id] });
        return {
            id: quizAttempt.id,
            endTime: quizAttempt.end_time,
            courseId: quizAttempt.course_id,
            courseName: courses[0].name,
            score: quizAttempt.score,
            maxScore: courses[0].total_quiz_marks
        };
    }))).sort((a, b) =>  new Date(b.end_time) - new Date(a.end_time));

    const userData = {
        userId: user.id,
        name: user.user_metadata.name,
        email: user.email,
        role: user.user_metadata.role,
        disabled: !!user.banned_until,
        signUpDate: user.created_at,
        lastUpdated: user.updated_at ?? -1,

        enrolledCourses: enrolledData,
        completedCourses: completedCourseData,
        quizAttempts: quizAttemptData
    };

    return SuccessResponse(userData);
});
