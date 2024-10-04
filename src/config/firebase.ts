import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

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

enum ApiEndpoints {
    // Courses
    SendCourseFeedback = "sendCourseFeedback",
    DeleteCourse = "deleteCourse",

    // Reports
    DownloadUserReports = "downloadUserReports",

    // Misc
    SendPlatformFeedback = "sendPlatformFeedback",
    InviteLearner = "inviteLearner",
}

const functions = getFunctions();
const callApi = (endpoint: ApiEndpoints, payload: object) => httpsCallable(functions, endpoint)(payload);

export { ApiEndpoints, callApi };
