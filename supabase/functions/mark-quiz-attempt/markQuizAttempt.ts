import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getCurrentTimestampTz } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";
import {
    CourseService,
    NotificationService,
    QuizAttemptService,
    QuizQuestionAttemptService
} from "../_shared/Service/Services.ts";
import DatabaseError from "../_shared/Error/DatabaseError.ts";

const markQuizAttempt = async (request: EdgeFunctionRequest) => {

    const timestamp = getCurrentTimestampTz();
    const userId = request.getRequestUserId();
    const { quizAttemptId, marks }: { quizAttemptId: number, marks: { questionAttemptId: number, marksAchieved: number }[] } = request.getPayload();

    request.log(`Entering markQuizAttempt for user ${userId} at timestamp ${timestamp} with quizAttemptId ${quizAttemptId} and marks ${JSON.stringify(marks)}`);

    await Promise.all(marks.map(async (mark) =>
        adminClient.from('quiz_question_attempt').update({ marks_achieved: mark.marksAchieved }).eq('id', mark.questionAttemptId)
    ));

    request.log(`Successfully marked ${marks.length} quiz questions`);

    // Update quiz attempt: get total score and check if it passed
    const quizQuestionAttempts = await QuizQuestionAttemptService.query('*', ['eq', 'quiz_attempt_id', quizAttemptId]);
    const totalMarks = quizQuestionAttempts.reduce((sum, attempt) => sum + attempt.marks_achieved, 0);

    const course = await CourseService.getById(quizQuestionAttempts[0].course_id);

    request.log(`Queried question attempts and course data, updating quiz attempt...`);

    const update = {
        marker_id: userId,
        marking_time: timestamp,
        pass: totalMarks >= course.min_quiz_score,
        score: totalMarks
    };
    const { error } = await adminClient.from('quiz_attempt').update(update).eq('id', quizAttemptId);

    if (error) {
        request.log(`Error updating quiz attempt: ${error.message}`);
        throw new DatabaseError(`Error updating quiz attempt: ${error.message}`);
    }

    request.log(`Successfully updated quiz attempt. Handling marked quiz...`);

    await QuizAttemptService.handleMarkedQuiz(quizQuestionAttempts[0].course_attempt_id, timestamp);

    request.log(`Successfully handled marked quiz`);

    const notification = {
        user_id: quizQuestionAttempts[0].user_id,
        direct: true,
        title: `Your ${course.name} quiz has been marked`,
        link: `/course/${course.id}`
    };
    await NotificationService.addNotification(notification);

    request.log(`Successfully sent user a notification`);

    return null;
}

export default markQuizAttempt;
