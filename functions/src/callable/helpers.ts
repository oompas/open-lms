import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { CourseAttemptDocument, DatabaseCollections, docExists, getCollection } from "../helpers/database";
import { DOCUMENT_ID_LENGTH, USER_UID_LENGTH } from "../helpers/helpers";

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

export { enrolledCourseId, reportedCourseId, getCourseStatus, getLatestCourseAttempt };