import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { ErrorResponse, getCurrentTimestampTz, log, SuccessResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { getRows } from "../_shared/database.ts";
import { handleMarkedQuiz } from "../_shared/functionality.ts";

const markQuizAttempt = (request: EdgeFunctionRequest) => {

    const timestamp = getCurrentTimestampTz();

    const userId = request.getRequestUserId();

    const { quizAttemptId, marks }: { quizAttemptId: number, marks: { questionAttemptId: number, marksAchieved: number }[] } = request.getPayload();

    // Mark questions
    await Promise.all(marks.map(async (mark) => {
        return await adminClient.from('quiz_question_attempt').update({ marks_achieved: mark.marks }).eq('id', mark.questionAttemptId);
    }));

    // Update quiz attempt: get total score and check if it passed
    const quizQuestionAttempts = await getRows({ table: 'quiz_question_attempt', conditions: ['eq', 'quiz_attempt_id', quizAttemptId] });
    if (quizQuestionAttempts instanceof Response) return quizQuestionAttempts;

    const totalMarks = quizQuestionAttempts.reduce((sum, attempt) => sum + attempt.marks_achieved, 0);

    const courseQuery = await getRows({ table: 'course', conditions: ['eq', 'id', quizQuestionAttempts[0].course_id] });
    if (courseQuery instanceof Response) return courseQuery;
    const course = courseQuery[0];

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

    const markRsp = await handleMarkedQuiz(quizAttemptId);
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
