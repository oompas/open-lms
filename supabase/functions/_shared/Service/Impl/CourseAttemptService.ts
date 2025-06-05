import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";
import DatabaseError from "../../Error/DatabaseError.ts";

class _courseAttemptService extends IService {

    TABLE_NAME = "course_attempt";

    /**
     * Starts a new course attempt for a given course and user
     */
    public async startAttempt(courseId: number, userId: string): Promise<number> {
        const courseAttempt = {
            course_id: courseId,
            user_id: userId
        };

        const { data, error } = await adminClient.from(this.TABLE_NAME).insert(courseAttempt).select();

        if (error) {
            throw new DatabaseError(`Error adding new course attempt: ${error.message}`);
        }

        return data[0].id;
    }

    /**
     * Gets the latest course attempt given a list of course attempts
     */
    public getLatest(courseAttempts: object[]): object | null {
        if (courseAttempts.length === 0) {
            return null;
        }

        return courseAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
    }
}

export default _courseAttemptService;
