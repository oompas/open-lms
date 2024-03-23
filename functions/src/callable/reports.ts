import { HttpsError, onCall } from "firebase-functions/v2/https";
import { DatabaseCollections, getCollection, verifyIsAdmin } from "../helpers/helpers";
import { logger } from "firebase-functions";

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

    const enrollments = await getCollection(DatabaseCollections.EnrolledCourse)
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying enrollments: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    const courseAttempts = await getCollection(DatabaseCollections.CourseAttempt)
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying course attempts: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    const quizAttempts = await getCollection(DatabaseCollections.QuizAttempt)
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying quiz attempts: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    logger.info("Successfully queried database collections");

    return courses.map((course) => {

        const courseEnrollments = enrollments.filter((enrollment) => enrollment.data().courseId === course.id);

        const completedAttempts = courseAttempts.filter((attempt) => {
            return attempt.data().courseId === course.id && attempt.data().pass === true;
        });

        const completionTimes = completedAttempts.map((attempt) => {
            const milliseconds = attempt.data().endTime.toMillis() - attempt.data().startTime.toMillis();
            return Math.floor(milliseconds / 1000 / 60); // In minutes
        });
        const averageTime = completionTimes.length === 0 ? null : (1 / completionTimes.length) * completionTimes.reduce((a, b) => a + b, 0);

        const quizScores = quizAttempts
            .filter((attempt) => attempt.data().courseId === course.id && attempt.data().pass === true)
            .map((attempt) => attempt.data().score);
        const averageScore = quizScores.length === 0 ? null : (1 / quizScores.length) * quizScores.reduce((a, b) => a + b, 0);

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


/**
 * Returns a list of statistics for the course on the platform:
 * -List of enrolled users
 *      -Status of completion
 *      -Quiz to be marked (Y/N)
 * -Number of enrolled learners
 * -Number of learners who completed the course
 * -Average course completion time (not including quiz attempt(s))
 * -List of question fail rate amongst all the questions for a distribution
 */
const getCourseReport = onCall(async (request) => {

    logger.info("Verifying user is an admin...");

    await verifyIsAdmin(request);

    logger.info("User is an admin, querying database for this course's report...");

    // query CourseAttempt's with a specific courseId whose pass is null (i.e. not finished and they're still doing the course)
    // unsure
    // query QuizQuestionAtempt's with a userId for questions whose marksAchieved is null
    // next 3 are repeats from prior function
    // query QuizQuestions for active questions and get their marks (i.e. max marks attainable)
    // query QuizQuestionAttempt's for both the question average marks and absolute number of question attempts
    // this gives the relative question percentage score and allows a distribution to be built for the front-end
    // to detect if there's an ingrained issue with a specific question
});

export { getUserReports, getCourseReports, getCourseReport };
