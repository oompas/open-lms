/**
 * Write functions in their respective files, then the must be exported here to be deployed to Firebase
 */

import { createAccount, getUserProfile, resetPassword } from "./callable/auth";
import { beforeCreate, beforeSignIn, onUserDelete, onUserSignup } from "./triggers/auth";
import { courseEnroll, getAllCourses, getCourseInfo, saveCourse, startCourse } from "./callable/courses";
import { getQuizResponses, saveQuiz, startQuiz, submitQuiz } from "./callable/quizzes";
import { getCourseReports, getUserReports } from "./callable/reports";
import { purgeExpiredEmails, purgeUnverifiedUsers } from "./triggers/cron";

export {
    createAccount, resetPassword, getUserProfile,
    beforeCreate, onUserSignup, beforeSignIn, onUserDelete,
    saveCourse, getAllCourses, getCourseInfo, courseEnroll, startCourse,
    saveQuiz, getQuizResponses, startQuiz, submitQuiz,
    getCourseReports, getUserReports,
    purgeUnverifiedUsers, purgeExpiredEmails
};
