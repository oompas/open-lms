import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";

const startQuiz = async (request: EdgeFunctionRequest) => {

    const userId: string = request.getRequestUserId();
    const { courseId, courseAttemptId } = request.getPayload();

    const quizAttempt = {
        course_id: courseId,
        user_id: userId,
        course_attempt_id: courseAttemptId
    };

    const { data, error } = await adminClient.from('quiz_attempt').insert(quizAttempt).select();

    if (error) {
        throw error;
    }

    return data[0].id;
}

export default startQuiz;
