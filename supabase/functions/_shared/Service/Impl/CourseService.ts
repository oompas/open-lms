import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";
import DatabaseError from "../../Error/DatabaseError.ts";
import InputError from "../../Error/InputError.ts";

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

            active: false,
            version: 1,
            min_time: course.minTime,

            max_quiz_attempts: course.maxQuizAttempts,
            min_quiz_score: course.minQuizScore,
            preserve_quiz_question_order: course.preserveQuizQuestionOrder,
            quiz_time_limit: course.quizTimeLimit,
            total_quiz_marks: course.totalQuizMarks,
            num_quiz_questions: course.numQuizQuestions,
        };

        const { data, error } = await adminClient.from(this.TABLE_NAME).insert(courseData).select();

        if (error) {
            throw new Error(`Error adding course to database: ${error.message}`);
        }

        return data[0];
    }

    /**
     * Updates a given course to the desired active status
     */
    public async setActiveStatus(courseId: number, active: boolean) {
        const courseData = await this.getById(courseId);

        if (courseData.active === active) {
            throw new InputError(`The course with ID ${courseId} is already ${active ? "active" : "inactive"}`);
        }

        const { error } = await adminClient.from(this.TABLE_NAME).update({ active: active }).eq('id', courseId);
        if (error) {
            throw new DatabaseError(`Error updating course with ID ${courseId} to ${active ? "active" : "inactive"}: ${error.message}`);
        }
    }
}

export default _courseService;
