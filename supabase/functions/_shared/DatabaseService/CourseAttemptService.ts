import IService from "./IService.ts";

class _courseAttemptService extends IService {

    protected readonly TABLE_NAME = "course_attempt";

    public constructor() {
        super();
    }
}

const CourseAttemptService = new _courseAttemptService();

export default CourseAttemptService;
