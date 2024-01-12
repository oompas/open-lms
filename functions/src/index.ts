/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


import { createAccount, resetPassword, beforeCreate, onUserSignup, beforeSignIn, onUserDelete, getUserProfile } from "./auth";
import { purgeUnverifiedUsers, purgeExpiredEmails } from "./cron";
import { saveCourse, getAllCourses, getCourseInfo, courseEnroll, startCourse } from "./courses";
import { saveQuiz, getQuizResponses, startQuiz, submitQuiz } from "./quizzes";
import { getCourseReports, getUserReports } from "./reports";

export {
    createAccount, resetPassword, beforeCreate, onUserSignup, beforeSignIn, onUserDelete, getUserProfile,
    purgeUnverifiedUsers, purgeExpiredEmails,
    saveCourse, getAllCourses, getCourseInfo, courseEnroll, startCourse,
    saveQuiz, getQuizResponses, startQuiz, submitQuiz,
    getCourseReports, getUserReports
};
