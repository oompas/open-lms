import { firestore } from "firebase-admin";
import { db } from "./setup";

// Helpers for getting a doc/collection
const getCollection = (collection: DatabaseCollections) => db.collection(`/${collection}/`);
const getDoc = (collection: DatabaseCollections, docId: string) => db.doc(`/${collection}/${docId}/`);

const getEmailCollection = () => db.collection(`/Email/`);

// All database collections (excluding email, use the sendEmail helper function for that)
enum DatabaseCollections {
    User = "User",
    Course = "Course",
    EnrolledCourse = "EnrolledCourse",
    QuizQuestion = "QuizQuestion",
    ReportedCourse = "ReportedCourse",
    CourseAttempt = "CourseAttempt",
    QuizAttempt = "QuizAttempt",
    QuizQuestionAttempt = "QuizQuestionAttempt",
}

interface UserDocument {
    email: string;
    name: string;
    admin: boolean;
    signUpTime: firestore.Timestamp;
}

interface CourseDocument {
    name: string;
    description: string;
    link: string;
    active: boolean;
    minTime: number | null;
    userId: string;
    quiz: {
        maxAttempts: number | null;
        minScore: number | null;
        preserveOrder: boolean;
        timeLimit: number | null;
    } | null;
}

interface EnrolledCourseDocument {
    userId: string;
    courseId: string;
}

interface QuizQuestionDocument {
    courseId: string;
    question: string;
    type: "tf" | "mc" | "sa";
    marks: number;
    answers?: string[];
    correctAnswer?: number;
    active: boolean;
    stats: {
        numAttempts: number;
        totalScore?: number;
        distribution?: { [key: string]: number };
    };
}

interface ReportedCourseDocument { // TODO

}

interface CourseAttemptDocument {
    userId: string;
    courseId: string;
    startTime: firestore.Timestamp;
    endTime: firestore.Timestamp | null;
    pass: boolean | null;
}

interface QuizAttemptDocument {
    userId: string;
    courseId: string;
    courseAttemptId: string;
    startTime: firestore.Timestamp;
    endTime: firestore.Timestamp | null;
    pass: boolean | null;
}

interface QuizQuestionAttemptDocument {
    userId: string;
    courseId: string;
    courseAttemptId: string;
    questionId: string;
    response: string | number;
    marksAchieved: number | null;
}

export {
    getCollection,
    getDoc,
    getEmailCollection,
    DatabaseCollections,
    UserDocument,
    CourseDocument,
    EnrolledCourseDocument,
    ReportedCourseDocument,
    QuizQuestionDocument,
    CourseAttemptDocument,
    QuizAttemptDocument,
    QuizQuestionAttemptDocument
};
