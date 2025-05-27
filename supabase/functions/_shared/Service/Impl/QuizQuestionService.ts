import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";
import { QuestionType } from "../../Enum/QuestionType.ts";

class _quizQuestionService extends IService {

    TABLE_NAME = "quiz_question";

    /**
     * Adds quiz questions for a new course
     */
    public async setupCourseQuiz(questions: object[], courseId: string) {

        const questionData = questions.map((question, index) => {

            // Setup answer stats (exclude SA, start all at zero)
            const answerStats = question.type === QuestionType.SHORT_ANSWER ? null : {};
            if (answerStats !== null) {
                for (const answer of (question.answers ?? ["True", "False"])) {
                    answerStats[answer] = 0;
                }
            }

            return {
                course_id: courseId,
                question_order: index,
                question: question.question,
                marks: question.marks,
                type: question.type,
                correct_answer: question.correctAnswer,
                answers: question.answers,
                submitted_answers: answerStats
            };
        });

        const { error } = await adminClient.from(this.TABLE_NAME).insert(questionData);

        if (error) {
            throw new Error(`Error adding quiz questions for new course: ${error.message}`);
        }
    }
}

export default _quizQuestionService;
