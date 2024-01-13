import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getCollection, verifyIsAdmin } from "../helpers/helpers";
import { logger } from "firebase-functions";

/**
 * Returns a list of all learners on the platform with their:
 * -uid
 * -name
 * -Number of courses completed
 */
const getUserReports = onCall(async (request) => {

    await verifyIsAdmin(request);

    return getCollection("/User/")
        .where("position", "==", "learner")
        .get()
        .then((users) => users.docs.map((user) => ({
            uid: user.id,
            name: user.data().name,
            coursesComplete: user.data().coursesComplete
        })))
        .catch((error) => {
            logger.error(`Error querying users: ${error}`);
            throw new HttpsError('internal', "Error getting user reports, please try again later");
        });
});

/**
 * Returns a list of all courses on the platform with their:
 * -course ID
 * -name
 * -active status
 * -Number of enrolled learners
 * -Number of learners who completed the course
 * -Average course completion time (not including quiz attempt(s))
 */
const getCourseReports = onCall(async (request) => {

    await verifyIsAdmin(request);

    const courses = await getCollection("/Course/")
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying courses: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    const enrollments = await getCollection("/EnrolledCourse/")
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying enrollments: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    const courseAttempts = await getCollection("/CourseAttempt/")
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying course attempts: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    courses.map((course) => {
        const courseData = course.data();

        const completedAttempts = courseAttempts.filter((attempt) => attempt.data().courseId === course.id && attempt.data().pass === true);

        const completionTimes = completedAttempts.map((attempt) => attempt.data().endTime.toDate() - attempt.data().startTime.toDate());
        const averageTime = (1 / completionTimes.length) * completionTimes.reduce((a, b) => a + b, 0);

        return {
            courseId: course.id,
            name: courseData.name,
            active: courseData.active,
            numEnrolled: enrollments.filter((enrollment) => enrollment.data().courseId == course.id).length,
            numComplete: completedAttempts.length,
            avgTime: averageTime,
        };
    })
});

export { getUserReports, getCourseReports };
