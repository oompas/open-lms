import IService from "../IService.ts";
import { CourseStatus } from "./CourseService.ts";
import { adminClient } from "../../adminClient.ts";
import DatabaseError from "../../Error/DatabaseError.ts";

class _enrollmentService extends IService {

    TABLE_NAME = "enrolled_course";

    /**
     * Adds a course enrollment to the database
     */
    public async enrollInCourse(userId: string, courseId: number) {
        const { error } = await adminClient.from(this.TABLE_NAME).insert({ user_id: userId, course_id: courseId });

        if (error) {
            throw new DatabaseError(`Error adding enrollment to database ${error.message}`);
        }
    }

    /**
     * Removes an enrollment from the database
     */
    public async unenrollInCourse(userId: string, courseId: number) {
        const { error } = await adminClient.from(this.TABLE_NAME).delete().eq('user_id', userId).eq('course_id', courseId);

        if (error) {
            throw new DatabaseError(`Error removing enrollment from database ${error.message}`);
        }
    }

    /**
     * Returns the enrollment object for a given user and course id, if present
     */
    public async getEnrollment(userId: string, courseId: number): Promise<object> {
        const enrollment = await this.query('*', [['eq', 'course_id', courseId], ['eq', 'user_id', userId]]);
        if (enrollment.length > 1) {
            throw new DatabaseError(`Queried multiple enrollments for course_id ${courseId} and user_id ${userId}`);
        }
        return enrollment.length ? enrollment[0] : null;
    }

    /**
     * Updates the status of a course for a user
     */
    public async updateStatus(userId: string, courseId: number, status: CourseStatus) {
        await adminClient.from(this.TABLE_NAME).update({ status }).eq('course_id', courseId).eq('user_id', userId);
    }
}

export default _enrollmentService;
