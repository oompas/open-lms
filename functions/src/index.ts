/**
 * Write functions in their respective files, then the must be exported here to be deployed to Firebase
 */

import { createAccount, getUserProfile, resetPassword } from "./callable/auth";
import { beforeSignIn, onUserDelete } from "./triggers/auth";
import { setCourseVisibility, courseEnroll, courseUnenroll, getAvailableCourses, getCourseInfo, addCourse, startCourse, sendCourseFeedback, sendBrokenLinkReport } from "./callable/courses";
import { getQuizResponses, getQuiz, startQuiz, submitQuiz, getQuizzesToMark, getQuizAttempt, markQuizAttempt } from "./callable/quizzes";
import { getCourseReports, getUserReports, getCourseInsightReport } from "./callable/reports";
import { sendPlatformFeedback, inviteLearner } from "./callable/misc";
import { cleanDatabase } from "./helpers/addDummyData";
import { purgeExpiredEmails, purgeUnverifiedUsers } from "./triggers/cron";
import { updateAdminPermissions, onCourseDeleted } from "./triggers/database";

export {
    createAccount, resetPassword, getUserProfile,
    beforeSignIn, onUserDelete,
    addCourse, getAvailableCourses, getCourseInfo, setCourseVisibility, courseEnroll, courseUnenroll, startCourse, sendCourseFeedback, sendBrokenLinkReport,
    getQuiz, getQuizResponses, startQuiz, submitQuiz, getQuizzesToMark, getQuizAttempt, markQuizAttempt,
    getCourseReports, getUserReports, getCourseInsightReport,
    sendPlatformFeedback, inviteLearner,
    cleanDatabase,
    purgeUnverifiedUsers, purgeExpiredEmails,
    updateAdminPermissions, onCourseDeleted
};
