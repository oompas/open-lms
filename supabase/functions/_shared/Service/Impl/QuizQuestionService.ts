import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";
import { QuestionType } from "../../Enum/QuestionType.ts";
import DatabaseError from "../../Error/DatabaseError.ts";
import LogicError from "../../Error/LogicError.ts";

class _quizQuestionService extends IService {

    TABLE_NAME = "quiz_question";

    /**
     * Adds quiz questions for a new course
     */
    public async setupCourseQuiz(questions: object[], courseId: string) {

        const questionData = questions.map((question, index) => {

            // Setup answers (hardcode for t/f) and answering statistics
            let answers = question.answers;
            let answerStats = null;

            if (question.type === QuestionType.TRUE_FALSE) {
                answers = ["True", "False"];
            }
            if (question.type !== QuestionType.SHORT_ANSWER) {
                answerStats = {};
                for (const answer of answers) {
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
                answers: answers,
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
     * @param submittedAnswers Object with question IDs mapping to the selected answer (the answer itself, not its index)
     */
    public async incrementQuestionStats(submittedAnswers: { [id: number]: string }) {

        // Query current question values
        const questionIds: string[] = Object.keys(submittedAnswers);
        const { data: questions, error: fetchError } = await adminClient
            .from(this.TABLE_NAME)
            .select('id, submitted_answers')
            .in('id', questionIds)
            .not('submitted_answers', 'is', null);

        if (fetchError) {
            throw new DatabaseError(`Error fetching question stats: ${fetchError.message}`);
        }

        if (questions.length !== questionIds.length) {
            throw new LogicError(`Expected to query ${questionIds.length} questions to update stats for, but queried ${questions.length}`);
        }

        // Increment the selected answer locally
        questions.forEach((question: { id: number, submitted_answers: object }) => {
            if (!(question.id in submittedAnswers)) {
                throw new LogicError(`Question ID ${question.id} is not present in submittedAnswers: ${JSON.stringify(submittedAnswers)}`);
            }

            const answer: string = submittedAnswers[question.id];
            if (!(answer in question.submitted_answers)) {
                throw new LogicError(`Answer ${answer} is not present in question's submitted answers: ${JSON.stringify(question.submitted_answers)}`);
            }

            question.submitted_answers[submittedAnswers[question.id]] += 1;
        });

        // Updates question records with the new values
        try {
            await Promise.all(questions.map(updateData => {
                return adminClient
                    .from(this.TABLE_NAME)
                    .update({ submitted_answers: updateData.submitted_answers })
                    .eq('id', updateData.id);
            }));
        } catch (err: any) {
            throw new DatabaseError(`Error updating quiz question answer stats: ${err.message}`);
        }
    }
}

export default _quizQuestionService;
