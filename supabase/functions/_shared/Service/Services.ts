import _courseAttemptService from "./Impl/CourseAttemptService.ts";
import _courseService from "./Impl/CourseService.ts";
import _enrollmentService from "./Impl/EnrollmentService.ts";
import _quizAttemptService from "./Impl/QuizAttemptService.ts";
import _notificationService from "./Impl/NotificationService.ts";
import _quizQuestionService from "./Impl/QuizQuestionService.ts";

const CourseService = new _courseService();
const EnrollmentService = new _enrollmentService();
const CourseAttemptService = new _courseAttemptService();
const QuizAttemptService = new _quizAttemptService();
const NotificationService = new _notificationService();
const QuizQuestionService = new _quizQuestionService();

export { CourseService, EnrollmentService, CourseAttemptService, QuizAttemptService, NotificationService, QuizQuestionService };
