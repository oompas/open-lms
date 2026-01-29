import IService from "../IService.ts";
import { CourseAttemptService, CourseService, EnrollmentService, QuizAttemptService } from "../Services.ts";
import { adminClient } from "../../adminClient.ts";
import { CourseStatus } from "../../Enum/CourseStatus.ts";

class _quizAttemptService extends IService {

    TABLE_NAME = "quiz_attempt";

    /**
     * Gets the latest quiz attempt given a list of quiz attempts
     */
    public getLatest(quizAttempts: object[]): object {
        if (quizAttempts.length === 0) {
            return null;
        }

        return quizAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
    }

    /**
     * Starts a new quiz attempt
     */
    public async startQuiz(userId: string, courseId: number, courseAttemptId: number) {
        const quizAttempt = {
            course_id: courseId,
            user_id: userId,
            course_attempt_id: courseAttemptId
        };

        const { data, error } = await adminClient.from(this.TABLE_NAME).insert(quizAttempt).select();

        if (error) {
            throw error;
        }

        return data[0].id;
    }

    /**
     * Given a quiz that's marked handle the status of it in relation to the course attempt (it may cause the attempt to
     * pass or fail)
     *
     * Note the quiz attempt must have all questions marked (can't have unmarked short answers), and the 'score' and
     * 'pass' fields are defined too. This doesn't update the quiz attempt, it (possibly) updates the course attempt
     *
     * @param courseAttemptId ID of the latest course attempt
     * @param timestamp Timestamp at the start of the calling endpoint (use getCurrentTimestampTz)
     */
    public async handleMarkedQuiz(courseAttemptId: number, timestamp: string) {

        const quizAttempts = await QuizAttemptService.query('*', ['eq', 'course_attempt_id', courseAttemptId]); // All quiz attempts
        const latestQuizAttempt = this.getLatest(quizAttempts);
        const userId = latestQuizAttempt.user_id;
        const courseId = latestQuizAttempt.course_id;

        // If the quiz passes, the course attempt passes
        if (latestQuizAttempt.pass === true) {
            const { error } = await adminClient.from('course_attempt').update({ pass: true, end_time: timestamp }).eq('id', courseAttemptId);
            if (error) {
                throw new Error(`Error updating course attempt to pass: ${error.message}`);
            }

            await EnrollmentService.updateStatus(userId, courseId, CourseStatus.COMPLETED);
            return;
        }

        // If the quiz attempt fails, check if they're out of attempts (fail the course), otherwise they can try again
        const course = await CourseService.getById(courseId);

        const maxQuizAttempts = course.max_quiz_attempts;
        if (maxQuizAttempts !== null && quizAttempts.length >= maxQuizAttempts) {
            const { error } = await adminClient.from('course_attempt').update({ pass: false, end_time: timestamp }).eq('id', courseAttemptId);
            if (error) {
                throw new Error(`Error updating course attempt to failure: ${error.message}`);
            }

            await EnrollmentService.updateStatus(userId, courseId, CourseStatus.FAILED);
        }
    }
}

export default _quizAttemptService;
