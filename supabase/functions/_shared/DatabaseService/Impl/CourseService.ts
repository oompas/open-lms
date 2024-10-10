import IService from "../IService.ts";
import { CourseStatus } from "../../Enum/CourseStatus.ts";
import { EnrollmentService } from "../Services.ts";

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

export default _courseService;
