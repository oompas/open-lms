import IService from "./IService.ts";
import EnrollmentService from "./EnrollmentService.ts";

export enum CourseStatus {
    NOT_ENROLLED = "NOT_ENROLLED",
    ENROLLED = "ENROLLED",
    IN_PROGRESS = "IN_PROGRESS",
    AWAITING_MARKING = "AWAITING_MARKING",
    FAILED = "FAILED",
    COMPLETED = "COMPLETED"
}

class _courseService extends IService {

    private static readonly TABLE_NAME = "course";

    public constructor() {
        super(_courseService.TABLE_NAME);
    }

    /**
     * Gets the current status of a course for a given user (NOTE_ENROLLED, ENROLLED, IN_PROGRESS, etc)
     */
    public async getCourseStatus(courseId: number, userId: string) {
        const enrollment = await EnrollmentService.getEnrollment(courseId, userId);
        if (enrollment === null) {
            return CourseStatus.NOT_ENROLLED;
        }

        return enrollment.status;

        // // Next, check if they're enrolled but haven't started the course
        // const courseAttempts = await getRows({ table: 'course_attempt', conditions: [['eq', 'course_id', courseId], ['eq', 'user_id', userId]] });
        // if (courseAttempts instanceof Response) return courseAttempts;
        //
        // if (courseAttempts.length === 0) {
        //     return CourseStatus.ENROLLED;
        // }
        //
        // // Completed if the course attempt pass is true
        // const latestCourseAttempt = courseAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
        // if (latestCourseAttempt.pass === true) {
        //     return CourseStatus.COMPLETED;
        // }
        //
        // // Failed if the course attempt pass is false
        // if (latestCourseAttempt.pass === false) {
        //     return CourseStatus.FAILED;
        // }
        //
        // // Awaiting marking when the latest quiz attempt is done, but isn't scored yet
        // const quizAttempts = await getRows({ table: 'quiz_attempt', conditions: [['eq', 'course_id', courseId], ['eq', 'user_id', userId]] });
        // if (quizAttempts instanceof Response) return quizAttempts;
        //
        // if (quizAttempts.length !== 0) {
        //     const latestQuizAttempt = quizAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest);
        //     if (latestQuizAttempt.end_time !== null && latestQuizAttempt.pass === null) {
        //         return CourseStatus.AWAITING_MARKING;
        //     }
        // }
        //
        // // In progress has a lot of cases, i.e. everything else
        // return CourseStatus.IN_PROGRESS;
    }
}

const CourseService = new _courseService();

export default CourseService;
