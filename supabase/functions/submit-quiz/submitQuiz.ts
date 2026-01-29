import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getCurrentTimestampTz } from "../_shared/helpers.ts";
import {
    CourseService,
    EnrollmentService,
    QuizAttemptService,
    QuizQuestionAttemptService,
    QuizQuestionService
} from "../_shared/Service/Services.ts";
import { CourseStatus } from "../_shared/Enum/CourseStatus.ts";
import PermissionError from "../_shared/Error/PermissionError.ts";
import ValidationError from "../_shared/Error/ValidationError.ts";
import LogicError from "../_shared/Error/LogicError.ts";
import { QuestionType } from "../_shared/Enum/QuestionType.ts";

const submitQuiz = async (request: EdgeFunctionRequest) => {

    /**
     * Step 1: Get request data and the current timestamp
     */

    const timestamp = getCurrentTimestampTz();

    request.log(`Starting submitQuiz with timestamp ${timestamp}`);

    const userId = request.getRequestUserId();
    const { quizAttemptId, responses } = request.getPayload();

    request.log(`Request user id: ${userId} Quiz attempt id: ${quizAttemptId} Responses: ${JSON.stringify(responses)}`);


    /**
     * Step 2: Query course and quiz data. Validate user permissions and input
     */

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


    /**
     * Step 3: Build quiz question attempt objects and mark the quiz
     */

    let marksAchieved = 0;
    let autoMark = true;
    const quizQuestionAttempts = quizQuestions.map((q) => {

        const response = responses.find((r) => r.questionId === q.id);

        let marks = null;
        if (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) {
            marks = q.correct_answer === response.answer ? q.marks : 0;
            marksAchieved += marks;
        } else if (q.type === QuestionType.SHORT_ANSWER) {
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


    /**
     * Step 4: Add question attempts to the database, update question stats
     */

    request.log(`Constructed ${quizQuestionAttempts.length} question attempt objects, inserting to the database...`);

    await QuizQuestionAttemptService.insert(quizQuestionAttempts);

    request.log(`Updating question answer statistics...`);

    const questionData = {};
    quizQuestionAttempts.filter(q => q.type !== QuestionType.SHORT_ANSWER).map((attempt) => {
        const questionId = attempt.quiz_question_id;
        questionData[questionId] = quizQuestions.find(q => q.id === questionId).answers[attempt.response];
    });

    await QuizQuestionService.incrementQuestionStats(questionData);


    /**
     * Step 5: Update quiz attempt now its marked (end time, status, etc)
     */

    if (!autoMark && marksAchieved >= course.min_quiz_score) {
        autoMark = true;

        request.log(`User achieved enough marks to pass without short answer questions!`);
    }

    const update = {
        end_time: timestamp,
        ...(autoMark && { pass: marksAchieved >= course.min_quiz_score }),
        ...(autoMark && { score: marksAchieved })
    };
    await QuizAttemptService.updateById(quizAttemptId, update);

    request.log(`Updated quiz attempt`);

    if (autoMark) {
        await QuizAttemptService.handleMarkedQuiz(quizAttempt.course_attempt_id, timestamp);
    } else {
        await EnrollmentService.updateStatus(userId, course.id, CourseStatus.AWAITING_MARKING);
    }

    request.log(`Handled marked quiz`);

    return null;
}

export default submitQuiz;
