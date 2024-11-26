import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseService } from "../_shared/Service/Services.ts";

const createCourse = async (request: EdgeFunctionRequest) => {

    const userId: string = request.getRequestUserId();

    request.log(`Entering createCourse for user ${userId}`);

    const { course, quizQuestions } = request.getPayload();

    request.log(`Incoming course data: ${JSON.stringify(course)} and quiz questions: ${JSON.stringify(quizQuestions)}`);

    await CourseService.addCourse(course, userId);

    request.log(`Course added to database!`);

    return null;
}

export default createCourse;
