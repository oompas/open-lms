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

    /**
     * Increments answer statistics for each question in a quiz
     *
     * @param submittedAnswers Object with question IDs mapping to the selected answer (the answer itself, not itsindex)
     */
    public async incrementQuestionStats(submittedAnswers: { [key: number]: string }) {

        // Query current question values
        const questionIds = Object.keys(submittedAnswers);
        const { data: questions, error: fetchError } = await adminClient
            .from(this.TABLE_NAME)
            .select('id, submitted_answers')
            .in('id', questionIds)
            .not('submitted_answers', 'is', null);

        if (fetchError) {
            throw new Error(`Error fetching question stats: ${fetchError.message}`);
        }

        // Increment the selected answer locally
        const updates = questions.map(question => {
            const selectedAnswer = submittedAnswers[question.id];

            return {
                id: question.id,
                submitted_answers: {
                    ...question.submitted_answers,
                    [selectedAnswer]: currentStats[selectedAnswer] + 1
                }
            };
        });

        // Updates question database records with the new values
        const { error: updateError } = await adminClient
            .from(this.TABLE_NAME)
            .upsert(updates);

        if (updateError) {
            throw new Error(`Error updating question stats: ${updateError.message}`);
        }
    }
}

export default _quizQuestionService;
