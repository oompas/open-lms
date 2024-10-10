import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";
import { getCurrentTimestampTz } from "../../helpers.ts";

class _courseAttemptService extends IService {

    private static readonly TABLE_NAME = "course_attempt";

    public constructor() {
        super(_courseAttemptService.TABLE_NAME);
    }

    public async completeAttempt(id: number, pass: boolean) {
        await adminClient.from('course_attempt').update({ pass, end_time: getCurrentTimestampTz() }).eq('id', id);
    }
}

export default _courseAttemptService;
