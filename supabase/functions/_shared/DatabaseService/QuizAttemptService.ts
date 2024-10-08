import IService from "./IService.ts";

class _quizAttemptService extends IService {

    protected readonly TABLE_NAME = "quiz_attempt";

    public constructor() {
        super();
    }
}

const QuizAttemptService = new _quizAttemptService();

export default QuizAttemptService;
