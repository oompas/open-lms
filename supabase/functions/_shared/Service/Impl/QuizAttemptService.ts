import IService from "../IService.ts";

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
}

export default _quizAttemptService;
