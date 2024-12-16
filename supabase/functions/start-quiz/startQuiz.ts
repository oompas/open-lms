import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { QuizAttemptService } from "../_shared/Service/Services.ts";

const startQuiz = async (request: EdgeFunctionRequest) => {

    const userId: string = request.getRequestUserId();
    const { courseId, courseAttemptId } = request.getPayload();

    request.log(`Entering startQuiz with userId ${userId}, courseId ${courseId} and courseAttemptId ${courseAttemptId}`);

    const quizAttemptId = await QuizAttemptService.startQuiz(userId, courseId, courseAttemptId);

    request.log(`Quiz successfully started. Quiz attempt id: ${quizAttemptId}`);

    return quizAttemptId;
}

export default startQuiz;
