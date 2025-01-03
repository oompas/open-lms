import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";
import { getCurrentTimestampTz } from "../../helpers.ts";
import DatabaseError from "../../Error/DatabaseError.ts";

class _courseAttemptService extends IService {

    TABLE_NAME = "course_attempt";

    public async completeAttempt(id: number, pass: boolean) {
        // TODO: throw error if there is one here (make a general update/add/etc in parent class that handles
        //  errors, do this for everything!)
        await adminClient.from(this.TABLE_NAME).update({ pass, end_time: getCurrentTimestampTz() }).eq('id', id);
    }

    /**
     * Starts a new course attempt for a given course and user
     */
    public async startAttempt(courseId: number, userId: string) {
        const courseAttempt = {
            course_id: courseId,
            user_id: userId
        };

        const { error } = await adminClient.from(this.TABLE_NAME).insert(courseAttempt);

        if (error) {
            throw new DatabaseError(`Error adding new course attempt: ${error.message}`);
        }
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
