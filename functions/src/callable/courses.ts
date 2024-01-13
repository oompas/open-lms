import { HttpsError, onCall } from "firebase-functions/v2/https";
import { DatabaseCollections, getCollection, getDoc, verifyIsAdmin, verifyIsAuthenticated } from "../helpers/helpers";
import { logger } from "firebase-functions";
import { Timestamp } from "firebase/firestore";

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

    // TODO: Figure out an effective way to do both updates and adds
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
    const completedCourses: string[] = await getCollection(DatabaseCollections.CourseAttempt)
        .where("userId", "==", uid)
        .where("pass", "==", true)
        .get()
        .then((docs) => docs.docs.map((doc) => doc.data().courseId))
        .catch((error) => {
            logger.error(`Error getting course attempts: ${error}`);
            throw new HttpsError("internal", `Error getting courses, please try again later`);
        });

    // Return all active & uncompleted courses
    return getCollection(DatabaseCollections.Course)
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

    return getDoc(DatabaseCollections.Course, request.data.courseId)
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

    // Ensure a valid course ID is passed in
    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to enroll in");
    }
    await getDoc(DatabaseCollections.Course, request.data.courseId).get()
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

    return getCollection(DatabaseCollections.EnrolledCourse)
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
const startCourse = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // Verify the user in enrolled in the course
    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to start");
    }
    await getCollection(DatabaseCollections.EnrolledCourse)
        // @ts-ignore
        .where("userId", "==", request.auth.uid)
        .where("courseId", "==", request.data.courseId)
        .get()
        .then((doc) => {
            if (doc.empty) {
                // @ts-ignore
                logger.error(`No course enrollment with course ID '${request.data.courseId}' and user ID '${request.auth.uid}' exists`);
                throw new HttpsError('invalid-argument', `You are not enrolled in this course`);
            }
        })
        .catch((error) => {
            logger.error(`Error checking if user is enrolled in course: ${error}`);
            throw new HttpsError('internal', "Error starting course, please try again later");
        });

    const courseAttempt = {
        // @ts-ignore
        userId: request.auth.uid,
        courseId: request.data.courseId,
        startTime: Timestamp.now(),
        endTime: null,
        pass: null,
    }

    return getCollection(DatabaseCollections.CourseAttempt)
        .add(courseAttempt)
        .then(() => "Successfully started course")
        .catch((error) => {
            logger.error(`Error starting course ${request.data.courseId}: ${error}`);
            throw new HttpsError("internal", "Error enrolling in course, please try again later");
        });
});

export { saveCourse, getAvailableCourses, getCourseInfo, courseEnroll, startCourse };
