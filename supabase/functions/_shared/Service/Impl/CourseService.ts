import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";

class _courseService extends IService {

    TABLE_NAME = "course";

    /**
     * Adds a new course to the database (not including quiz questions)
     */
    public async addCourse(course: object, userId: string) {

        // id and created_at are auto-generated
        const courseData = {
            user_id: userId,
            name: course.name,
            description: course.description,
            link: course.link,

            active: true,
            version: 1,
            min_time: course.minTime,

            max_quiz_attempts: 1,
            min_quiz_score: 1,
            preserve_quiz_question_order: false,
            quiz_time_limit: 1,
            total_quiz_marks: 1,
            num_quiz_questions: 1,
        };

        const { data, error } = await adminClient.from('course').insert(courseData).select();

        if (error) {
            throw new Error(`Error adding course to database`);
        }

        return data[0];
    }
}

export default _courseService;
