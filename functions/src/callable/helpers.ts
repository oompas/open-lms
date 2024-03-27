import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import {
    CourseAttemptDocument, CourseDocument,
    DatabaseCollections,
    docExists,
    getCollection,
    getDocData, QuizQuestionAttemptDocument,
    updateDoc
} from "../helpers/database";
import { DOCUMENT_ID_LENGTH, USER_UID_LENGTH } from "../helpers/helpers";
import { firestore } from "firebase-admin";

/**
 * The status of a course for a given user
 */
enum CourseStatus {
    NotEnrolled = 1,
    Enrolled = 2,
    InProgress = 3,
    AwaitingMarking = 4,
    Failed = 5,
    Passed = 6
}

/**
 * The ID for an enrolled course is the user & course ID concatenated so:
 * -No query is needed to check it, can just get the document through an ID
 * -No duplicate enrollments are possible
 * The enrollment document will also have these IDs in the document if individual queries are needed
 */
const enrolledCourseId = (userId: string, courseId: string) => {
    validUserId(userId);
    validDocumentId(courseId);

    return `${userId}|${courseId}`;
}

/**
 * The ID for a course reported by a user to have a broken platform link is the user & course ID concatenated so:
 * - No duplicate reports from the same user
 */
const reportedCourseId = (userId: string, courseId: string) => {
    validUserId(userId);
    validDocumentId(courseId);

    return `${userId}|${courseId}`;
}

/**
 * Throws an error if a given string is not a valid document ID (20 alphanumeric characters long)
 */
const validDocumentId = (docId: string) => {
    if (!docId.match(/^[a-zA-Z0-9]{20}$/)) {
        throw new HttpsError("invalid-argument", `Invalid document id '${docId}' - must be a 20 character alphanumeric string`);
    }
}

/**
 * Throws an error if a given string is not a valid user ID (28 alphanumeric characters long)
 */
const validUserId = (userId: string) => {
    if (!userId.match(/^[a-zA-Z0-9]{28}$/)) {
        throw new HttpsError("invalid-argument", `Invalid user id '${userId}' - must be a 28 character alphanumeric string`);
    }
}

/**
 * Get the status of a course for a user
 */
const getCourseStatus = async (courseId: string, userId: string) => {

    const courseEnrolled: boolean = await docExists(DatabaseCollections.EnrolledCourse, enrolledCourseId(userId, courseId));
    if (!courseEnrolled) { // Save a query if the course isn't enrolled
        return CourseStatus.NotEnrolled;
    }

    const courseAttempt: CourseAttemptDocument | null = await getLatestCourseAttempt(courseId, userId);

    if (courseAttempt === null) {
        return  CourseStatus.Enrolled;
    } else if (courseAttempt?.pass === null) {
        const awaitingMarking = await getCollection(DatabaseCollections.QuizAttempt)
            .where("courseAttemptId", "==", courseAttempt.id)
            .where("endTime", "!=", null)
            .where("pass", "==", null)
            .get()
            .then((docs) => !docs.empty)
            .catch((error) => {
                logger.error(`Error checking if quiz is awaiting marking: ${error}`);
                throw new HttpsError('internal', "Error getting course quiz, please try again later");
            });

        return awaitingMarking ? CourseStatus.AwaitingMarking : CourseStatus.InProgress;
    } else if (courseAttempt?.pass === false) {
        return CourseStatus.Failed;
    } else if (courseAttempt?.pass === true) {
        return CourseStatus.Passed;
    } else {
        throw new HttpsError("internal", `Course is in an invalid state - can't get status`);
    }
}

/**
 * Gets the current course attempt for a user & course, returning null if no current attempt
 */
const getLatestCourseAttempt = async (courseId: string, userId: string) => {

    // Validate params
    if (!courseId || !userId) {
        throw new HttpsError("invalid-argument", "Invalid course or user id in getLatestCourseAttempt");
    }
    if (courseId.length !== DOCUMENT_ID_LENGTH) {
        throw new HttpsError("invalid-argument", "Invalid course id in getLatestCourseAttempt - must be a 20 character string");
    }
    if (userId.length !== USER_UID_LENGTH) {
        throw new HttpsError("invalid-argument", "Invalid user id in getLatestCourseAttempt - must be a 28 character string");
    }

    return getCollection(DatabaseCollections.CourseAttempt)
        .where("courseId", "==", courseId)
        .where("userId", "==", userId)
        .orderBy("startTime", "desc")
        .limit(1)
        .get()
        .then((docs) => {
            if (docs.empty) {
                return null;
            }
            return docs.docs[0].data() as CourseAttemptDocument;
        })
        .catch((error) => {
            logger.error(`Error getting latest course attempt: ${error}`);
            throw new HttpsError('internal', "Error getting course attempt, please try again later");
        });
}

/**
 * After marking quiz questions, call this to update quiz attempt & course attempt status
 */
const updateQuizStatus = async (quizAttemptId: string) => {

    const completionTime = firestore.FieldValue.serverTimestamp();

    const quizQuestions = await getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("quizAttemptId", "==", quizAttemptId)
        .get()
        .then((docs) => docs.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizQuestionAttemptDocument)))
        .catch((error) => {
            logger.error(`Error getting quiz questions: ${error}`);
            throw new HttpsError('internal', "Error getting quiz questions, please try again later");
        });

    // If there are unmarked short answer questions, just update the completion time (don't know the score or passed status yet)
    if (quizQuestions.some((question) => question.marksAchieved === null)) {
        return updateDoc(DatabaseCollections.QuizAttempt, quizAttemptId, { endTime: completionTime });
    }

    const courseAttemptId = quizQuestions[0].courseAttemptId;
    const courseData = await getDocData(DatabaseCollections.Course, quizQuestions[0].courseId) as CourseDocument; // @ts-ignore
    const marksAchieved = quizQuestions.reduce((total, question) => total + question.marksAchieved, 0);

    // If the quiz has a minimum score, check if the user passed (if no minimum score, they pass automatically)
    const pass = marksAchieved >= (courseData.quiz?.minScore ?? 0);

    const promises: Promise<any>[] = [];

    // Update the quiz attempt with the final score, completion time and pass status
    const quizAttemptUpdate = {
        endTime: completionTime,
        pass: pass,
        score: marksAchieved,
    };
    promises.push(updateDoc(DatabaseCollections.QuizAttempt, quizAttemptId, quizAttemptUpdate));

    // If this is the last quiz attempt, we need to update the course attempt's status
    let lastAttempt = false;
    if (courseData.quiz?.maxAttempts) {
        const numQuizAttempts = await getCollection(DatabaseCollections.QuizAttempt)
            .where("courseAttemptId", "==", courseAttemptId)
            .get()
            .then((snapshot) => snapshot.size)
            .catch((err) => {
                logger.info(`Error getting quiz attempts: ${err}`);
                throw new HttpsError("internal", `Error getting quiz attempts`);
            });

        if (numQuizAttempts === courseData.quiz?.maxAttempts) {
            lastAttempt = true;
        }
    }

    // If this is not the last quiz attempt, they are only done the course if they passed the quiz (fail = try again)
    if (lastAttempt || (!lastAttempt && pass)) {
        const update = {
            pass: pass,
            score: marksAchieved,
            endTime: completionTime
        };
        promises.push(updateDoc(DatabaseCollections.CourseAttempt, courseAttemptId, update));
    }

    return Promise.all(promises).then(() => `Quiz attempt '${quizAttemptId}' status updated successfully`);
}

export { enrolledCourseId, reportedCourseId, getCourseStatus, getLatestCourseAttempt, updateQuizStatus };