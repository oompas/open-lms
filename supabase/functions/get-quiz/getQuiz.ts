import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseService, QuizAttemptService, QuizQuestionService } from "../_shared/Service/Services.ts";

const getQuiz = async (request: EdgeFunctionRequest): Promise<object> => {

    const { quizAttemptId } = request.getPayload();

    const quizAttempt = await QuizAttemptService.getById(quizAttemptId);
    const allQuizAttempts = await QuizAttemptService.query('*', ['eq', 'course_attempt_id', quizAttempt.course_attempt_id]);
    const course = await CourseService.getById(quizAttempt.course_id);
    const quizQuestions = await QuizQuestionService.query('*', ['eq', 'course_id', course.id]);

    return {
        courseName: course.name,
        numAttempts: allQuizAttempts.length,
        maxAttempts: course.max_quiz_attempts,
        timeLimit: course.quiz_time_limit,
        startTime: new Date(quizAttempt.start_time),

        questions: quizQuestions.map((q) => {
            return {
                id: q.id,
                order: q.question_order,
                question: q.question,
                marks: q.marks,
                type: q.type,
                answers: q.answers
            };
        })
    }
}

export default getQuiz;
