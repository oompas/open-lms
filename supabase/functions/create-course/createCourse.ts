import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseService, QuizQuestionService } from "../_shared/Service/Services.ts";

const createCourse = async (request: EdgeFunctionRequest) => {

    const userId: string = request.getRequestUserId();

    request.log(`Entering createCourse for user ${userId}`);

    const { course, quizQuestions } = request.getPayload();

    request.log(`Incoming course data: ${JSON.stringify(course)} and quiz questions: ${JSON.stringify(quizQuestions)}`);

    course['totalQuizMarks'] = quizQuestions.reduce((sum, obj) => sum + obj.marks, 0);
    course['numQuizQuestions'] = quizQuestions.length;

    const courseData = await CourseService.addCourse(course, userId);

    request.log(`Course added to database with id ${courseData.id}`);

    await QuizQuestionService.setupCourseQuiz(quizQuestions, courseData.id);

    request.log(`Setup quiz questions`);

    return courseId;
}

export default createCourse;
