import IService from "./IService.ts";

class _quizAttemptService extends IService {

    // protected static readonly TABLE_NAME = "quiz_attempt";

    public constructor() {
        super("quiz_attempt");
    }
}

const QuizAttemptService = new _quizAttemptService();

export default QuizAttemptService;
