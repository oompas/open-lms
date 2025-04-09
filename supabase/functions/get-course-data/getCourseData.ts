import {
    CourseAttemptService,
    CourseService,
    QuizAttemptService,
    QuizQuestionService
} from "../_shared/Service/Services.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseStatus } from "../_shared/Enum/CourseStatus.ts";
import InputError from "../_shared/Error/InputError.ts";
import { QuestionType } from "../_shared/Enum/QuestionType.ts";

const getCourseData = async (request: EdgeFunctionRequest): Promise<object> => {

    request.log(`Getting requesting user ID, course ID, and adminView param...`);

    const userId: string = request.getRequestUserId();
    const { courseId, adminView } = request.getPayload();

    request.log(`User id: ${userId}. Course id: ${courseId}. Admin view? ${adminView}`);

    if (!adminView) {
        const result = await CourseService
            .query(`
            *,
            course_attempt(id, start_time),
            enrolled_course(status)
          `,
                [
                    ['eq', 'id', courseId],
                    ['eq', 'active', true],
                    ['eq', 'course_attempt.user_id', userId],
                    ['eq', 'course_attempt.course_id', courseId],
                    ['eq', 'enrolled_course.course_id', courseId],
                    ['eq', 'enrolled_course.user_id', userId]
                ],
                {
                    limit: 1
                });

        // If there is no returned course, the course doesn't exist or is inactive
        if (result === null) {
            const result = await CourseService.query(`*`, ['eq', 'id', courseId], { limit: 1 });
            if (result == null) {
                throw new InputError(`Course with id '${courseId}' does not exist`);
            }
            throw new InputError(`Course with id '${courseId}' is inactive`);
        }

        const { course_attempt: courseAttempts, enrolled_course: [enrollment], ...course } = result;
        let courseStatus = enrollment?.status ?? CourseStatus.NOT_ENROLLED;

        request.log(`Course status: ${courseStatus}. Course attempts: ${courseAttempts?.length ?? 0}. Course: ${JSON.stringify(course)}`);

        let quizData = null;
        if (course.total_quiz_marks !== null) {
            quizData = {
                totalMarks: course.total_quiz_marks,
                maxAttempts: course.max_quiz_attempts,
                minScore: course.min_quiz_score,
                timeLimit: course.quiz_time_limit,
                numQuestions: course.num_quiz_questions
            };
        }

        request.log(`Course quiz data: ${JSON.stringify(quizData)}`);

        let attempts = null;
        const latestCourseAttempt = CourseAttemptService.getLatest(courseAttempts);
        if (latestCourseAttempt !== null) {
            attempts = {
                numAttempts: courseAttempts.length,
                currentAttemptId: latestCourseAttempt.id,
                currentStartTime: new Date(latestCourseAttempt.start_time)
            }
        }

        request.log(`Course attempt data: ${JSON.stringify(attempts)}`);

        const quizAttemptData = {
            number: 0,
            currentId: null
        };
        if (latestCourseAttempt) {
            const quizAttempts = await QuizAttemptService
                .query(`id, start_time`,
                    ['eq', 'course_attempt_id', latestCourseAttempt.id],
                    { order: 'start_time', ascendOrder: false }
                );

            quizAttemptData.number = quizAttempts.length;
            quizAttemptData.currentId = quizAttempts[0]?.id;
        }

        request.log(`Quiz attempt data: ${JSON.stringify(quizAttemptData)}`);

        return {
            id: course.id,
            active: course.active,
            name: course.name,
            description: course.description,
            link: course.link,
            minTime: course.min_time,

            status: courseStatus,

            quizData: quizData,
            courseAttempt: attempts,
            quizAttempts: quizAttemptData
        };
    } else {
        request.validateAdmin("Requesting user must be an admin for course data's adminView");

        const [course, quizQuestions] = await Promise.all([
            CourseService.getById(courseId),
            QuizQuestionService.query('*', ['eq', 'course_id', courseId])
        ]);

        const quizQuestionData = quizQuestions.map((question) => {
            return {
                id: question.id,
                type: question.type,
                question: question.question,
                marks: question.marks,

                order: question.question_order,
                ...(question.type === QuestionType.MULTIPLE_CHOICE && { answers: question.answers }),
                ...(question.type !== QuestionType.SHORT_ANSWER && { correctAnswer: question.correct_answer })
            };
        });

        return {
            id: course.id,
            active: course.active,
            name: course.name,
            description: course.description,
            link: course.link,
            minTime: course.min_time,

            quizData: {
                minScore: course.min_quiz_score,
                maxAttempts: course.max_quiz_attempts,
                timeLimit: course.quiz_time_limit,
                preserveOrder: course.preserve_quiz_question_order
            },
            quizQuestions: quizQuestionData
        };
    }
}

export default getCourseData;
