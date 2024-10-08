import IService from "./IService.ts";

class _enrollmentService extends IService {

    protected readonly TABLE_NAME = "enrolled_course";

    public constructor() {
        super();
    }

    /**
     * Returns true if the given user is enrolled in the given course
     */
    public async isEnrolled(courseId: number, userId: string): Promise<boolean> {
        return this.query([['eq', 'course_id', courseId], ['eq', 'user_id', userId]]);
    }
}

const EnrollmentService = new _enrollmentService();

export default EnrollmentService;
