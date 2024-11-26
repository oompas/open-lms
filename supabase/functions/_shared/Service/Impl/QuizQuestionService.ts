import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";

class _quizQuestionService extends IService {

    TABLE_NAME = "quiz_question";

    /**
     * Adds quiz questions for a new course
     */
    public async setupCourseQuiz(questions: object[], courseId: string) {
        const { error } = await adminClient.from(this.TABLE_NAME).insert(questions);

        if (error) {
            throw new Error(`Error adding quiz questions for new course: ${error.message}`);
        }
    }
}

export default _quizQuestionService;
