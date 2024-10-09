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
    }
}

const CourseService = new _courseService();

export default CourseService;
