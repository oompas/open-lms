import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { ErrorResponse, getCurrentTimestampTz, log, SuccessResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { CourseService, QuizAttemptService, QuizQuestionAttemptService } from "../_shared/Service/Services.ts";

const markQuizAttempt = async (request: EdgeFunctionRequest) => {

    const timestamp = getCurrentTimestampTz();

    const userId = request.getRequestUserId();

    const { quizAttemptId, marks }: { quizAttemptId: number, marks: { questionAttemptId: number, marksAchieved: number }[] } = request.getPayload();

    // Mark questions
    await Promise.all(marks.map(async (mark) => {
        return await adminClient.from('quiz_question_attempt').update({ marks_achieved: mark.marks }).eq('id', mark.questionAttemptId);
    }));

    // Update quiz attempt: get total score and check if it passed
    const quizQuestionAttempts = await QuizQuestionAttemptService.query('*', ['eq', 'quiz_attempt_id', quizAttemptId]);
    const totalMarks = quizQuestionAttempts.reduce((sum, attempt) => sum + attempt.marks_achieved, 0);

    const course = await CourseService.getById(quizQuestionAttempts[0].course_id);

    const update = {
        marker_id: userId,
        marking_time: timestamp,
        pass: totalMarks >= course.min_quiz_score,
        score: totalMarks
    };
    const { data, error } = await adminClient.from('quiz_attempt').update(update).eq('id', quizAttemptId);

    if (error) {
        log(`Error updating quiz attempt: ${error.message}`);
        return ErrorResponse(`Error updating quiz attempt: ${error.message}`);
    }

    const markRsp = await QuizAttemptService.handleMarkedQuiz(quizAttemptId);
    if (markRsp instanceof Response) return markRsp;

    const notification = {
        user_id: quizQuestionAttempts[0].user_id,
        direct: true,
        title: `Your ${course.name} quiz has been marked`,
        link: `/course/${course.id}`,
        read: false
    };
    const { data: data2, error: error2 } = await adminClient.from('notification').insert(notification);

    if (error2) {
        log(`Error adding notification: ${error.message}`);
        return ErrorResponse(`Error adding notification: ${error.message}`);
    }

    return SuccessResponse(data);
}

export default markQuizAttempt;
