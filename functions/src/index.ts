/**
 * Write functions in their respective files, then the must be exported here to be deployed to Firebase
 */

import { createAccount, getUserProfile, resetPassword } from "./callable/auth";
import { beforeSignIn, onUserDelete } from "./triggers/auth";
import { setCourseVisibility, courseEnrollment, getAvailableCourses, getCourseInfo, addCourse, startCourse, sendCourseFeedback, deleteCourse } from "./callable/courses";
import { getQuiz, startQuiz, submitQuiz, getQuizAttempt, markQuizAttempt } from "./callable/quizzes";
import { getAdminInsights, downloadCourseReports, downloadUserReports, getCourseInsightReport } from "./callable/reports";
import { sendPlatformFeedback, inviteLearner } from "./callable/misc";
import { cleanDatabase } from "./helpers/addDummyData";
import { purgeExpiredEmails, purgeUnverifiedUsers } from "./triggers/cron";
import { updateAdminPermissions, onCourseDeleted } from "./triggers/database";

export {
    createAccount, resetPassword, getUserProfile,
    beforeSignIn, onUserDelete,
    addCourse, getAvailableCourses, getCourseInfo, setCourseVisibility, courseEnrollment, startCourse, sendCourseFeedback, deleteCourse,
    getQuiz, startQuiz, submitQuiz, getQuizAttempt, markQuizAttempt,
    getAdminInsights, downloadCourseReports, downloadUserReports, getCourseInsightReport,
    sendPlatformFeedback, inviteLearner,
    cleanDatabase,
    purgeUnverifiedUsers, purgeExpiredEmails,
    updateAdminPermissions, onCourseDeleted
};
