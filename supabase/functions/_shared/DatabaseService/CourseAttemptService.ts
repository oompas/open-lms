import IService from "./IService.ts";
import { adminClient } from "../adminClient.ts";
import { getCurrentTimestampTz } from "../helpers.ts";

class _courseAttemptService extends IService {

    protected readonly TABLE_NAME = "course_attempt";

    public constructor() {
        super();
    }

    public async completeAttempt(id: number, pass: boolean) {
        await adminClient.from('course_attempt').update({ pass, end_time: getCurrentTimestampTz() }).eq('id', id);
    }
}

const CourseAttemptService = new _courseAttemptService();

export default CourseAttemptService;
