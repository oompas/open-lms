/**
 * Write functions in their respective files, then the must be exported here to be deployed to Firebase
 */

import { createAccount, resetPassword, getUserProfile } from "./callable/auth";
import { beforeCreate, onUserSignup, beforeSignIn, onUserDelete } from "./triggers/auth";
import { saveCourse, getAllCourses, getCourseInfo, courseEnroll, startCourse } from "./callable/courses";
import { saveQuiz, getQuizResponses, startQuiz, submitQuiz } from "./callable/quizzes";
import { getCourseReports, getUserReports } from "./callable/reports";
import { purgeUnverifiedUsers, purgeExpiredEmails } from "./triggers/cron";

export {
    createAccount, resetPassword, getUserProfile,
    beforeCreate, onUserSignup, beforeSignIn, onUserDelete,
    saveCourse, getAllCourses, getCourseInfo, courseEnroll, startCourse,
    saveQuiz, getQuizResponses, startQuiz, submitQuiz,
    getCourseReports, getUserReports,
    purgeUnverifiedUsers, purgeExpiredEmails
};
