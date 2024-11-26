import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getCurrentTimestampTz } from "../_shared/helpers.ts";
import {
    CourseService,
    EnrollmentService,
    QuizAttemptService, QuizQuestionAttemptService,
    QuizQuestionService
} from "../_shared/Service/Services.ts";
import { CourseStatus } from "../_shared/Enum/CourseStatus.ts";
import PermissionError from "../_shared/Error/PermissionError.ts";
import ValidationError from "../_shared/Error/ValidationError.ts";
import LogicError from "../_shared/Error/LogicError.ts";

const submitQuiz = async (request: EdgeFunctionRequest) => {

    const timestamp = getCurrentTimestampTz();

    request.log(`Starting submitQuiz with timestamp ${timestamp}`);

    const userId = request.getRequestUserId();
    const { quizAttemptId, responses } = request.getPayload();

    request.log(`Request user id: ${userId} Quiz attempt id: ${quizAttemptId} Responses: ${JSON.stringify(responses)}`);

    const quizAttempt = await QuizAttemptService.getById(quizAttemptId);

    request.log(`Quiz attempt: ${JSON.stringify(quizAttempt)}`);

    if (quizAttempt.user_id !== userId) {
        throw new PermissionError(`User ${userId} does not have access to quiz attempt ${quizAttemptId} (owning user: ${quizAttempt.userId})`);
    }

    const [course, quizQuestions] = await Promise.all([
        CourseService.getById(quizAttempt.course_id),
        QuizQuestionService.getByColumn('course_id', quizAttempt.course_id)
    ]);

    request.log(`Course: ${JSON.stringify(course)} Quiz questions: ${JSON.stringify(quizQuestions)}`);

    if (quizQuestions.length !== responses.length) {
        throw new ValidationError(`There are ${quizQuestions.length} quiz questions, but only ${responses.length} responses were provided`);
    }
    if (!responses.every((r) => quizQuestions.some((q) => q.id === r.questionId))) {
        throw new ValidationError(`Quiz question IDs and response IDs don't fully match`);
    }

    request.log(`Responses verification passed!`);

    // Mark quiz questions
    let marksAchieved = 0;
    let autoMark = true;
    const quizQuestionAttempts = quizQuestions.map((q) => {

        const response = responses.find((r) => r.questionId === q.id);

        let marks = null;
        if (q.type === "MC" || q.type === "TF") {
            marks = q.correct_answer === response.answer ? q.marks : 0;
            marksAchieved += marks;
        } else if (q.type === "SA") {
            autoMark = false;
        } else {
            throw new LogicError(`Unknown question type: ${q.type}`);
        }

        return {
            course_id: quizAttempt.course_id,
            user_id: userId,
            quiz_question_id: q.id,
            course_attempt_id: quizAttempt.course_attempt_id,
            quiz_attempt_id: quizAttemptId,

            type: q.type,

            response: response.answer,
            max_marks: q.marks,
            marks_achieved: marks
        };
    });
    if (quizQuestionAttempts instanceof Response) return quizQuestionAttempts;

    await QuizQuestionAttemptService.insert(quizQuestionAttempts);

    if (marksAchieved >= course.min_quiz_score) {
        autoMark = true; // If the user gets enough marks to pass without the short answers, pass them
    }

    // Update quiz attempt
    const update = {
        end_time: timestamp,
        ...(autoMark && { pass: marksAchieved >= course.min_quiz_score }),
        ...(autoMark && { score: marksAchieved })
    };
    await QuizAttemptService.updateById(quizAttemptId, update);

    // Handle quiz marked or awaiting marking
    if (autoMark) {
        await QuizAttemptService.handleMarkedQuiz(quizAttemptId);
    } else {
        await EnrollmentService.updateStatus(course.id, userId, CourseStatus.AWAITING_MARKING);
    }

    return null;
}

export default submitQuiz;
