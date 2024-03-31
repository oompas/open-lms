import { initializeApp } from "firebase/app";
import { getAuth } from "@firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAsync } from "react-async-hook";
import { getAdminInsights } from "../../functions/src";

// Firebase configuration
// To switch between dev & prod, swap your .env.local file
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
initializeApp(firebaseConfig);

const auth = getAuth();

enum ApiEndpoints {
    // Auth
    CreateAccount = "createAccount",
    ResetPassword = "resetPassword",
    GetUserProfile = "getUserProfile",

    // Courses
    AddCourse = "addCourse",
    GetAvailableCourses = "getAvailableCourses",
    GetCourseInfo = "getCourseInfo",
    SetCourseVisibility = "setCourseVisibility",
    CourseEnrollment = "courseEnrollment",
    StartCourse = "startCourse",
    SendCourseFeedback = "sendCourseFeedback",
    DeleteCourse = "deleteCourse",

    // Quizzes
    GetQuiz = "getQuiz",
    StartQuiz = "startQuiz",
    SubmitQuiz = "submitQuiz",
    GetQuizAttempt = "getQuizAttempt",
    MarkQuizAttempt = "markQuizAttempt",

    // Reports
    GetAdminInsights = "getAdminInsights",
    DownloadCourseReports = "downloadCourseReports",
    DownloadUserReports = "downloadUserReports",
    GetCourseInsightReport = "getCourseInsightReport",

    // Misc
    SendPlatformFeedback = "sendPlatformFeedback",
    InviteLearner = "inviteLearner",

    // Helpers
    CleanDatabase = "cleanDatabase",
}

const functions = getFunctions();
const callApi = (endpoint: ApiEndpoints, payload: object) => httpsCallable(functions, endpoint)(payload);
const useAsyncApiCall = (endpoint: ApiEndpoints, payload: object, then?: (rsp: any) => any) => {
    if (then) {
        return useAsync(() => httpsCallable(functions, endpoint)(payload).then(then), []);
    }
    return useAsync(() => httpsCallable(functions, endpoint)(payload), []);
}

export { auth, ApiEndpoints, callApi, useAsyncApiCall };
