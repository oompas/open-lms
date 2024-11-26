import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseService, QuizQuestionService } from "../_shared/Service/Services.ts";

const getCourseDataAdmin = async (request: EdgeFunctionRequest) => {

    const { courseId } = request.getPayload();

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
        quizQuestions: quizQuestionData
    };
}

export default getCourseDataAdmin;
