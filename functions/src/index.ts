/**
 * Write functions in their respective files, then the must be exported here to be deployed to Firebase
 */

import { createAccount, getUserProfile, resetPassword } from "./callable/auth";
import { beforeCreate, beforeSignIn, onUserDelete, onUserSignup } from "./triggers/auth";
import { courseEnroll, getAvailableCourses, getCourseInfo, addCourse, startCourse, sendCourseFeedback } from "./callable/courses";
import { getQuizResponses, addQuiz, updateQuiz, startQuiz, submitQuiz } from "./callable/quizzes";
import { getCourseReports, getUserReports } from "./callable/reports";
import { sendPlatformFeedback } from "./callable/misc";
import { cleanDatabase } from "./helpers/addDummyData";
import { purgeExpiredEmails, purgeUnverifiedUsers } from "./triggers/cron";
import { updateAdminPermissions, onCourseDeleted } from "./triggers/database";

export {
    createAccount, resetPassword, getUserProfile,
    beforeCreate, onUserSignup, beforeSignIn, onUserDelete,
    addCourse, getAvailableCourses, getCourseInfo, courseEnroll, startCourse, sendCourseFeedback,
    addQuiz, updateQuiz, getQuizResponses, startQuiz, submitQuiz,
    getCourseReports, getUserReports,
    sendPlatformFeedback,
    cleanDatabase,
    purgeUnverifiedUsers, purgeExpiredEmails,
    updateAdminPermissions, onCourseDeleted
};
