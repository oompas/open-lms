import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, log, successResponse } from "../_shared/helpers.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";
import Course from "../_shared/DatabaseObjects/Course.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const userId = await getRequestUserId(req);

    const { id } = await req.json();

    const course = await getRows({ table: 'course', conditions: [['eq', 'id', id], ['eq', 'active', true]], expectResults: ['eq', 1] });
    if (course instanceof Response) return course;

    const courseData = course[0];

    log(`Course data: ${JSON.stringify(courseData)}`);
    const courseObj = new Course(courseData);
    log(`Course object data: ${courseObj.toJSON(true)}`);
    log(`Data and object data are equal: ${JSON.stringify(courseData, null, 4) === courseObj.toJSON(true)}`);

    let quizData = null;
    if (courseData.total_quiz_marks !== null) {
        quizData = {
            totalMarks: courseData.total_quiz_marks,
            maxAttempts: courseData.max_quiz_attempts,
            minScore: courseData.min_quiz_score,
            timeLimit: courseData.quiz_time_limit,
            numQuestions: courseData.num_quiz_questions,
        };
    }

    const enrollment = await getRows({ table: 'enrolled_course', conditions: [['eq', 'user_id', userId], ['eq', 'course_id', id]], expectResults: ['range', [0, 1]] });
    if (enrollment instanceof Response) return enrollment;

    const courseAttempts = await getRows({ table: 'course_attempt', conditions: [['eq', 'user_id', userId], ['eq', 'course_id', id]] });
    if (courseAttempts instanceof Response) return courseAttempts;

    let status;
    if (courseAttempts.length !== 0) {
        const current = courseAttempts.find(c => c.pass === null);
        if (current) {
            status = 3; // In progress
        } else {
            // TODO: awaiting marking, failed, completed
        }
    } else {
        status = enrollment.length > 0 ? 2 : 1;
    }

    const rsp = {
        id: courseData.id,
        active: courseData.active,
        name: courseData.name,
        description: courseData.description,
        link: courseData.link,
        status: status,
        minTime: courseData.min_time,

        quiz: quizData,
    };
    return successResponse(rsp);
});
