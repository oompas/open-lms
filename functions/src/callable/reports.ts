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
    UserDocument, getDocData, CourseDocument,
} from "../helpers/database";
import { object, string } from "yup";
import { CourseStatus } from "./helpers";
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

    logger.info(`Entering downloadCourseReports for user ${request.auth?.uid} with payload: ${JSON.stringify(request.data)}`)

    await verifyIsAdmin(request);

    const schema = object({}).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info(`Schema validation passed`);

    const tables: { courses: string, quizQuestions: string, courseAttempts: string, quizAttempts: string, quizQuestionAttempts: string } = {
        courses: '',
        quizQuestions: '',
        courseAttempts: '',
        quizAttempts: '',
        quizQuestionAttempts: '',
    };

    await Promise.all([ // @ts-ignore
        getCollectionDocs(DatabaseCollections.Course).then((result: CourseDocument[]) => {
            tables.courses = toCSV(result.map((course) => {
                return {
                    'Course ID': course.id,
                    'Name': course.name,
                    'Description': course.description,
                    'Link': course.link,
                    'Minimum course time (minutes)': course.minTime ?? "None",

                    'Active?': course.active ? "Yes" : "No",
                    'Creation time': course.creationTime?.toDate().toUTCString().replace(/,/g, ''),
                    'Retired?': course.retired?.toDate().toUTCString().replace(/,/g, '') ?? "No",
                    'Version': course.version,
                    'Creator user ID': course.userId,

                    'Has quiz?': course.quiz ? "Yes" : "No",
                    'Quiz max attempts': course.quiz?.maxAttempts ?? "Unlimited",
                    'Quiz min score': course.quiz?.minScore ?? "None",
                    'Quiz preserve order?': course.quiz?.preserveOrder ? "Yes" : "No",
                    'Quiz time limit (minutes)': course.quiz?.timeLimit ?? "Unlimited",
                };
            }));
        }), // @ts-ignore
        getCollectionDocs(DatabaseCollections.QuizQuestion).then((result: QuizQuestionDocument[]) => {
            tables.quizQuestions = toCSV(result.map((question) => {
                return {
                    'Question ID': question.id,
                    'Course ID': question.courseId,

                    'Question (commas removed)': question.question.replace(/,/g, ''),
                    'Type': question.type === "mc" ? "Multiple Choice" : question.type === "tf" ? "True/False" : "Short Answer",
                    'Answer options (mc/tf only)': question.answers ? JSON.stringify(question.answers).replace(/,/g, '') : null,
                    'Correct answer (mc/tf only)': (question.answers && question.correctAnswer) ? question.answers[question.correctAnswer] : null,
                    'Question stats': JSON.stringify(question.stats).replace(/,/g, ' '),
                };
            }));
        }), // @ts-ignore
        getCollectionDocs(DatabaseCollections.CourseAttempt).then((result: CourseAttemptDocument[]) => {
            tables.courseAttempts = toCSV(result.map((attempt) => {
                return {
                    'Attempt ID': attempt.id,
                    'Course ID': attempt.courseId,
                    'User ID': attempt.userId,

                    'Start time': attempt.startTime.toDate().toUTCString().replace(/,/g, ''),
                    'End time': attempt.endTime?.toDate().toUTCString().replace(/,/g, ''),
                    'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
                };
            }));
        }), // @ts-ignore
        getCollectionDocs(DatabaseCollections.QuizAttempt).then((result: QuizAttemptDocument[]) => {
            tables.quizAttempts = toCSV(result.map((attempt) => {
                return {
                    'Quiz attempt ID': attempt.id,
                    'Course ID': attempt.courseId,
                    'Course attempt ID': attempt.courseAttemptId,
                    'User ID': attempt.userId,

                    'Start time': attempt.startTime.toDate().toUTCString().replace(/,/g, ''),
                    'End time': attempt.endTime?.toDate().toUTCString().replace(/,/g, ''),
                    'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
                    'Score': attempt.score ? attempt.score : "Not marked",
                    'Expired (didn\'t submit in time)?': attempt.expired ? "Yes" : "No",
                };
            }));
        }), // @ts-ignore
        getCollectionDocs(DatabaseCollections.QuizQuestionAttempt).then((result: QuizQuestionAttemptDocument[]) => {
            tables.quizQuestionAttempts = toCSV(result.map((attempt) => {
                return {
                    'Quiz question attempt ID': attempt.id,
                    'Course ID': attempt.courseId,
                    'Question ID': attempt.questionId,
                    'User ID': attempt.userId,
                    'Course attempt ID': attempt.courseAttemptId,
                    'Quiz question ID': attempt.questionId,

                    'Response (commas removed, number for mc/tf)': typeof attempt.response === 'string' ? attempt.response.replace(/,/g, '') : attempt.response,
                    'Max marks': attempt.maxMarks,
                    'Marks achieved': attempt.marksAchieved ?? "Not marked",
                };
            }));
        }),
    ]);

    return tables;
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
    const { userRecords, enrollments, courseAttempts, brokenLinkReports } = await Promise.all([
        auth.listUsers().then((result) => result.users), // @ts-ignore
        getCollectionDocs(DatabaseCollections.EnrolledCourse).then((result) => result.map(doc => ({ userId: doc.userId }))), // @ts-ignore
        getCollectionDocs(DatabaseCollections.CourseAttempt).then((result) => result.map(doc => ({ userId: doc.userId, pass: doc.pass }))), // @ts-ignore
        getCollectionDocs(DatabaseCollections.ReportedCourse).then((result) => result.map(doc => ({ userId: doc.userId })))
    ]).then(([userRecords, enrollments, courseAttempts, brokenLinkReports]) => ({ userRecords, enrollments, courseAttempts, brokenLinkReports }));

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

    const schema = object({
        courseId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    const { courseId } = request.data;

    logger.info(`Schema verification passes`);

    const courseData = await getDocData(DatabaseCollections.Course, courseId) as CourseDocument;

    /**
     * Get all required data for this course: enroll users, user names, latest course attempts, quiz attempts, quiz questions
     */
    const courseEnrollments: string[] = await getCollection(DatabaseCollections.EnrolledCourse)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => doc.data().userId))
        .catch((error) => {
            logger.error(`Error querying course enrollments: ${error}`);
            throw new HttpsError('internal', "Error getting this course insight report, please try again later");
        });

    const userNames: Map<string, { name: string }> = new Map();
    await Promise.all(courseEnrollments.map((userId) => // @ts-ignore
        auth.getUser(userId).then((user) => userNames.set(userId, { name: user.displayName }))
    ));

    const latestCourseAttempts: Map<string, CourseAttemptDocument> = new Map();
    await getCollection(DatabaseCollections.CourseAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => {
            const attempt = { id: doc.id, ...doc.data() } as CourseAttemptDocument;
            const existingAttempt = latestCourseAttempts.get(attempt.userId);
            if (!existingAttempt || attempt.startTime > existingAttempt.startTime) { // @ts-ignore
                latestCourseAttempts.set(attempt.userId, attempt);
            }
        }))
        .catch((error) => {
            logger.error(`Error querying course attempts: ${error}`);
            throw new HttpsError('internal', "Error getting this course insight report, please try again later")
        });

    const latestQuizAttempts: Map<string, { id: string, pass: boolean | null, time: number }> = new Map();
    await getCollection(DatabaseCollections.QuizAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => {
            const attempt = { id: doc.id, ...doc.data() } as QuizAttemptDocument;
            const existingAttempt = latestQuizAttempts.get(attempt.userId);
            if (!existingAttempt || attempt.startTime.seconds > existingAttempt.time) {
                latestQuizAttempts.set(attempt.userId, { id: attempt.id, pass: attempt.pass, time: attempt.startTime.seconds });
            }
        }))
        .catch((error) => {
            logger.error(`Error querying quiz attempts: ${error}`);
            throw new HttpsError('internal', "Error getting this course insight report, please try again later");
        });

    const quizQuestions: QuizQuestionDocument[] = await getCollection(DatabaseCollections.QuizQuestion)
        .where("courseId", "==", courseId)
        .get()
        .then(result => result.docs.map(doc => ({ id: doc.id, ...doc.data() }) as QuizQuestionDocument))
        .catch((error) => {
            logger.error(`Error querying quiz questions: ${error}`);
            throw new HttpsError('internal', "Error getting this course insight report, please try again later");
        });

    /**
     * Build the required user data
     */
    const learnerData = courseEnrollments.map((userId) => {
        const courseAttempt = latestCourseAttempts.get(userId);
        if (!courseAttempt) {
            return {
                name: userNames.get(userId),
                userId: userId,
                status: CourseStatus.Enrolled,
                latestQuizAttemptId: null,
                latestQuizAttemptTime: null,
            };
        }

        let status;
        if (courseAttempt.pass === null) {
            const latestQuiz = latestQuizAttempts.get(userId);
            status = latestQuiz && latestQuiz.pass === null ? CourseStatus.AwaitingMarking : CourseStatus.InProgress;
        } else if (courseAttempt.pass === false) {
            status = CourseStatus.Failed;
        } else if (courseAttempt.pass === true) {
            status = CourseStatus.Passed;
        } else {
            throw new HttpsError("internal", `Course is in an invalid state - can't get status`);
        }

        const latestQuiz = latestQuizAttempts.get(userId) ?? null;

        return {
            name: userNames.get(userId),
            userId: userId,
            status: status,
            latestQuizAttemptId: latestQuiz?.id ?? null,
            latestQuizAttemptTime: latestQuiz?.time ?? null,
        };
    });

    const latestCoursesArray = Array.from(latestCourseAttempts.values());
    const averageTime = !latestCoursesArray.length ? null : latestCoursesArray
        .filter((attempt) => attempt.endTime) // @ts-ignore
        .reduce((total, attempt) => total + (attempt.endTime.seconds - attempt.startTime.seconds), 0) / latestCoursesArray.length;

    return {
        courseName: courseData.name,
        learners: learnerData,
        questions: quizQuestions,
        numEnrolled: courseEnrollments.length,
        numStarted: latestCourseAttempts.size,
        numComplete: latestCoursesArray.reduce((count, attempt) => attempt.pass === true ? ++count : count, 0),
        avgTime: averageTime
    };
});

export { getCourseInsights, downloadCourseReports, getUserInsights, downloadUserReports, getCourseInsightReport };
