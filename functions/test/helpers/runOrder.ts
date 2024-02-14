import "../callable/auth/createAccount";
import "../callable/auth/resetPassword";
import "../callable/auth/getUserProfile";

import "../callable/courses/courseEnroll";
import "../callable/courses/getAvailableCourses";
import "../callable/courses/getCourseInfo";
import "../callable/courses/addCourse";
import "../callable/courses/sendCourseFeedback";
import "../callable/courses/startCourse";

import "../callable/misc/sendPlatformFeedback";

import "../callable/quizzes/getQuizResponses";
import "../callable/quizzes/saveQuiz";
import "../callable/quizzes/startQuiz";
import "../callable/quizzes/submitQuiz";

import "../callable/reports/getCourseReports";
import "../callable/reports/getUserReports";

import "../triggers/auth/beforeSignIn";
import "../triggers/auth/onUserDelete";
import "../triggers/auth/onUserSignup";

import "../triggers/database/changeUserPosition";

//
// Add an import for all test files (except setup/cleanup) here in the desired order
//
