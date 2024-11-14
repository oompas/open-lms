import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";
import { getCurrentTimestampTz } from "../../helpers.ts";

class _courseAttemptService extends IService {

    TABLE_NAME = "course_attempt";

    public async completeAttempt(id: number, pass: boolean) {
        await adminClient.from('course_attempt').update({ pass, end_time: getCurrentTimestampTz() }).eq('id', id);
    }

    /**
     * Gets the latest course attempt given a list of course attempts
     */
    public getLatest(courseAttempts: object[]): object {
        if (courseAttempts.length === 0) {
            return null;
        }

        return courseAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
    }
}

export default _courseAttemptService;
