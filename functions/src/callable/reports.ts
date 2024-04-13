import { HttpsError, onCall } from "firebase-functions/v2/https";
import { verifyIsAdmin } from "../helpers/helpers";
import { logger } from "firebase-functions";
import {
    CourseAttemptDocument,
    DatabaseCollections,
    getCollection,
    QuizAttemptDocument,
    QuizQuestionDocument,
    getDocData,
    CourseDocument
} from "../helpers/database";
import { object, string } from "yup";
import { CourseStatus } from "./helpers";
import { auth } from "../helpers/setup";
import { UserRecord } from "firebase-admin/lib/auth";
import EnrolledCourse from "../database/EnrolledCourse";
import CourseAttempt from "../database/CourseAttempt";
import User from "../database/User";
import QuizQuestion from "../database/QuizQuestion";
import QuizAttempt from "../database/QuizAttempt";
import Course from "../database/Course";
import QuizQuestionAttempt from "../database/QuizQuestionAttempt";

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
 * Returns admin insights:
 * -Quizzes to mark
 * -Course insights
 * -Learner insights
 * -Admin insights
 */
const getAdminInsights = onCall(async (request) => {

    logger.info(`Entering getAdminInsights for user ${request.auth?.uid} with payload: ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);
    
    const schema = object({}).required().noUnknown(true);
    
    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("User is an admin, querying database for course reports...");

    const courses = await getCollection(DatabaseCollections.Course)
        .where("active", "==", true)
        .get()
        .then((result) => result.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseDocument)))
        .catch((error) => {
            logger.error(`Error querying courses: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    const users = await User.getAllDocs();
    const enrollments = await EnrolledCourse.getAllDocs();
    const quizAttempts = await QuizAttempt.getAllDocs();
    const courseAttempts = await CourseAttempt.getAllDocs();

    logger.info("Successfully queried database collections");

    const quizAttemptsToMark = quizAttempts
        .filter((attempt) => attempt.score === null && attempt.endTime!== null)
        .map((quizAttempt) => {
            const userName = users.find((user) => user.getId() === quizAttempt.userId)?.name;
            const courseName = courses.find((course) => course.id === quizAttempt.courseId)?.name;

            return {
                courseId: quizAttempt.courseId,
                courseName: courseName,
                userId: quizAttempt.userId,
                userName: userName,
                quizAttemptId: quizAttempt.getId(),
                timestamp: Math.floor(quizAttempt.endTime?.seconds ?? 0),
            };
        });

    const courseInsights = courses.map((course) => {

        const courseEnrollments = enrollments.filter((enrollment) => enrollment.courseId === course.id);

        const completedAttempts = courseAttempts.filter((attempt) => attempt.courseId === course.id && attempt.pass === true);

        const completionTimes: number[] = completedAttempts.map((attempt) => {
            const seconds = (attempt.endTime?.seconds ?? 0) - attempt.startTime.seconds;
            return Math.floor(seconds / 60); // In minutes
        });
        let averageTime = null;
        if (completionTimes.length > 0) {
            averageTime = Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length * 10) / 10;
        }

        const quizScores: number[] = quizAttempts
            .filter((attempt) => attempt.courseId === course.id && attempt.pass === true)
            .map((attempt) => {
                if (attempt.score === null) {
                    throw new HttpsError('internal', `Completed quiz attempt (${attempt.getId()}) score is null`);
                }
                return attempt.score as number;
            });
        let averageScore = null;
        if (quizScores.length > 0 && course.quiz) {
            const totalQuizMarks = course.quiz.totalMarks;
            const totalScore = quizScores.reduce((total, curr) => total + curr, 0);

            averageScore = Math.round((totalScore / quizScores.length / totalQuizMarks) * 100 * 10) / 10;
        }

        return {
            courseId: course.id,
            name: course.name,
            numEnrolled: courseEnrollments.length,
            numComplete: completedAttempts.length,
            avgTime: averageTime,
            avgQuizScore: averageScore,
        };
    }).sort((a, b) => b.numEnrolled - a.numEnrolled);

    const learners = users.filter((user) => !user.admin && !user.developer).map((user) => {

        const numEnrollments = enrollments.reduce((count, enrollment) => enrollment.userId === user.getId() ? ++count : count, 0);
        const numAttempts = courseAttempts.reduce((count, attempt) => attempt.userId === user.getId() ? ++count : count, 0);
        const numComplete = courseAttempts.reduce((count, attempt) => attempt.userId === user.getId() && attempt.pass === true ? ++count : count, 0);

        return {
            uid: user.getId(),
            name: user.name,
            email: user.email,
            role : "Learner",
            coursesEnrolled: numEnrollments,
            coursesAttempted: numAttempts,
            coursesComplete: numComplete,
        };
    }).sort((a, b) => b.coursesEnrolled - a.coursesEnrolled);

    const admins = users.filter((user) => user.admin || user.developer).map((user) => {

        const numCoursesCreated = courses.reduce((count, course) => course.userId === user.getId() ? ++count : count, 0);
        const numCoursesPublished = courses.reduce((count, course) => course.userId === user.getId() && course.active ? ++count : count, 0);

        return {
            uid: user.getId(),
            name: user.name,
            email: user.email,
            role: user.developer ? "Developer" : "Administrator",
            coursesCreated: numCoursesCreated,
            coursesPublished: numCoursesPublished,
        };
    });

    return {
        quizAttemptsToMark,
        courseInsights,
        learners,
        admins,
    };
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

    await Promise.all([
        Course.getAllDocs().then((result: Course[]) => {
            tables.courses = toCSV(result.map((c) => {
                const course = c.getObject();
                return {
                    'Course ID': course.id,
                    'Name': course.name,
                    'Description': course.description,
                    'Link': course.link,
                    'Minimum course time (minutes)': course.minTime ?? "None",

                    'Active?': course.active ? "Yes" : "No",
                    'Creation time': course.creationTime.toDate().toUTCString().replace(/,/g, ''),
                    'Retired?': course.retired ? course.retired.toDate().toUTCString().replace(/,/g, '') : "No",
                    'Version': course.version,
                    'Creator user ID': course.userId,

                    'Has quiz?': course.quiz ? "Yes" : "No",
                    'Quiz max attempts': course.quiz?.maxAttempts ?? "Unlimited",
                    'Quiz min score': course.quiz?.minScore ?? "None",
                    'Quiz preserve order?': course.quiz?.preserveOrder ? "Yes" : "No",
                    'Quiz time limit (minutes)': course.quiz?.timeLimit ?? "Unlimited",
                };
            }));
        }),
        QuizQuestion.getAllDocs().then((result: QuizQuestion[]) => {
            tables.quizQuestions = toCSV(result.map((q) => {
                const question = q.getObject();
                if (question.type === "tf") question.answers = ["True", "False"];
                return {
                    'Question ID': question.id,
                    'Course ID': question.courseId,

                    'Question (commas removed)': question.question.replace(/,/g, ''),
                    'Type': question.type === "mc" ? "Multiple Choice" : question.type === "tf" ? "True/False" : "Short Answer",
                    'Answer options (mc/tf only)': question.answers ? JSON.stringify(question.answers).replace(/,/g, ' ') : null,
                    'Correct answer (mc/tf only)': (question.answers && question.correctAnswer) ? question.answers[question.correctAnswer] : null,
                    'Question stats': JSON.stringify(question.stats).replace(/,/g, ' '),
                };
            }));
        }),
        CourseAttempt.getAllDocs().then((result: CourseAttempt[]) => {
            tables.courseAttempts = toCSV(result.map((a) => {
                const attempt = a.getObject();
                return {
                    'Attempt ID': attempt.id,
                    'Course ID': attempt.courseId,
                    'User ID': attempt.userId,

                    'Start time': attempt.startTime.toDate().toUTCString().replace(/,/g, ''),
                    'End time': attempt.endTime ? attempt.endTime.toDate().toUTCString().replace(/,/g, '') : null,
                    'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
                };
            }));
        }),
        QuizAttempt.getAllDocs().then((result: QuizAttempt[]) => {
            tables.quizAttempts = toCSV(result.map((a) => {
                const attempt = a.getObject();
                return {
                    'Quiz attempt ID': attempt.id,
                    'Course ID': attempt.courseId,
                    'Course attempt ID': attempt.courseAttemptId,
                    'User ID': attempt.userId,

                    'Start time': attempt.startTime.toDate().toUTCString().replace(/,/g, ''),
                    'End time': attempt.endTime ? attempt.endTime.toDate().toUTCString().replace(/,/g, '') : null,
                    'Pass?': attempt.pass === true ? "Passed" : attempt.pass === false ? "Failed" : "Not completed",
                    'Score': attempt.score ? attempt.score : "Not marked",
                };
            }));
        }),
        QuizQuestionAttempt.getAllDocs().then((result: QuizQuestionAttempt[]) => {
            tables.quizQuestionAttempts = toCSV(result.map((a) => {
                const attempt = a.getObject();
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
    const { userRecords, enrollments, courseAttempts } = await Promise.all([
        auth.listUsers().then((result) => result.users),
        EnrolledCourse.getAllDocs().then((result) => result.map(doc => ({ userId: doc.userId }))),
        CourseAttempt.getAllDocs().then((result) => result.map(doc => ({ userId: doc.userId, pass: doc.pass }))),
    ]).then(([userRecords, enrollments, courseAttempts]) => ({ userRecords, enrollments, courseAttempts }));

    const userData = await Promise.all(userRecords.map((user: UserRecord) => {

        const role = user.customClaims?.developer ? "Developer" : user.customClaims?.admin ? "Administrator" : "Learner";

        const numEnrollments = enrollments.reduce((count, curr) => curr.userId === user.uid ? ++count : count, 0);
        const numAttempts = courseAttempts.reduce((count, curr) => curr.userId === user.uid ? ++count : count, 0);
        const numComplete = courseAttempts.reduce((count, curr) => curr.userId === user.uid && curr.pass === true ? ++count : count, 0);

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

    const userNames: Map<string, string> = new Map();
    await Promise.all(courseEnrollments.map((userId) =>
        auth.getUser(userId).then((user) => userNames.set(userId, user.displayName as string))
    ));

    const latestCourseAttempts: Map<string, CourseAttemptDocument> = new Map();
    await getCollection(DatabaseCollections.CourseAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => {
            const attempt = { id: doc.id, ...doc.data() } as CourseAttemptDocument;
            const existingAttempt = latestCourseAttempts.get(attempt.userId);
            if (!existingAttempt || attempt.startTime > existingAttempt.startTime) {
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
    const averageTime = !latestCoursesArray.length ? null : Math.floor(latestCoursesArray
        .reduce((total, attempt) => total + (attempt.endTime?.seconds ?? 0 - attempt.startTime.seconds), 0) / latestCoursesArray.length);

    return {
        courseName: courseData.name,
        learners: learnerData,
        questions: quizQuestions,
        numEnrolled: courseEnrollments.length,
        numStarted: latestCourseAttempts.size,
        numComplete: latestCoursesArray.reduce((count, attempt) => attempt.pass === true ? ++count : count, 0),
        avgTime: averageTime, // In seconds
    };
});

export { getAdminInsights, downloadCourseReports, downloadUserReports, getCourseInsightReport };
