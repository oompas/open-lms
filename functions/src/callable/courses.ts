import {HttpsError, onCall} from "firebase-functions/v2/https";
import {
    sendEmail,
    shuffleArray,
    verifyIsAdmin,
    verifyIsAuthenticated
} from "../helpers/helpers";
import { logger } from "firebase-functions";
import { boolean, number, object, string } from 'yup';
import { firestore } from "firebase-admin";
import {
    addDoc, addDocWithId, CourseAttemptDocument,
    CourseDocument,
    DatabaseCollections, deleteDoc, docExists,
    getCollection,
    getDocData, QuizAttemptDocument,
    updateDoc, UserDocument,
} from "../helpers/database";

/**
 * The ID for an enrolled course is the user & course ID concatenated so:
 * -No query is needed to check it, can just get the document through an ID
 * -No duplicate enrollments are possible
 * The enrollment document will also have these IDs in the document if individual queries are needed
 */
const enrolledCourseId = (userId: string, courseId: string) => `${userId}|${courseId}`;

/**
 * The ID for a course reported by a user to have a broken platform link is the user & course ID concatenated so:
 * - No duplicate reports from the same user
 */
const reportedCourseId = (userId: string, courseId: string) => `${userId}|${courseId}`;

/**
 * Adds a course to the database. Includes both metadata and quiz questions
 */
const addCourse = onCall(async (request) => {

    logger.info(`Entering addCourse for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    logger.info("Administrative permission verification passed");

    const schema = object({
        name: string().required().min(1, "Name must be non-empty").max(50, "Name can't be over 50 characters long"),
        description: string().required().min(1, "Description must be non-empty").max(500, "Description can't be over 500 characters long"),
        link: string().url().required(),
        minTime: number().integer().positive().nullable(),
        quiz: object({
            minScore: number().integer().positive().nullable(),
            maxAttempts: number().integer().positive().nullable(),
            timeLimit: number().integer().positive().nullable(),
            preserveOrder: boolean().nullable(),
        }).nullable().noUnknown(true),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    return addDoc(DatabaseCollections.Course, { userID: uid, active: false, ...request.data });
});

/**
 * Publishes or unpublishes the course with the given ID (set 'active' to true/false)
 */
const setCourseVisibility = onCall(async (request) => {

        logger.info(`Entering publishCourse for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

        await verifyIsAdmin(request);

        logger.info("Administrative permission verification passed");

        const schema = object({
            courseId: string().required(),
            active: boolean().required(),
        }).required().noUnknown(true);

        await schema.validate(request.data, { strict: true })
            .catch((err) => {
                logger.error(`Error validating request: ${err}`);
                throw new HttpsError('invalid-argument', err);
            });

        logger.info("Schema verification passed");

        return updateDoc(DatabaseCollections.Course, request.data.courseId, { active: request.data.active });
});

/**
 * Updates an existing course's data (excluding quiz questions)
 */
const updateCourse = onCall(async (request) => {

    logger.info(`Entering updateCourse for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    logger.info("Administrative permission verification passed");

    const schema = object({
        courseId: string().required(),
        name: string().optional().min(1, "Name must be non-empty").max(50, "Name can't be over 50 characters long"),
        description: string().optional().min(1, "Description must be non-empty").max(500, "Description can't be over 500 characters long"),
        link: string().url().optional(),
        minTime: number().integer().positive().optional(),
        quiz: object({
            minScore: number().integer().positive().optional(),
            maxAttempts: number().integer().positive().optional(),
            timeLimit: number().integer().positive().optional(),
            preserveOrder: boolean().optional(),
        }).optional().noUnknown(true)
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const courseId = request.data.courseId;
    delete request.data.courseId; // Don't need id in document
    return updateDoc(DatabaseCollections.Course, courseId, request.data);
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
    const uid: string = request.auth.uid;

    return getCollection(DatabaseCollections.Course)
        .where("active", "==", true)
        .get()
        .then(async (courses) => {

            const allCourses = [];

            for (let course of courses.docs) {

                const courseEnrolled = await docExists(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, course.id));

                let courseAttempt = undefined;
                if (courseEnrolled) {
                    courseAttempt = await getCollection(DatabaseCollections.CourseAttempt)
                        .where("userId", "==", request.auth?.uid)
                        .where("courseId", "==", course.id)
                        .get()
                        .then((docs) => {
                            if (docs.empty) {
                                return null;
                            }

                            let latestAttempt = docs.docs[0];
                            for (let i = 1; i < docs.docs.length; ++i) {
                                if (docs.docs[i].data().startTime.toMillis() > latestAttempt.data().startTime.toMillis()) {
                                    latestAttempt = docs.docs[i];
                                }
                            }
                            return { id: latestAttempt.id, ...latestAttempt.data() } as CourseAttemptDocument;
                        })
                        .catch((error) => {
                            logger.error(`Error getting course attempts: ${error}`);
                            throw new HttpsError("internal", `Error getting courses, please try again later`);
                        });
                }

                /*
                 * Statuses:
                 * 1 - Not enrolled
                 * 2 - Enrolled, not started
                 * 3 - In progress (includes if you previously failed a quiz)
                 * 4 - Quiz awaiting marking
                 * 5 - Failed
                 * 6 - Passed
                 */
                let status;
                if (!courseEnrolled) {
                    status = 1;
                } else if (courseAttempt === null ) {
                    status = 2;
                } else if (courseAttempt?.pass === null) {
                    const awaitingMarking = await getCollection(DatabaseCollections.QuizAttempt)
                        .where("courseAttemptId", "==", courseAttempt.id)
                        .where("endTime", "!=", null)
                        .where("pass", "==", null)
                        .get()
                        .then((docs) => !docs.empty)
                        .catch((error) => {
                            logger.error(`Error checking if quiz is awaiting marking: ${error}`);
                            throw new HttpsError('internal', "Error getting course quiz, please try again later");
                        });

                    status = awaitingMarking ? 4 : 3;
                } else if (courseAttempt?.pass === false) {
                    status = 5;
                } else if (courseAttempt?.pass === true) {
                    status = 6;
                } else {
                    throw new HttpsError("internal", "Course is in an invalid state - can't get status");
                }

                const courseData = {
                    id: course.id,
                    name: course.data().name,
                    description: course.data().description,
                    status: status,
                    minTime: course.data().minTime,
                    maxQuizTime: course.data().quiz !== null ? course.data().quiz.timeLimit : null
                };

                allCourses.push(courseData);
            }

            return allCourses;
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
const getCourseInfo = onCall(async (request) => {

    logger.info(`Entering getCourseInfo for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    const schema = object({
        courseId: string().required().length(20),
        withQuiz: boolean().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const courseInfo = await getDocData(DatabaseCollections.Course, request.data.courseId) as CourseDocument;

    /**
     * withQuiz is for the course editor, so it returns the quiz data (including answers, so admin-only).
     * Otherwise, it returns the course with the status and start time for the requesting user (course page)
     */
    if (request.data.withQuiz) {

        await verifyIsAdmin(request); // This returns quiz answers for course editing, so admin-only

        let quizQuestions = null;
        if (courseInfo.quiz) {
            quizQuestions = await getCollection(DatabaseCollections.QuizQuestion)
                .where("courseId", "==", request.data.courseId)
                .where("active", "==", true)
                .get()
                .then((docs) => shuffleArray(docs.docs.map((doc) => {
                    const data = doc.data();
                    const question: any = {
                        id: doc.id,
                        type: data.type,
                        question: data.question,
                        marks: data.marks
                    };
                    if (data.type === "mc") {
                        question["answers"] = data.answers;
                        question["correctAnswer"] = data.correctAnswer;
                    }
                    if (data.type === "tf") {
                        question["correctAnswer"] = data.correctAnswer;
                    }

                    return question;
                })))
                .catch((error) => {
                    logger.error(`Error checking if course has quiz questions: ${error}`);
                    throw new HttpsError('internal', "Error getting course quiz, please try again later");
                });
        }

        return {
            courseId: request.data.courseId,
            active: courseInfo.active,
            name: courseInfo.name,
            description: courseInfo.description,
            link: courseInfo.link,
            minTime: courseInfo.minTime,
            quiz: courseInfo.quiz,
            quizQuestions: quizQuestions,
        };
    }

    if (!courseInfo.active) {
        throw new HttpsError("invalid-argument", "Cannot view inactive course");
    }

    const courseAttempt = await getCollection(DatabaseCollections.CourseAttempt)
        .where("userId", "==", request.auth?.uid)
        .where("courseId", "==", request.data.courseId)
        .get()
        .then((docs) => {
            if (docs.empty) {
                return null;
            }

            let latestAttempt = docs.docs[0];
            for (let i = 1; i < docs.docs.length; ++i) {
                if (docs.docs[i].data().startTime.toMillis() > latestAttempt.data().startTime.toMillis()) {
                    latestAttempt = docs.docs[i];
                }
            }
            return { id: latestAttempt.id, ...latestAttempt.data() } as CourseAttemptDocument;
    })
        .catch((error) => {
            logger.error(`Error getting course attempts: ${error}`);
            throw new HttpsError("internal", `Error getting courses, please try again later`);
        });

    const courseEnrolled = await docExists(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, request.data.courseId));

    const quizAttempts = await getCollection(DatabaseCollections.QuizAttempt)
        .where("userId", "==", request.auth?.uid)
        .where("courseId", "==", request.data.courseId)
        .get()
        .then((docs) => {
            return docs.docs.map((doc) => ({ id: doc.id, ...doc.data() } as QuizAttemptDocument));
        })
        .catch((error) => {
            logger.error(`Error getting quiz attempts: ${error}`);
            throw new HttpsError("internal", `Error getting courses, please try again later`);
        });

    /*
     * Statuses:
     * 1 - Not enrolled
     * 2 - Enrolled, not started
     * 3 - In progress (includes if you previously failed a quiz)
     * 4 - Quiz awaiting marking
     * 5 - Failed
     * 6 - Passed
     *
     * TODO: Make this a helper and use enums (getAvailableCourses has the same statuses)
     */
    let status;
    if (!courseEnrolled) {
        status = 1;
    } else if (courseAttempt === null ) {
        status = 2;
    } else if (courseAttempt?.pass === null) {
        const awaitingMarking = await getCollection(DatabaseCollections.QuizAttempt)
            .where("courseAttemptId", "==", courseAttempt.id)
            .where("endTime", "!=", null)
            .where("pass", "==", null)
            .get()
            .then((docs) => !docs.empty)
            .catch((error) => {
                logger.error(`Error checking if quiz is awaiting marking: ${error}`);
                throw new HttpsError('internal', "Error getting course quiz, please try again later");
            });

        status = awaitingMarking ? 4 : 3;
    } else if (courseAttempt?.pass === false) {
        status = 5;
    } else if (courseAttempt?.pass === true) {
        status = 6;
    } else {
        throw new HttpsError("internal", "Course is in an invalid state - can't get status");
    }

    let numQuizQuestions;
    if (courseInfo.quiz) {
        numQuizQuestions = await getCollection(DatabaseCollections.QuizQuestion)
            .where("courseId", "==", request.data.courseId)
            .where("active", "==", true)
            .get()
            .then((docs) => docs.size)
            .catch((error) => {
                logger.error(`Error getting number of quiz questions: ${error}`);
                throw new HttpsError('internal', "Error getting course quiz, please try again later");
            });
    }

    logger.info("Data queries passed, returning course info...");

    return {
        courseId: request.data.courseId,
        name: courseInfo.name,
        description: courseInfo.description,
        link: courseInfo.link,
        minTime: courseInfo.minTime,
        quiz: courseInfo.quiz ? { numQuestions: numQuizQuestions, ...courseInfo.quiz } : null,
        status: status,
        startTime: courseAttempt?.startTime.seconds ?? null,
        currentQuiz: quizAttempts.find((attempt) => !attempt.endTime) ?? null,
        courseAttemptId: courseAttempt?.id ?? null,
    };
});

/**
 * Enrolls the requesting user in the specified course
 */
const courseEnroll = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    const schema = object({
        courseId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    await getDocData(DatabaseCollections.Course, request.data.courseId);

    return addDocWithId(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, request.data.courseId), { userId: uid, courseId: request.data.courseId });
});

/**
 * Unenrolls the requesting user from the specified course
 */
const courseUnenroll = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    const schema = object({
        courseId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    return deleteDoc(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, request.data.courseId));
});

/**
 * The requesting users starts a course attempt
 */
const startCourse = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    const schema = object({
        courseId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    // Verify the user is enrolled in the course
    await getDocData(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, request.data.courseId));

    const courseAttempt = {
        userId: request.auth?.uid,
        courseId: request.data.courseId,
        startTime: firestore.FieldValue.serverTimestamp(),
        endTime: null,
        pass: null,
    }

    return addDoc(DatabaseCollections.CourseAttempt, courseAttempt);
});

/**
 * Reports the course link as broken by the requested user in the specified course
 */
const sendBrokenLinkReport = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    // Ensure a valid course ID is passed in
    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to enroll in");
    }

    await getDocData(DatabaseCollections.Course, request.data.courseId);

    return addDocWithId(DatabaseCollections.ReportedCourse, reportedCourseId(uid, request.data.courseId), { userId: uid, courseId: request.data.courseId });
});

/**
 * Sends feedback for a course to the course creator
 */
const sendCourseFeedback = onCall(async (request) => {

    verifyIsAuthenticated(request);

    const schema = object({
        courseId: string().required(),
        feedback: string().required().min(1, "Feedback must be non-empty").max(1000, "Feedback can't be over 1000 characters long"),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    // @ts-ignore
    const uid: string = request.auth.uid;

    const userInfo = await getDocData(DatabaseCollections.User, uid) as UserDocument;

    const courseInfo = await getDocData(DatabaseCollections.Course, request.data.courseId) as CourseDocument;
    const courseCreator = await getDocData(DatabaseCollections.User, courseInfo.userId) as UserDocument;

    const subject = `Open LMS user feedback for course ${courseInfo.name}`;
    const content = `User ${userInfo.name} (email: ${userInfo.email} uid: ${uid}) has sent the following feedback for the course 
                                ${courseInfo.name}:<br/> ${request.data.feedback}`;
    return sendEmail(courseCreator.email, subject, content, "sending course feedback");
});

export { addCourse, setCourseVisibility, updateCourse, getAvailableCourses, getCourseInfo, courseEnroll,
    courseUnenroll, startCourse, sendBrokenLinkReport, sendCourseFeedback };
