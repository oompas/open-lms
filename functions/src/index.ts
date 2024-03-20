/**
 * Write functions in their respective files, then the must be exported here to be deployed to Firebase
 */

import { createAccount, getUserProfile, resetPassword } from "./callable/auth";
import { beforeCreate, beforeSignIn, onUserDelete, onUserSignup } from "./triggers/auth";
import { publishCourse, unPublishCourse, updateCourse, courseEnroll, courseUnenroll, getAvailableCourses, getCourseInfo, addCourse, startCourse, sendCourseFeedback } from "./callable/courses";
import { getQuizResponses, updateQuizQuestions, getQuiz, startQuiz, submitQuiz, getQuizzesToMark } from "./callable/quizzes";
import { getCourseReports, getUserReports } from "./callable/reports";
import { sendPlatformFeedback } from "./callable/misc";
import { cleanDatabase } from "./helpers/addDummyData";
import { purgeExpiredEmails, purgeUnverifiedUsers } from "./triggers/cron";
import { updateAdminPermissions, onCourseDeleted } from "./triggers/database";

export {
    createAccount, resetPassword, getUserProfile,
    beforeCreate, onUserSignup, beforeSignIn, onUserDelete,
    addCourse, getAvailableCourses, getCourseInfo, publishCourse, unPublishCourse, updateCourse, courseEnroll, courseUnenroll, startCourse, sendCourseFeedback,
    updateQuizQuestions, getQuiz, getQuizResponses, startQuiz, submitQuiz, getQuizzesToMark,
    getCourseReports, getUserReports,
    sendPlatformFeedback,
    cleanDatabase,
    purgeUnverifiedUsers, purgeExpiredEmails,
    updateAdminPermissions, onCourseDeleted
};
