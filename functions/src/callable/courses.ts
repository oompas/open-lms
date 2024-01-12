import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getCollection, getDoc, verifyIsAdmin, verifyIsAuthenticated } from "../helpers/helpers";
import { logger } from "firebase-functions";
import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;

/**
 * Adds or updates a course (if a course ID is passed in, it updates) with the given data:
 * -name
 * -description
 * -link
 * -minTime
 * -quizAttempts
 * -maxQuizTime
 * -active
 *
 * If a course is added, the new ID is returned
 */
const saveCourse = onCall(async (request) => {

    await verifyIsAdmin(request);

    // TODO: Add/update logic
});

/**
 * Gets a list of all active courses the user hasn't completed, with their:
 * -name
 * -description
 * -enrolled status for the requesting user
 */
const getAvailableCourses = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid = request.auth.uid;

    // Get completed course IDs to exclude from the result
    const completedCourses: string[] = await getCollection("/CourseAttempt/")
        .where("userId", "==", uid)
        .where("pass", "==", true)
        .get()
        .then((docs) => docs.docs.map((doc) => doc.data().courseId))
        .catch((error) => {
            logger.error(`Error getting course attempts: ${error}`);
            throw new HttpsError("internal", `Error getting courses, please try again later`);
        });

    // Return all active & uncompleted courses
    return getCollection('/Course/')
        .where("active", "==", true)
        .get()
        .then((docs) => {
            return docs.docs
                .filter((doc) => !completedCourses.includes(doc.id))
                .map((doc) => ({ id: doc.id, ...doc.data() }));
        })
        .catch((error) => {
            logger.error(`Error getting active courses: ${error}`);
            throw new HttpsError("internal", `Error getting courses, please try again later`);
        });
});

/**
 * Gets the given information for the specified quiz:
 * -courseId
 * -name
 * -description
 * -link
 * -minTime
 * -maxQuizAttempts
 * -quizTimeLimit
 */
const getCourseInfo = onCall((request) => {

    verifyIsAuthenticated(request);

    return getDoc(`/Course/${request.data.courseId}/`)
        .get()
        .then((course) => {
            if (!course.exists) {
                logger.error(`Error: document '/Course/${request.data.courseId}/' does not exist`);
                throw new HttpsError("invalid-argument", `Course with ID '${request.data.courseId}' does not exist`);
            }

            const docData = course.data();
            if (!docData) {
                logger.error(`Error: document '/Course/${request.data.courseId}/' exists, but has no data`);
                throw new HttpsError("internal", "Error: document data corrupted");
            }

            return {
                courseId: course.id,
                name: docData.name,
                description: docData.description,
                link: docData.link,
                minTime: docData.minTime,
                maxQuizAttempts: docData.maxQuizAttempts,
                quizTimeLimit: docData.quizTimeLimit
            };
        })
        .catch((error) => {
            logger.error(`Error getting document '/Course/${request.data.courseId}/': ${error}`);
            throw new HttpsError("internal", "Error getting course data, please try again later");
        });
});

/**
 * Enrolls the requesting user in the specified course
 */
const courseEnroll = onCall(async (request) => {

    verifyIsAuthenticated(request);

    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to enroll in");
    }
    await getDoc(`/Course/${request.data.courseId}/`).get()
        .then((doc) => {
            if (!doc.exists) {
                logger.error(`Course with ID '${request.data.courseId}' does not exist`);
                throw new HttpsError('invalid-argument', `Course with ID '${request.data.courseId}' does not exist`);
            }
        })
        .catch((error) => {
            logger.error(`Error checking if course exists: ${error}`);
            throw new HttpsError('internal', "Error enrolling in course, please try again later");
        });

    return getCollection(`/EnrolledCourse/`)
        // @ts-ignore
        .add({ userId: request.auth.uid, courseId: request.data.courseId })
        .then(() => "Successfully enrolled in course")
        .catch((error) => {
            logger.error(`Error enrolling in course ${request.data.courseId}: ${error}`);
            throw new HttpsError("internal", "Error enrolling in course, please try again later");
        });
});

/**
 * The requesting users starts a course attempt
 */
const startCourse = onCall((request) => {

    verifyIsAuthenticated(request);

    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to start");
    }

    const courseAttempt = {
        // @ts-ignore
        userId: request.auth.uid,
        courseId: request.data.courseId,
        startTime: Timestamp.now(),
        endTime: null,
        pass: null,
    }

    return getCollection("/CourseAttempt/")
        .add(courseAttempt)
        .then(() => "Successfully started course")
        .catch((error) => {
            logger.error(`Error starting course ${request.data.courseId}: ${error}`);
            throw new HttpsError("internal", "Error enrolling in course, please try again later");
        });
});

export { saveCourse, getAvailableCourses, getCourseInfo, courseEnroll, startCourse };
