/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


import { createAccount, resetPassword, beforeCreate, onUserSignup, beforeSignIn, onUserDelete, getUserProfile } from "./triggers/auth";
import { purgeUnverifiedUsers, purgeExpiredEmails } from "./triggers/cron";
import { saveCourse, getAllCourses, getCourseInfo, courseEnroll, startCourse } from "./callable/courses";
import { saveQuiz, getQuizResponses, startQuiz, submitQuiz } from "./callable/quizzes";
import { getCourseReports, getUserReports } from "./callable/reports";

export {
    createAccount, resetPassword, beforeCreate, onUserSignup, beforeSignIn, onUserDelete, getUserProfile,
    purgeUnverifiedUsers, purgeExpiredEmails,
    saveCourse, getAllCourses, getCourseInfo, courseEnroll, startCourse,
    saveQuiz, getQuizResponses, startQuiz, submitQuiz,
    getCourseReports, getUserReports
};
