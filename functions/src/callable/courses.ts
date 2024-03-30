import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
    sendEmail,
    shuffleArray,
    verifyIsAdmin,
    verifyIsAuthenticated
} from "../helpers/helpers";
import { logger } from "firebase-functions";
import { array, boolean, number, object, string } from 'yup';
import { firestore } from "firebase-admin";
import {
    addDoc,
    addDocWithId,
    deleteDoc,
    getCollection,
    getDocData,
    updateDoc,
    CourseDocument,
    DatabaseCollections,
    QuizAttemptDocument,
    UserDocument,
    docExists
} from "../helpers/database";
import { enrolledCourseId, getCourseStatus, getLatestCourseAttempt } from "./helpers";

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
        previousVersionId: string().optional(),
        name: string().required().min(1, "Name must be non-empty").max(50, "Name can't be over 50 characters long"),
        description: string().required().min(1, "Description must be non-empty").max(500, "Description can't be over 500 characters long"),
        link: string().url().required(),
        minTime: number().integer().positive().nullable(),
        quiz: object({
            minScore: number().integer().positive().required(),
            maxAttempts: number().integer().positive().nullable(),
            timeLimit: number().integer().positive().nullable(),
            preserveOrder: boolean().required(),
        }).nullable().noUnknown(true),
        quizQuestions: array().of(
            object({
                question: string().min(1).max(500).required(),
                type: string().oneOf(["mc", "tf", "sa"]).required(),
                marks: number().required().min(1).max(20),
                answers: array().of(string()).min(2).max(5).optional(),
                correctAnswer: number().optional(),
            }).noUnknown(true)
        ).nullable(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const { quiz, quizQuestions } = request.data;

    if ((quiz && !quizQuestions) || (!quiz && quizQuestions)) {
        throw new HttpsError('invalid-argument', "Quiz questions must be provided with quiz metadata");
    }

    const totalMarks: number = !quizQuestions ? 0 : quizQuestions.reduce((total: number, question: { marks: number }) => total + question.marks, 0);
    if (quiz?.minScore) {
        if (quiz.minScore > totalMarks) {
            throw new HttpsError('invalid-argument', `Minimum score (${request.data.quiz.minScore}) must be less than or equal to the total` +
                ` marks available (${totalMarks})`);
        }
    }

    // Validate quiz questions
    quizQuestions && quizQuestions.forEach((question: any) => {
        let keys;
        if (question.type === "mc") {
            keys = ["question", "type", "answers", "correctAnswer", "marks"];
        } else if (question.type === "tf") {
            keys = ["question", "type", "correctAnswer", "marks"];
        } else if (question.type === "sa") {
            keys = ["question", "type", "marks"];
        } else {
            throw new HttpsError(
                "invalid-argument",
                `Invalid request: question ${JSON.stringify(question)} is invalid; 'type' must be one of 'mc', 'tf', or 'sa'`
            );
        }

        const properties = Object.keys(question);
        if (!keys.every((key) => properties.includes(key)) || properties.length !== keys.length) {
            throw new HttpsError(
                "invalid-argument",
                `Invalid request: question ${JSON.stringify(question)} is invalid; must include the following keys: ${keys.join(", ")}`
            );
        }
    });

    let version = 1;
    if (request.data.previousVersionId) {
        const previousVersion = await getDocData(DatabaseCollections.Course, request.data.previousVersionId) as CourseDocument;
        version = previousVersion.version + 1;

        await updateDoc(DatabaseCollections.Course, request.data.previousVersionId, { retired: firestore.FieldValue.serverTimestamp() });
    }

    if (quiz) {
        quiz["totalMarks"] = totalMarks;
    }
    const courseData = {
        userId: uid,
        active: false,
        version: version,
        name: request.data.name,
        description: request.data.description,
        link: request.data.link,
        minTime: request.data.minTime,
        quiz: quiz,
        creationTime: firestore.FieldValue.serverTimestamp(),
    };

    const courseId = await addDoc(DatabaseCollections.Course, courseData);

    if (!quizQuestions) {
        return courseId;
    }

    return Promise.all(quizQuestions.map((question: any, index: number) => {
        // Each question type has different statistics to track
        let defaultStats;
        if (question.type === "tf" || question.type === "mc") {
            const answers = question.type === "mc" ? question.answers : ["True", "False"];
            defaultStats = {
                numAttempts: 0,
                totalScore: 0,
                answers: answers.reduce((acc: { [key: string]: number }, curr: string) => (acc[curr] = 0, acc), {}),
            };
        } else if (question.type === "sa") {
            defaultStats = {
                numAttempts: 0,
                totalScore: 0,
                distribution: Object.assign({}, new Array(question.marks + 1).fill(0)),
            };
        }

        const questionDoc = {
            courseId: courseId,
            stats: defaultStats,
            ...(request.data.quiz.preserveOrder && { order: index }), // If the quiz is ordered, store the order of the questions
            ...question
        }

        return addDoc(DatabaseCollections.QuizQuestion, questionDoc);
    })).then(() => courseId);
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

                const status = await getCourseStatus(course.id, uid);

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

    const courseAttempt = await getLatestCourseAttempt(request.data.courseId, uid);

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

    const status = await getCourseStatus(courseInfo.id, uid);

    let numQuizQuestions;
    if (courseInfo.quiz) {
        numQuizQuestions = await getCollection(DatabaseCollections.QuizQuestion)
            .where("courseId", "==", request.data.courseId)
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
        currentQuiz: quizAttempts.find((attempt) => !attempt.endTime && !attempt.expired) ?? null,
        courseAttemptId: courseAttempt?.id ?? null,
    };
});

/**
 * Flips the enrollment status of a user for specific course (if not enroll -> enroll, if enrolled -> unenroll)
 */
const courseEnrollment = onCall(async (request) => {

    logger.info(`Entering courseEnrollment for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    verifyIsAuthenticated(request);

    const schema = object({
        courseId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    // @ts-ignore
    const uid: string = request.auth?.uid;

    const enrolledId: string = enrolledCourseId(uid, request.data.courseId);

    // If the user is enrolled -> unenroll them, otherwise enroll them
    if (await docExists(DatabaseCollections.EnrolledCourse, enrolledId)) {
        return deleteDoc(DatabaseCollections.EnrolledCourse, enrolledId);
    }
    return addDocWithId(DatabaseCollections.EnrolledCourse, enrolledId, { userId: uid, courseId: request.data.courseId });
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
 * Permanently deletes a course, triggering a deletion of all associated data (quiz questions & all attempts)
 */
const deleteCourse = onCall(async (request) => {

    logger.info(`Entering deleteCourse for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    const schema = object({
        courseId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const courseInfo = await getDocData(DatabaseCollections.Course, request.data.courseId) as CourseDocument;

    if (courseInfo.userId !== request.auth?.uid) {
        throw new HttpsError('permission-denied', "You can't delete a course you didn't create");
    }

    logger.info("Course exists and user is the creator, deleting...");

    return deleteDoc(DatabaseCollections.Course, request.data.courseId);
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

    const subject = `Open LMS User Feedback For Course ${courseInfo.name}`;
    const content = `
        <style>
            body { background-color: #f9f9f9; }
        </style>
        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto; 
        background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px;">
            <header style="text-align: center; margin-bottom: 20px;">
                <img src="public/openlms.png" alt="OpenLMS Logo" style="max-width: 200px;">
            </header>
            <section style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; color: #333333;">OpenLMS Course Feedback</h2>
                <p style="font-size: 16px; color: #444444;">Hi there,</p>
                <p style="font-size: 16px; color: #444444;">A user submitted the feedback form for the course ${courseInfo.name}:</p>
                <p style="font-size: 16px; color: #444444;">Name: ${userInfo.name}<br/>Email: ${userInfo.email}
                <br/>Uid: ${uid}<br/>Feedback: ${request.data.feedback}</p>
            </section>
            <footer style="font-size: 12px; color: #666666; text-align: center;">
                <p>Best Regards,</p>
                <p>The OpenLMS Team</p>
                <p><a href="https://github.com/oompas/open-lms" style="color: #007bff;">Platform Readme</a> | 
                <a href="https://github.com/oompas/open-lms/blob/main/LICENSE" style="color: #007bff;">Platform License</a></p>
            </footer>
        </div>`;

    return sendEmail(courseCreator.email, subject, content, "sending course feedback");
});

export { addCourse, setCourseVisibility, getAvailableCourses, getCourseInfo, courseEnrollment, startCourse,
    deleteCourse, sendCourseFeedback };
