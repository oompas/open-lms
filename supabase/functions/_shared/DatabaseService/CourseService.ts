import IService from "./IService.ts";

class courseService extends IService {

    protected readonly TABLE_NAME = "course";

    public constructor() {
        super();
    }
}

const CourseService = new courseService();

export default CourseService;
