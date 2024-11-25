import { getRows } from "./database.ts";
import { adminClient } from "./adminClient.ts";
import { ErrorResponse, getCurrentTimestampTz, log } from "./helpers.ts";
import { EnrollmentService } from "./Service/Services.ts";
import { CourseStatus } from "./Enum/CourseStatus.ts";

/**
 * Given a quiz that's marked handle the status of it in relation to the course attempt (it may cause the attempt to
 * pass or fail)
 *
 * Note the quiz attempt must have all questions marked (can't have unmarked short answers), and the 'score' and
 * 'pass' fields are defined too. This doesn't update the quiz attempt, it (possibly) updates the course attempt
 *
 * @param quizAttemptId ID of the marked quiz attempt to handle
 */
const handleMarkedQuiz = async (quizAttemptId: number) => {
    const timestamp = getCurrentTimestampTz();

    const quizAttemptQuery = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'id', quizAttemptId] });
    if (quizAttemptQuery instanceof Response) return quizAttemptQuery;
    const quizAttempt = quizAttemptQuery[0];

    const courseAttemptQuery = await getRows({ table: 'course_attempt', conditions: ['eq', 'id', quizAttempt.course_attempt_id] });
    if (courseAttemptQuery instanceof Response) return courseAttemptQuery;
    const courseAttempt = courseAttemptQuery[0];

    // If the quiz passes, the course attempt passes
    if (quizAttempt.pass === true) {
        const { data, error } = await adminClient.from('course_attempt').update({ pass: true, end_time: timestamp }).eq('id', courseAttempt.id);
        await EnrollmentService.updateStatus(courseAttempt.course_id, courseAttempt.user_id, CourseStatus.COMPLETED);

        if (error) {
            log(`Error updating course attempt to pass: ${error.message}`);
            return ErrorResponse(`Error updating course attempt to pass: ${error.message}`);
        }

        return;
    }

    // If the quiz attempt fails, check if they're out of attempts (fail the course), otherwise they can try again
    const courseQuery = await getRows({ table: 'course', conditions: ['eq', 'id', quizAttempt.course_id] });
    if (courseQuery instanceof Response) return courseQuery;
    const course = courseQuery[0];

    const maxQuizAttempts = course.max_quiz_attempts;
    if (quizAttemptQuery.length >= maxQuizAttempts) {
        const { data, error } = await adminClient.from('course_attempt').update({ pass: false, end_time: timestamp }).eq('id', courseAttempt.id);
        await EnrollmentService.updateStatus(courseAttempt.course_id, courseAttempt.user_id, CourseStatus.FAILED);

        if (error) {
            log(`Error updating course attempt to failure: ${error.message}`);
            return ErrorResponse(`Error updating course attempt to failure: ${error.message}`);
        }
    }
}

export { handleMarkedQuiz };
