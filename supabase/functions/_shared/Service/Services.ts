import _courseService from "./Impl/CourseService.ts";
import _notificationService from "./Impl/NotificationService.ts";
import _enrollmentService from "./Impl/EnrollmentService.ts";
import _courseAttemptService from "./Impl/CourseAttemptService.ts";
import _quizAttemptService from "./Impl/QuizAttemptService.ts";
import _quizQuestionService from "./Impl/QuizQuestionService.ts";
import _quizQuestionAttemptService from "./Impl/QuizQuestionAttemptService.ts";

const CourseService = new _courseService();
const NotificationService = new _notificationService();
const EnrollmentService = new _enrollmentService();
const CourseAttemptService = new _courseAttemptService();
const QuizAttemptService = new _quizAttemptService();
const QuizQuestionService = new _quizQuestionService();
const QuizQuestionAttemptService = new _quizQuestionAttemptService();

export {
    CourseService,
    NotificationService,
    EnrollmentService,
    CourseAttemptService,
    QuizAttemptService,
    QuizQuestionService,
    QuizQuestionAttemptService
};
