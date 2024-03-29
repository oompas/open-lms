import { HttpsError, onCall } from "firebase-functions/v2/https";
import { verifyIsAdmin } from "../helpers/helpers";
import { logger } from "firebase-functions";
import {
    CourseAttemptDocument,
    DatabaseCollections,
    EnrolledCourseDocument,
    getCollection,
    getCollectionDocs,
    QuizAttemptDocument,
    QuizQuestionDocument,
    QuizQuestionAttemptDocument,
    UserDocument, getDocData, CourseDocument, ReportedCourseDocument,
} from "../helpers/database";
import { object, string } from "yup";
import { getCourseStatus } from "./helpers";
import { auth } from "../helpers/setup";
import { UserRecord } from "firebase-admin/lib/auth";

/**
 * Converts an array of objects (with the same keys & no embedded objects) into a CSV string
 */
const toCSV = (json: { [key: string]: any }[]) => {
    let csv = "";
    const keys = (json[0] && Object.keys(json[0])) || [];
    csv += keys.join(',') + '\n';
    for (let line of json) {
        csv += keys.map(key => line[key]).join(',') + '\n';
    }
    return csv;
}

/**
 * Returns a list of all courses on the platform with their name, enrolled & completed users and average course/quiz
 * time
 */
const getCourseInsights = onCall(async (request) => {

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
            averageTime = Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length * 10) / 10;
        }

        const quizScores: number[] = quizAttempts
            .filter((attempt) => attempt.courseId === course.id && attempt.pass === true)
            .map((attempt) => {
                if (attempt.score === null) {
                    throw new HttpsError('internal', `Completed quiz attempt (${attempt.id}) score is null`);
                }
                return attempt.score;
            });
        let averageScore = null;
        if (quizScores.length > 0) {
            const totalQuizMarks = course.data().quiz.totalMarks;
            const totalScore = quizScores.reduce((total, curr) => total + curr, 0);

            averageScore = Math.round((totalScore / quizScores.length / totalQuizMarks) * 100 * 10) / 10;
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

/**
 * Downloads all course-related data, including attempts, in a csv format
 */
const downloadCourseReports = onCall(async (request) => {

    await verifyIsAdmin(request);

    const schema = object({}).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    const courses: { [key: string]: any }[] = await getCollectionDocs(DatabaseCollections.Course) // @ts-ignore
        .then((result: CourseDocument[]) => {
            return result.map((course) => {
                return {
                    courseId: course.id,
                    name: course.name,
                    description: course.description,
                    link: course.link,
                    active: course.active,
                    minTime: course.minTime,
                    userId: course.userId,
                    hasQuiz: course.quiz !== null,
                    quizMaxAttempts: course.quiz?.maxAttempts,
                    quizMinScore: course.quiz?.minScore,
                    quizPreserveOrder: course.quiz?.preserveOrder,
                    quizTimeLimit: course.quiz?.timeLimit,
                    retired: course.retired,
                    version: course.version,
                };
            });
        });

    return toCSV(courses);
});

/**
 * Returns a list of all learners on the platform with their name, email and course statistics (# enrolled, started,
 * completed)
 */
const getUserInsights = onCall(async (request) => {

    logger.info("Verifying user is an admin...");

    await verifyIsAdmin(request);

    logger.info("User is an admin, querying database for user reports...");

    const users = await getCollectionDocs(DatabaseCollections.User) as UserDocument[];
    const courseEnrollments = await getCollectionDocs(DatabaseCollections.EnrolledCourse) as EnrolledCourseDocument[];
    const courseAttempts = await getCollectionDocs(DatabaseCollections.CourseAttempt) as CourseAttemptDocument[];

    logger.info("Successfully queried database data, translating to user data...");

    return users.map((user) => {

        const userEnrollments = courseEnrollments.filter((enrollment) => enrollment.userId === user.id);
        const userAttempts = courseAttempts.filter((attempt) => attempt.userId === user.id);
        const completedAttempts = courseAttempts.filter((attempt) => attempt.userId == user.id && attempt.pass === true);

        return {
            uid: user.id,
            name: user.name,
            email: user.email,
            coursesEnrolled: userEnrollments.length,
            coursesAttempted: userAttempts.length,
            coursesComplete: completedAttempts.length,
        };
    }).sort((a, b) => b.coursesEnrolled - a.coursesEnrolled);
});

/**
 * Returns detailed user data in a CSV format (oes tno include actual course attempt data)
 */
const downloadUserReports = onCall(async (request) => {

    logger.info(`Entering downloadUserReports for user ${request.auth?.uid} with payload: ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    const schema = object({}).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info(`Schema validation passed`);

    // Get all records at once, then filter through them for each user to reduce queries
    const userRecords = await auth.listUsers().then((result) => result.users) as UserRecord[];
    const enrollments = await getCollectionDocs(DatabaseCollections.EnrolledCourse) as EnrolledCourseDocument[];
    const courseAttempts = await getCollectionDocs(DatabaseCollections.CourseAttempt) as CourseAttemptDocument[];
    const brokenLinkReports = await getCollectionDocs(DatabaseCollections.ReportedCourse) as ReportedCourseDocument[];

    const userData = await Promise.all(userRecords.map((user: UserRecord) => {

        const role = user.customClaims?.developer ? "Developer" : user.customClaims?.admin ? "Administrator" : "Learner";

        const numEnrollments = enrollments.reduce((count, curr) => curr.userId === user.uid ? ++count : count, 0);
        const numAttempts = courseAttempts.reduce((count, curr) => curr.userId === user.uid ? ++count : count, 0);
        const numComplete = courseAttempts.reduce((count, curr) => curr.userId === user.uid && curr.pass === true ? ++count : count, 0);
        const numReports = brokenLinkReports.reduce((count, curr) => curr.userId === user.uid ? ++count : count, 0);

        return {
            'User ID': user.uid,
            'Name': user.displayName,
            'Email': user.email,
            'Role': role,
            'Account Disabled?': user.disabled ? "Yes" : "No",

            'Email Verified?': user.emailVerified ? "Yes" : "No",
            'Account creation time': user.metadata.creationTime?.replace(/,/g, ''),
            'Last login time': user.metadata.lastSignInTime?.replace(/,/g, ''),
            'Last refresh time': user.metadata.lastRefreshTime?.replace(/,/g, ''),

            'Number of courses enrolled': numEnrollments,
            'Number of courses started': numAttempts,
            'Number of courses completed': numComplete,
            'Number of active broken link reports': numReports,
        }
    }));

    return toCSV(userData.sort((a, b) => b['Number of courses enrolled'] - a['Number of courses enrolled']));
});

/**
 * Returns a list of statistics for a specific course on the platform:
 * -List of enrolled users
 *      -Status of completion
 *      -Quiz to be marked?
 * -Number of enrolled learners
 * -Number of learners who completed the course
 * -Average course completion time (not including quiz attempt(s))
 * -List of question fail rate amongst all the questions for a distribution
 */
const getCourseInsightReport = onCall(async (request) => {

    logger.info("Verifying user is an admin...");

    await verifyIsAdmin(request);

    logger.info("User is an admin, querying database for this course's report...");

    const schema = object({
        courseId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    const { courseId } = request.data;

    const courseData = await getDocData(DatabaseCollections.Course, courseId) as CourseDocument;

    const courseAttempts: CourseAttemptDocument[] = await getCollection(DatabaseCollections.CourseAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CourseAttemptDocument))
        .catch((error) => {
            logger.error(`Error querying course attempts: ${error}`);
            throw new HttpsError('internal', "Error getting this course insight report, please try again later")
        });

    // Use a Map to track the latest attempt for each userId
    const latestAttemptsByUser: Map<string, CourseAttemptDocument> = new Map();

    courseAttempts.forEach((attempt) => {
        const existingAttempt = latestAttemptsByUser.get(attempt.userId);
        if (!existingAttempt || attempt.startTime > existingAttempt.startTime) {
            latestAttemptsByUser.set(attempt.userId, attempt);
        }
    });

    // Convert the Map values back to an array
    const filteredAttempts: CourseAttemptDocument[] = Array.from(latestAttemptsByUser.values());

    // Fetch quiz attempts that need marking
    const markingStatusMap: Map<string, boolean> = new Map();

    // Fetch all QuizQuestionAttempts for the course
    const quizQuestionAttempts: QuizQuestionAttemptDocument[] = await getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => doc.data() as QuizQuestionAttemptDocument));

    quizQuestionAttempts.forEach((attempt) => {
        if (attempt.marksAchieved === null) {
            markingStatusMap.set(attempt.userId, true);
        }
    });

    // Fetch user details
    const userDetails: Map<string, { name: string }> = new Map();
    // @ts-ignore
    const users: UserDocument[] = await getCollection(DatabaseCollections.User)
        .get()
        .then((result) => result.docs.forEach(doc => {
            userDetails.set(doc.id, { name: doc.data().name });
        }));

    // Fetch active QuizQuestions for the course
    const quizQuestions: QuizQuestionDocument[] = await getCollection(DatabaseCollections.QuizQuestion)
        .where("courseId", "==", courseId)
        .get()
        .then(result => result.docs.map(doc => ({ id: doc.id, ...doc.data() }) as QuizQuestionDocument));

    const enrollments = await getCollectionDocs(DatabaseCollections.EnrolledCourse) as EnrolledCourseDocument[];

    const courseEnrollments = enrollments.filter((enrollment) => enrollment.courseId === courseId);

    const completedAttempts = courseAttempts.filter((attempt) => {
        return attempt.courseId === courseId && attempt.pass === true;
    });

    const completionTimes = completedAttempts.map((attempt) => {
        // @ts-ignore
        const milliseconds = attempt.endTime.toMillis() - attempt.startTime.toMillis();
        return Math.floor(milliseconds / 1000 / 60); // In minutes
    });
    const averageTime = completionTimes.length === 0 ? null : (1 / completionTimes.length) * completionTimes.reduce((a, b) => a + b, 0);


    // Fetch all QuizAttempts for the course
    const quizAttempts: QuizAttemptDocument[] = await getCollection(DatabaseCollections.QuizAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => ({ id: doc.id, ...doc.data() }) as QuizAttemptDocument));

    // Store the status of each course attempt
    const courseAttemptStatuses = new Map<string, number>();
    await Promise.all(filteredAttempts.map((courseAttempt) =>
        getCourseStatus(courseAttempt.courseId, courseAttempt.userId).then((status) => courseAttemptStatuses.set(courseAttempt.userId, status))
    ));


    // Combine data to create the courseLearners array
    const courseLearners = filteredAttempts.map((courseAttempt) => {
        const userName = userDetails.get(courseAttempt.userId)?.name || "Unknown User";

        const courseAttemptQuizzes = quizAttempts.filter((quizAttempt) => quizAttempt.courseAttemptId == courseAttempt.id);

        let latestQuizAttempt = courseAttemptQuizzes.reduce<QuizAttemptDocument | undefined>((latest, current) => {
            // If latest is null or undefined, or current has no endTime, current becomes the latest
            if (!latest || !current.endTime) {
                return current;
            }
            // If latest has no endTime, it remains as the latest
            if (!latest.endTime) {
                return latest;
            }
            // Compare endTime of latest and current to determine the latest
            return current.endTime > latest.endTime ? current : latest;
        }, undefined); // Start with undefined to ensure the first element is evaluated

        return {
            name: userName,
            userId: courseAttempt.userId,
            completionStatus: courseAttemptStatuses.get(courseAttempt.userId), // @ts-ignore
            quizAttemptId: latestQuizAttempt.id, // @ts-ignore
            quizAttemptTime: latestQuizAttempt.endTime.seconds,
        };
    });

    // Add total marks for short answers for front-end convenience
    const questionsWithStats = quizQuestions.map((question) => {
        if (question.type !== "sa") {
            return question;
        }

        // @ts-ignore
        const distributionValues = Object.keys(question.stats.distribution);
        let totalScore = 0;
        distributionValues.forEach((key: string) => { // @ts-ignore
            totalScore += question.stats.distribution[key] * Number(key);
        }); // @ts-ignore
        question.stats.totalScore = totalScore;
        return question;
    });

    // Combine all stats for the return array
    return {
        courseName: courseData.name,
        learners: courseLearners,
        questions: questionsWithStats,
        numEnrolled: courseEnrollments.length,
        numComplete: completedAttempts.length,
        avgTime: averageTime
    };
});

export { getCourseInsights, downloadCourseReports, getUserInsights, downloadUserReports, getCourseInsightReport };
