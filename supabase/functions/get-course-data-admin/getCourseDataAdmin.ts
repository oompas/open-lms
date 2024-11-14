import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getRows } from "../_shared/database.ts";

const getCourseDataAdmin = (request: EdgeFunctionRequest) => {

    const { courseId } = request.getPayload();

    const courseQuery = await getRows({ table: 'course', conditions: ['eq', 'id', courseId] });
    if (courseQuery instanceof Response) return courseQuery;
    const course = courseQuery[0];

    const quizQuestionsQuery = await getRows({ table: 'quiz_question', conditions: ['eq', 'course_id', courseId] });
    if (quizQuestionsQuery instanceof Response) return quizQuestionsQuery;

    const quizQuestions = quizQuestionsQuery.map((question) => {
        return {
            id: question.id,
            type: question.type,
            question: question.question,
            marks: question.marks,
            ...(question.type === 'MC' && { answers: question.answers }),
            ...(question.type !== 'SA' && { correctAnswer: question.correct_answer }),
            ...(question.question_order && { order: question.question_order })
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
        quizQuestions: quizQuestions
    };
}

export default getCourseDataAdmin;