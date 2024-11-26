import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";

class _courseService extends IService {

    TABLE_NAME = "course";

    /**
     * Adds a new course to the database (not including quiz questions)
     */
    public async addCourse(course: object, userId: string) {

        const courseData = {
            user_id: userId,
            name: course.name,
            description: course.description,
            link: course.link,
            min_time: course.minTime,
        };

        const { data, error } = await adminClient.from('course').insert(courseData);
    }
}

export default _courseService;
