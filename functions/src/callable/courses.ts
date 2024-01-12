import { onCall } from "firebase-functions/v2/https";
import { verifyIsAdmin, verifyIsAuthenticated } from "../helpers/helpers";

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
 * -quizAttempts
 * -maxQuizTime
 */
const getCourseInfo = onCall((request) => {

    verifyIsAuthenticated(request);

    // TODO: Attempt to get the quiz, returning the info if it exists and is active
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
