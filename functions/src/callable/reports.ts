import { HttpsError, onCall } from "firebase-functions/v2/https";
import { verifyIsAdmin } from "../helpers/helpers";
import { logger } from "firebase-functions";
import {
    CourseAttemptDocument,
    DatabaseCollections,
    EnrolledCourseDocument,
    getCollection,
    getCollectionDocs, QuizAttemptDocument
} from "../helpers/database";

/**
 * Returns a list of all learners on the platform with their:
 * -uid
 * -name
 * -Number of courses completed
 */
const getUserReports = onCall(async (request) => {

    logger.info("Verifying user is an admin...");

    await verifyIsAdmin(request);

    logger.info("User is an admin, querying database for user reports...");

    const users = await getCollection(DatabaseCollections.User)
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying users: ${error}`);
            throw new HttpsError('internal', "Error getting user reports, please try again later");
        });

    const courseEnrollments = await getCollection(DatabaseCollections.EnrolledCourse)
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying course enrollments: ${error}`);
            throw new HttpsError('internal', "Error getting user reports, please try again later");
        });

    const courseAttempts = await getCollection(DatabaseCollections.CourseAttempt)
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying course attempts: ${error}`);
            throw new HttpsError('internal', "Error getting user reports, please try again later");
        });

    logger.info("Successfully queried database data, translating to user data...");

    return users.map((user) => {

        const userEnrollments = courseEnrollments.filter((enrollment) => enrollment.data().userId === user.id);
        const userAttempts = courseAttempts.filter((attempt) => attempt.data().userId === user.id);
        const completedAttempts = courseAttempts.filter((attempt) => attempt.data().userId == user.id && attempt.data().pass === true);

        return {
            uid: user.id,
            name: user.data().name,
            email: user.data().email,
            coursesEnrolled: userEnrollments.length,
            coursesAttempted: userAttempts.length,
            coursesComplete: completedAttempts.length,
        };
    }).sort((a, b) => b.coursesEnrolled - a.coursesEnrolled);
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

    logger.info("Verifying user is an admin...");

    await verifyIsAdmin(request);

    logger.info("User is an admin, querying database for course reports...");

    const courses = await getCollection(DatabaseCollections.Course)
        .where("active", "==", true)
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying courses: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    const enrollments = await getCollectionDocs(DatabaseCollections.EnrolledCourse) as EnrolledCourseDocument[];
    const courseAttempts = await getCollectionDocs(DatabaseCollections.CourseAttempt) as CourseAttemptDocument[];
    const quizAttempts = await getCollectionDocs(DatabaseCollections.QuizAttempt) as QuizAttemptDocument[];

    logger.info("Successfully queried database collections");

    return courses.map((course) => {

        const courseEnrollments: EnrolledCourseDocument[] = enrollments.filter((enrollment) => enrollment.courseId === course.id);

        const completedAttempts: CourseAttemptDocument[] = courseAttempts.filter((attempt) => attempt.courseId === course.id && attempt.pass === true);

        const completionTimes: number[] = completedAttempts.map((attempt) => {
            const milliseconds = (attempt.endTime?.toMillis() ?? 0) - attempt.startTime.toMillis();
            return Math.floor(milliseconds / 1000 / 60); // In minutes
        });
        let averageTime = null;
        if (completionTimes.length > 0) {
            averageTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
        }

        const quizScores = quizAttempts
            .filter((attempt) => attempt.courseId === course.id && attempt.pass === true)
            .map((attempt) => {
                if (attempt.score === null) {
                    throw new HttpsError('internal', `Completed quiz attempt (${attempt.id}) score is null`);
                }
                return attempt.score;
            });
        let averageScore = null;
        if (quizScores.length > 0) {
            averageScore = quizScores.reduce((a, b) => a + b, 0) / quizScores.length;
        }

        return {
            courseId: course.id,
            name: course.data().name,
            numEnrolled: courseEnrollments.length,
            numComplete: completedAttempts.length,
            avgTime: averageTime,
            avgQuizScore: averageScore,
        };
    }).sort((a, b) => b.numEnrolled - a.numEnrolled);
});

export { getUserReports, getCourseReports };
