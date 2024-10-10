import IService from "../IService.ts";

class _quizAttemptService extends IService {

    private static readonly TABLE_NAME = "quiz_attempt";

    public constructor() {
        super(_quizAttemptService.TABLE_NAME);
    }
}

export default _quizAttemptService;
