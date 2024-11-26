import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import {
    CourseAttemptService,
    QuizAttemptService,
    QuizQuestionAttemptService,
    QuizQuestionService
} from "../_shared/Service/Services.ts";

const getQuizAttempt = async (request: EdgeFunctionRequest) => {

    const { quizAttemptId } = request.getPayload();

    const quizAttempt = await QuizAttemptService.getById(quizAttemptId);

    const [course, user, questionAttempts, questions] = await Promise.all([
        CourseAttemptService.getById(quizAttempt.course_id),
        request.getUserById(quizAttempt.user_id),
        QuizQuestionAttemptService.query('*', ['eq', 'quiz_attempt_id', quizAttemptId]),
        QuizQuestionService.query('*', ['eq', 'course_id', quizAttempt.course_id])
    ]);

    const saQuestions = questionAttempts.filter((q) => q.type === "SA").map((q) => {
        const question = questions.find((question) => question.id === q.quiz_question_id);
        return {
            question: question.question,
            marks: question.marks,
            questionAttemptId: q.id,
            response: q.response,
            marksAchieved: q.marks_achieved
        };
    });

    const otherQuestions = questionAttempts.filter((q) => q.type !== "SA").map((q) => {
        const question = questions.find((question) => question.id === q.quiz_question_id);
        return {
            question: question.question,
            type: question.type,
            answers: question.answers,
            correctAnswer: question.correct_answer,
            marks: question.marks,
            response: q.response,
            marksAchieved: q.marks_achieved
        };
    });

    return {
        courseName: course.name,
        submitterName: user.user_metadata.name,
        completionTime: new Date(quizAttempt.end_time),
        saQuestions: saQuestions,
        otherQuestions: otherQuestions,
        score: quizAttempt.score,
        markingInfo: quizAttempt.markerInfo
    };
}

export default getQuizAttempt;
