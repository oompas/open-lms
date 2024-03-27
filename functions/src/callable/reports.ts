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

interface CourseAttempt {
    courseId: string;
    endTime: Date;
    pass: boolean | null;
    startTime: Date;
    userId: string;
}

interface QuizQuestionAttempt {
    courseId: string;
    marksAchieved: boolean;
    questionId: string;
    quizAttemptId: string;
    response: string;
    userId: string;
}

interface QuizQuestion {
    active: boolean;
    courseId: string;
    marks: number;
    question: string;
    stats: {
        numAttempts: number,
        totalScore: number,
    };
    type: string;
}

interface EnrolledCourse {
    courseId: string;
    userId: string;
}

type courseLearner = {
    name: string;
    completionStatus: boolean;
    markingStatus: boolean;
};

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

    const courseId = request.data.courseId;

    if (!courseId) {
        throw new HttpsError('invalid-argument', "courseId is required");
    }

    const courseAttempts: CourseAttempt[] = await getCollection(DatabaseCollections.CourseAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => doc.data() as CourseAttempt))
        .catch((error) => {
            logger.error(`Error querying course attempts: ${error}`);
            throw new HttpsError('internal', "Error getting this course insight report, please try again later")
        });

    // Use a Map to track the latest attempt for each userId
    const latestAttemptsByUser: Map<string, CourseAttempt> = new Map();

    courseAttempts.forEach((attempt) => {
        const existingAttempt = latestAttemptsByUser.get(attempt.userId);
        if (!existingAttempt || attempt.startTime > existingAttempt.startTime) {
            latestAttemptsByUser.set(attempt.userId, attempt);
        }
    });

    // Convert the Map values back to an array
    const filteredAttempts: CourseAttempt[] = Array.from(latestAttemptsByUser.values());

    // Fetch quiz attempts that need marking
    const markingStatusMap: Map<string, boolean> = new Map();

    // Fetch all QuizQuestionAttempts for the course
    const quizQuestionAttempts: QuizQuestionAttempt[] = await getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => doc.data() as QuizQuestionAttempt));

    quizQuestionAttempts.forEach((attempt) => {
        if (attempt.marksAchieved === null) {
            markingStatusMap.set(attempt.userId, true);
        }
    });

    // Fetch user details
    const userDetails: Map<string, { name: string }> = new Map();
    const users = await getCollection(DatabaseCollections.User).get()
        .then((result) => result.docs.forEach(doc => {
            userDetails.set(doc.id, { name: doc.data().name });
        }));

    // Fetch active QuizQuestions for the course
    const quizQuestions: QuizQuestion[] = await getCollection(DatabaseCollections.QuizQuestion)
        .where("courseId", "==", courseId)
        .where("active", "==", true)
        .get()
        .then(result => result.docs.map(doc => doc.data() as QuizQuestion));

    // Map to store question texts
    let questionTexts: string[] = quizQuestions.map(question => question.question);

    // Prepare to calculate average marks and match responses
    let questionStats: { [questionId: string]: { marks: number, averageMarksAchieved: number, numAttempts: number, totalScore: number } } = {};
    quizQuestions.forEach(question => {
        questionStats[question.questionId] = { marks: question.marks, averageMarksAchieved: 0, numAttempts: 0, totalScore: 0 };
    });
    // TODO: ^ how would I get the questionId (aka doc id) for the QuizQuestion?

    // Process quiz question attempts
    quizQuestionAttempts.forEach(attempt => {
        if (questionStats[attempt.questionId]) {
            questionStats[attempt.questionId].numAttempts += 1;
            if (attempt.marksAchieved !== null) {
                questionStats[attempt.questionId].totalScore += attempt.marksAchieved ? 1 : 0;
            }
        }
    });

    // Calculate averages
    Object.keys(questionStats).forEach(questionId => {
        const stat = questionStats[questionId];
        stat.averageMarksAchieved = stat.numAttempts > 0 ? (stat.totalScore / stat.numAttempts) * stat.marks : 0;
    });

    const enrollments = await getCollection(DatabaseCollections.EnrolledCourse)
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying enrollments: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    const courseEnrollments = enrollments.filter((enrollment) => enrollment.data().courseId === course.id);

    // TODO: need to figure out the .data() error on the completedAttempts and completionTimes consts
    const completedAttempts = courseAttempts.filter((attempt) => {
        return attempt.data().courseId === courseId && attempt.data().pass === true;
    });

    const completionTimes = completedAttempts.map((attempt) => {
        const milliseconds = attempt.data().endTime.toMillis() - attempt.data().startTime.toMillis();
        return Math.floor(milliseconds / 1000 / 60); // In minutes
    });
    const averageTime = completionTimes.length === 0 ? null : (1 / completionTimes.length) * completionTimes.reduce((a, b) => a + b, 0);

    // Combine data to create the courseLearners array
    const courseLearners = filteredAttempts.map((attempt) => {
        const completionStatus = attempt.pass;
        const markingStatus = markingStatusMap.get(attempt.userId) || false;
        const userName = userDetails.get(attempt.userId)?.name || "Unknown User";

        return {
            name: userName,
            completionStatus: completionStatus,
            markingStatus: markingStatus,
        };
    });

    // Combine all stats into the finalReport array
    const finalReport = {
        learners: courseLearners,
        questions: questionTexts,
        questionStats: Object.values(questionStats).map(stat => ({
            marks: stat.marks,
            averageMarksAchieved: stat.averageMarksAchieved.toFixed(2)
        })),
        numEnrolled: courseEnrollments.length,
        numComplete: completedAttempts.length,
        avgTime: averageTime
    };
    // TODO: add in

    return finalReport;

    // Need to account for the course statuses as follows:
    // Status 1: not enrolled in course [courseEnrolled doesn't exist]
    // Status 2: enrolled, not started [courseAttempt is null]
    // Status 3: in progress [pass is null]
    // Status 4: completed, failed [pass is false]
    // Status 5: completed, passed [pass is true]
});

export { getUserReports, getCourseReports, getCourseInsightReport };
