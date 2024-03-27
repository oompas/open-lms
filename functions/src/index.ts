/**
 * Write functions in their respective files, then the must be exported here to be deployed to Firebase
 */

import { createAccount, getUserProfile, resetPassword } from "./callable/auth";
import { beforeSignIn, onUserDelete } from "./triggers/auth";
import { updateCourse, setCourseVisibility, courseEnroll, courseUnenroll, getAvailableCourses, getCourseInfo, addCourse, startCourse, sendCourseFeedback } from "./callable/courses";
import { getQuizResponses, updateQuizQuestions, getQuiz, startQuiz, submitQuiz, getQuizzesToMark, getQuizAttempt, markQuizAttempt } from "./callable/quizzes";
import { getCourseReports, getUserReports } from "./callable/reports";
import { sendPlatformFeedback, inviteLearner } from "./callable/misc";
import { cleanDatabase } from "./helpers/addDummyData";
import { purgeExpiredEmails, purgeUnverifiedUsers } from "./triggers/cron";
import { updateAdminPermissions, onCourseDeleted } from "./triggers/database";

export {
    createAccount, resetPassword, getUserProfile,
    beforeSignIn, onUserDelete,
    addCourse, getAvailableCourses, getCourseInfo, setCourseVisibility, updateCourse, courseEnroll, courseUnenroll, startCourse, sendCourseFeedback,
    updateQuizQuestions, getQuiz, getQuizResponses, startQuiz, submitQuiz, getQuizzesToMark, getQuizAttempt, markQuizAttempt,
    getCourseReports, getUserReports,
    sendPlatformFeedback, inviteLearner,
    cleanDatabase,
    purgeUnverifiedUsers, purgeExpiredEmails,
    updateAdminPermissions, onCourseDeleted
};
