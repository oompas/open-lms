import IService from "./IService.ts";
import { CourseStatus } from "./CourseService.ts";
import { adminClient } from "../adminClient.ts";
import DatabaseError from "../Error/DatabaseError.ts";

class _enrollmentService extends IService {

    private static readonly TABLE_NAME = "enrolled_course";

    public constructor() {
        super(_enrollmentService.TABLE_NAME);
    }

    /**
     * Returns the enrollment object for a given user and course id, if present
     */
    public async getEnrollment(courseId: number, userId: string): Promise<object> {
        const enrollment = await this.query([['eq', 'course_id', courseId], ['eq', 'user_id', userId]]);
        if (enrollment.length > 1) {
            await DatabaseError.create(`Queried multiple enrollments for course_id ${courseId} and user_id ${userId}`);
        }
        return enrollment.length ? enrollment[0] : null;
    }

    /**
     * Updates the status of a course for a user
     */
    public async updateStatus(courseId: number, userId: string, status: CourseStatus) {
        await adminClient.from(_enrollmentService.TABLE_NAME).update({ status }).eq('course_id', courseId).eq('user_id', userId);
    }
}

const EnrollmentService = new _enrollmentService();

export default EnrollmentService;
