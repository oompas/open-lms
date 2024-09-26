import { getRows } from "./database.ts";

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

    const latestQuizAttempt = quizAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest);
    if (latestQuizAttempt.end_time !== null && latestQuizAttempt.pass === null) {
        return CourseStatus.AWAITING_MARKING;
    }

    // In progress has a lot of cases, i.e. everything else
    return CourseStatus.IN_PROGRESS;
}

export { getCourseStatus };
