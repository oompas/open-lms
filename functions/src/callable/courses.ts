import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getDoc, verifyIsAdmin, verifyIsAuthenticated } from "../helpers/helpers";
import { logger } from "firebase-functions";

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
 * Gets a list of all the courses, with their
 * -name
 * -description
 * -enrolled status for the requesting user
 * -completion status for the requesting user
 */
const getAllCourses = onCall((request) => {

    verifyIsAuthenticated(request);

    // TODO: Get all courses and check them in relation to the requesting user for enrollment & completion
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
const courseEnroll = onCall((request) => {

    verifyIsAuthenticated(request);

    // TODO: Create an EnrolledCourse object in the database with the given info
});

/**
 * The requesting users starts a course attempt
 */
const startCourse = onCall((request) => {

    verifyIsAuthenticated(request);

    // TODO: Create the CourseAttempt database object
});

export { saveCourse, getAllCourses, getCourseInfo, courseEnroll, startCourse };
