import { getRows } from "./database.ts";
import { adminClient } from "./adminClient.ts";
import { errorResponse, log } from "./helpers.ts";

enum CourseStatus {
    NOT_ENROLLED = "NOT_ENROLLED",
    ENROLLED = "ENROLLED",
    IN_PROGRESS = "IN_PROGRESS",
    AWAITING_MARKING = "AWAITING_MARKING",
    FAILED = "FAILED",
    COMPLETED = "COMPLETED"
}

/**
 * Gets the current status of a course for a given user (NOTE_ENROLLED, ENROLLED, IN_PROGRESS, etc)
 *
 * @param courseId Course ID to check
 * @param userId User ID to check for the course
 */
const getCourseStatus = async (courseId: number, userId: string): CourseStatus => {
    // First check if user is not enrolled
    const enrollment = await getRows({ table: 'enrolled_course', conditions: [['eq', 'course_id', courseId], ['eq', 'user_id', userId]] });
    if (enrollment instanceof Response) return enrollment;

    if (enrollment.length === 0) {
        return CourseStatus.NOT_ENROLLED;
    }

    // Next, check if they're enrolled but haven't started the course
    const courseAttempts = await getRows({ table: 'course_attempt', conditions: [['eq', 'course_id', courseId], ['eq', 'user_id', userId]] });
    if (courseAttempts instanceof Response) return courseAttempts;

    if (courseAttempts.length === 0) {
        return CourseStatus.ENROLLED;
    }

    // Completed if the course attempt pass is true
    const latestCourseAttempt = courseAttempts.find(c => c.end_time === null);
    if (latestCourseAttempt.pass === true) {
        return CourseStatus.COMPLETED;
    }

    // Failed if the course attempt pass is false
    if (latestCourseAttempt.pass === false) {
        return CourseStatus.FAILED;
    }

    // Awaiting marking when the latest quiz attempt is done, but isn't scored yet
    const quizAttempts = await getRows({ table: 'quiz_attempt', conditions: [['eq', 'course_id', courseId], ['eq', 'user_id', userId]] });
    if (quizAttempts instanceof Response) return quizAttempts;

    if (quizAttempts.length !== 0) {
        const latestQuizAttempt = quizAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest);
        if (latestQuizAttempt.end_time !== null && latestQuizAttempt.pass === null) {
            return CourseStatus.AWAITING_MARKING;
        }
    }

    // In progress has a lot of cases, i.e. everything else
    return CourseStatus.IN_PROGRESS;
}

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
    const quizAttemptQuery = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'id', quizAttemptId] });
    if (quizAttemptQuery instanceof Response) return quizAttemptQuery;
    const quizAttempt = quizAttemptQuery[0];

    const courseAttemptQuery = await getRows({ table: 'course_attempt', conditions: ['eq', 'id', quizAttempt.course_attempt_id] });
    if (courseAttemptQuery instanceof Response) return courseAttemptQuery;
    const courseAttempt = courseAttemptQuery[0];

    // If the quiz passes, the course attempt passes
    if (quizAttempt.pass === true) {
        const { data, error } = await adminClient.from('course_attempt').update({ pass: true }).eq('id', courseAttempt.id);

        if (error) {
            log(`Error updating course attempt to pass: ${error.message}`);
            return errorResponse(`Error updating course attempt to pass: ${error.message}`);
        }
    }

    // If the quiz attempt fails, check if they're out of attempts (fail the course), otherwise they can try again
    const courseQuery = await getRows({ table: 'course', conditions: ['eq', 'id', quizAttempt.course_id] });
    if (courseQuery instanceof Response) return courseQuery;
    const course = courseQuery[0];

    const maxQuizAttempts = course.max_quiz_attempts;
    if (quizAttemptQuery.length >= maxQuizAttempts) {
        const { data, error } = await adminClient.from('course_attempt').update({ pass: false }).eq('id', courseAttempt.id);

        if (error) {
            log(`Error updating course attempt to failure: ${error.message}`);
            return errorResponse(`Error updating course attempt to failure: ${error.message}`);
        }
    }
}

export { getCourseStatus, handleMarkedQuiz };
