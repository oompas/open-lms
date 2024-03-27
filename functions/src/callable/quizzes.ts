import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
    DOCUMENT_ID_LENGTH,
    shuffleArray,
    verifyIsAdmin,
    verifyIsAuthenticated
} from "../helpers/helpers";
import { logger } from "firebase-functions";
import { array, number, object, string } from "yup";
import { firestore } from "firebase-admin";
import {
    DatabaseCollections,
    CourseDocument,
    CourseAttemptDocument,
    QuizAttemptDocument,
    getCollection, getDocData, updateDoc, addDoc, QuizQuestionAttemptDocument, UserDocument, QuizQuestionDocument,
} from "../helpers/database";
import { updateQuizStatus } from "./helpers";

/**
 * Updates the quiz for a given course (add, delete or update)
 *
 * Note: old questions (deleted/updated) are kept in the database, just deactivated so status and responses can
 * still be seen
 */
const updateQuizQuestions = onCall(async (request) => {

    logger.info(`Entering updateQuiz for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    const schema = object({
        courseId: string().required(),
        questions: array().of(
            object({
                id: string().optional(),
                question: string().min(1).max(500).optional(),
                type: string().oneOf(["mc", "tf", "sa"]).optional(),
                answers: array().of(string()).min(2).optional(),
                marks: number().optional().min(1).max(20),
                correctAnswer: number().optional(),
            }).noUnknown(true)
        ).min(1),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
    });

    logger.info("Schema verification passed");

    const { courseId, questions } = request.data;

    // Returns true if the update object has the same keys as the desired array
    const checkKeys = (update: any, desired: string[]) => {
        const properties = Object.keys(update);
        return desired.every((key) => properties.includes(key)) && properties.length === desired.length;
    }

    // Returns the type of question update (new, update, delete)
    const questionType = (update: any) => {

        let type;

        // Delete case is just id - simple
        if (checkKeys(update, ["id"])) {
            type = "delete";
            return type;
        }

        // Verify the type of question is valid
        let keys = [];
        if (update.type === "mc") {
            keys = ["question", "type", "answers", "correctAnswer", "marks"];
        } else if (update.type === "tf") {
            keys = ["question", "type", "correctAnswer", "marks"];
        } else if (update.type === "sa") {
            keys = ["question", "type", "marks"];
        } else {
            throw new HttpsError(
                "invalid-argument",
                `Invalid request: question ${JSON.stringify(update)} is invalid; 'type' must be one of 'mc', 'tf', or 'sa'`
            );
        }
        if (!checkKeys(update, update.id ? [...keys, "id"] : keys)) {
            throw new HttpsError(
                "invalid-argument",
                `Invalid request: question ${JSON.stringify(update)} is invalid; must include the following keys: ${keys.join(", ")}`
            );
        }

        return update.id ? "update" : "new";
    }

    const updatePromises: Promise<any>[] = [];

    questions.forEach((update: any) => {

        const updateType = questionType(update);

        // Each question has statistics - score for tf/mc, distribution for sa (since partial marks are possible)
        const defaultStats = { numAttempts: 0 }; // @ts-ignore
        if (update.type === "mc" || update.type === "tf") defaultStats["totalScore"] = 0; // @ts-ignore
        if (update.type === "sa") defaultStats["distribution"] = Object.assign({}, new Array(update.marks + 1).fill(0));

        /**
         * New question: add to the collection
         * Update question: deactivate old question, add new question
         * Delete question: deactivate question
         */
        if (updateType === "new" || updateType === "update") {
            updatePromises.push(addDoc(DatabaseCollections.QuizQuestion, { courseId, ...update, active: true, stats: defaultStats }));
        }
        if (updateType === "update" || updateType === "delete") {
            updatePromises.push(updateDoc(DatabaseCollections.QuizQuestion, update.id, { active: false }));
        }
    });

    return Promise.all(updatePromises)
        .then((results) => results.map(() => `Successfully updated ${questions.length} quiz questions`))
        .catch((err) => { throw new HttpsError("internal", `Error updating quiz question: ${err}`) });
});

/**
 * Gets the quiz questions for a specific course
 */
const getQuiz = onCall(async (request) => {

    logger.info(`Retrieving quiz questions for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    verifyIsAuthenticated(request);

    const schema = object({
        quizAttemptId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const quizAttempt = await getDocData(DatabaseCollections.QuizAttempt, request.data.quizAttemptId) as QuizAttemptDocument;
    const courseAttempt = await getDocData(DatabaseCollections.CourseAttempt, quizAttempt.courseAttemptId) as CourseAttemptDocument;
    const courseData = await getDocData(DatabaseCollections.Course, quizAttempt.courseId) as CourseDocument;

    // Verify the course & quiz is still active, the course has valid quiz data and the time limit hasn't been passed
    if (courseAttempt.endTime !== null) {
        logger.error(`Course attempt with ID ${quizAttempt.courseAttemptId} is already completed`);
        throw new HttpsError("failed-precondition", `Course attempt with ID ${quizAttempt.courseAttemptId} is already completed`);
    }
    if (!courseData.quiz) {
        logger.error(`Course ${courseAttempt.courseId} does not have a quiz`);
        throw new HttpsError("not-found", `Course ${courseAttempt.courseId} does not have a quiz`);
    }
    if (quizAttempt.endTime !== null || quizAttempt.expired) {
        logger.error(`Quiz attempt with ID ${request.data.quizAttemptId} is already completed`);
        throw new HttpsError("failed-precondition", `Quiz attempt with ID ${request.data.quizAttemptId} is already completed`);
    }
    if (courseData.quiz.timeLimit && Date.now() > quizAttempt.startTime.toMillis() + (courseData.quiz.timeLimit * 60 * 1000)) {
        await updateDoc(DatabaseCollections.QuizAttempt, request.data.quizAttemptId, { expired: true })
        return "Invalid";
    }

    const quizAttempts = await getCollection(DatabaseCollections.QuizAttempt)
        .where("courseId", "==", courseAttempt.courseId)
        .where("userId", "==", request.auth?.uid)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                logger.error(`No quiz attempts found for course ${courseAttempt.courseId}`);
                throw new HttpsError("not-found", `No quiz attempts found for course ${courseAttempt.courseId}`);
            }
            if (!snapshot.docs.find((doc) => !doc.data().endTime)) {
                logger.error(`No active quiz attempts found for course ${courseAttempt.courseId}`);
                throw new HttpsError("not-found", `No active quiz attempts found for course ${courseAttempt.courseId}`);
            }
            return snapshot.docs;
        })
        .catch((err) => {
            logger.info(`Error getting quiz attempts: ${err}`);
            throw new HttpsError("internal", `Error getting quiz attempts: ${err}`);
        });

    return getCollection(DatabaseCollections.QuizQuestion)
        .where("courseId", "==", courseAttempt.courseId)
        .where("active", "==", true)
        .get()
        .then((snapshot) => {

            if (snapshot.empty) {
                throw new HttpsError("not-found", `No quiz questions found for course ${courseAttempt.courseId}`);
            }

            const questions = shuffleArray(snapshot.docs.map((doc) => {
                const question = {
                    id: doc.id,
                    type: doc.data().type,
                    question: doc.data().question,
                    marks: doc.data().marks,
                };

                if (doc.data().type === "mc") { // @ts-ignore
                    question["answers"] = doc.data().answers;
                }

                return question;
            }));

            // @ts-ignore
            const startTime = Math.floor(quizAttempts.find((doc) => !doc.data().endTime).data().startTime.toMillis() / 1000);
            return { // @ts-ignore
                courseName: courseData.name, // @ts-ignore
                numAttempts: quizAttempts.length, // @ts-ignore
                maxAttempts: courseData.quiz.maxAttempts, // @ts-ignore
                timeLimit: courseData.quiz.timeLimit,
                startTime: startTime,
                questions: questions,
            }
        })
        .catch((err) => {
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`)
        });
});

/**
 * Gets the responses for each question for a specific quiz attempt
 */
const getQuizResponses = onCall(async (request) => {

    logger.info(`Retrieving quiz responses for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    const schema = object({
        quizAttemptId: string().required(),
    }).noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    const quizAttemptId = request.data.quizAttemptId;

    // Verify the quiz attempt exists
    const quizAttempt = await getDocData(DatabaseCollections.QuizAttempt, quizAttemptId) as QuizAttemptDocument;
    if (quizAttempt.endTime === null) {
        logger.error(`Quiz attempt with ID ${quizAttemptId} is still active`);
        throw new HttpsError("failed-precondition", `Quiz attempt with ID ${quizAttemptId} is still active`);
    }

    // Retrieve the respective quiz question attempt objects if the quiz attempt is completed
    return getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("quizAttemptId", "==", quizAttemptId)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                logger.info(`No responses found for quiz attempt ${quizAttemptId}`);
                throw new HttpsError("not-found", `No responses found for quiz attempt ${quizAttemptId}`);
            }
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
});

/**
 * Returns the quiz data and starts the quiz timer
 */
const startQuiz = onCall(async (request) => {

    logger.info(`Starting quiz for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    verifyIsAuthenticated(request);

    const schema = object({
        courseAttemptId: string().required().length(20),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const courseAttemptId = request.data.courseAttemptId;
    const courseAttempt = await getDocData(DatabaseCollections.CourseAttempt, courseAttemptId) as CourseAttemptDocument;

    const courseId = courseAttempt.courseId;
    const courseData = await getDocData(DatabaseCollections.Course, courseId) as CourseDocument;

    /**
     * To start a quiz:
     * 1. The course must be active
     * 2. The course must have a quiz
     * 3. There must be an in progress course attempt
     * 4. The user must have waited the minimum time before starting the quiz (if required)
     */

    // Verify the course is active
    if (!courseData.active) {
        logger.error(`Course ${courseId} is not active`);
        throw new HttpsError("failed-precondition", `Course ${courseId} is not active`);
    }

    // Verify the course has a quiz
    if (courseData.quiz === null) {
        logger.error(`Course ${courseId} does not have a quiz`);
        throw new HttpsError("not-found", `Course ${courseId} does not have a quiz`);
    }

    // Verify the course attempt isn't already completed (passed or failed)
    if (courseAttempt.pass !== null || courseAttempt.endTime !== null) {
        logger.error(`Course attempt with ID ${courseAttemptId} has already been completed. Pass: ${courseAttempt.pass} End time: ${courseAttempt.endTime}`);
        throw new HttpsError("failed-precondition", `Course attempt with ID ${courseAttemptId} has already been completed`);
    }

    // Verify the user has waited the minimum time before starting the quiz (if required)
    if (courseData.minTime !== null) {
        if (Date.now() < courseAttempt.startTime.toMillis() + courseData.minTime * 60 * 1000) {
            logger.error(`User has not waited the minimum time (${courseData.minTime}) before starting the quiz`);
            throw new HttpsError("failed-precondition", `You must wait ${courseData.minTime} minutes before starting the quiz`);
        }
    }

    // Ensure the user doesn't have a quiz attempt in progress
    await getCollection(DatabaseCollections.QuizAttempt)
        .where("courseAttemptId", "==", courseAttemptId)
        .where("endTime", "==", null)
        .get()
        .then((snapshot) => {
            if (!snapshot.empty) {
                logger.error(`User has a quiz attempt in progress for course ${courseId}`);
                throw new HttpsError("failed-precondition", `You have quiz attempt(s) in progress for course ${courseId}`);
            }
        })
        .catch((err) => {
            logger.error(`Error getting quiz attempts: ${err}`);
            throw new HttpsError("internal", `Error getting quiz attempts: ${err}`);
        });

    return addDoc(DatabaseCollections.QuizAttempt, {
            userId: request.auth?.uid,
            courseId: courseAttempt.courseId,
            courseAttemptId: courseAttemptId,
            startTime: firestore.FieldValue.serverTimestamp(),
            endTime: null,
            pass: null,
            score: null,
        });
});

/**
 * Pass in the quiz responses and the quiz is marked, returning if the user passed or failed
 */
const submitQuiz = onCall(async (request) => {

    logger.info(`Submitting quiz for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    verifyIsAuthenticated(request);

    const schema = object({
        quizAttemptId: string().required(),
        responses: array().of(
            object({
                questionId: string().required(),
                answer: string().required(),
            }).noUnknown(true)
        ).required().min(1),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const { quizAttemptId, responses } = request.data;

    const quizAttempt = await getDocData(DatabaseCollections.QuizAttempt, quizAttemptId) as QuizAttemptDocument;
    if (quizAttempt.endTime !== null) {
        logger.error(`Quiz attempt with ID ${quizAttemptId} is already completed`);
        throw new HttpsError("failed-precondition", `Quiz attempt with ID ${quizAttemptId} is already completed`);
    }

    const courseData = await getDocData(DatabaseCollections.Course, quizAttempt.courseId) as CourseDocument;
    if (courseData.quiz?.timeLimit) {
        // Start time + max quiz time + 10 seconds (to account for API call time, etc.), all in milliseconds
        const maxEndTime = (quizAttempt.startTime.toMillis()) + (courseData.quiz?.timeLimit * 60 * 1000) + (10 * 1000);
        if (maxEndTime < Date.now()) {
            throw new HttpsError("failed-precondition", `Quiz attempt for course ${quizAttempt.courseId} has expired`);
        }
    }

    // Get all quiz questions for this quiz
    const quizQuestions = await getCollection(DatabaseCollections.QuizQuestion)
        .where("active", "==", true)
        .where("courseId", "==", quizAttempt.courseId)
        .get()
        .then((snapshot) => {
            // Verify questions are valid
            const questions: any[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as QuizQuestionDocument));
            if (!questions || questions.length === 0) {
                throw new HttpsError("not-found", `No quiz questions found for course ${request.data.courseId}`);
            }
            if (responses.length > questions.length) {
                throw new HttpsError("invalid-argument", `Invalid request: more responses than questions (${responses.length} > ${questions.length})`);
            }
            responses.forEach((response: { questionId: string, answer: string }) => {
                if (!questions.find((q) => q.id === response.questionId)) {
                    throw new HttpsError("not-found", `Question with ID ${response.questionId} not found`);
                }
            });

            return questions;
        })
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });

    const updatePromises: Promise<any>[] = [];

    // Mark each question & create promises
    for (const question of quizQuestions) {
        const response: { questionId: string, answer: string } | undefined = responses.find((r: any) => r.questionId === question.id);

        let userResponse;
        let marks;
        if (response === undefined) { // User didn't answer the question: no response & default score of zero
            marks = 0;
            userResponse = null;
        } else {
            if (question.type === "mc" || question.type === "tf") {
                userResponse = Number(response.answer);
                marks = question.correctAnswer === userResponse ? question.marks : 0;
            } else {
                userResponse = response.answer;
                marks = null;
            }
        }

        // Add question attempt to database
        const markedResponse = {
            userId: request.auth?.uid,
            courseId: quizAttempt.courseId,
            questionId: response.questionId,
            quizAttemptId: quizAttemptId,
            response: userResponse,
            marksAchieved: marks,
            ...(question.type === "sa" && { maxMarks: question.marks })
        };
        updatePromises.push(addDoc(DatabaseCollections.QuizQuestionAttempt, markedResponse));

        // Update question stats
        if (marks !== null) {
            const updateData = {
                "stats.numAttempts": firestore.FieldValue.increment(1),
                "stats.totalScore": firestore.FieldValue.increment(marks),
            };
            updatePromises.push(updateDoc(DatabaseCollections.QuizQuestion, question.id, updateData));
        }
    }

    await Promise.all(updatePromises);

    return updateQuizStatus(quizAttemptId);
});

/**
 * Returns a list of quiz attempts that need marking
 */
const getQuizzesToMark = onCall(async (request) => {

    logger.info(`Entering getQuestionsToMark for user ${request.auth?.uid}`);

    await verifyIsAdmin(request);

    const schema = object({}).required().noUnknown();

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema & admin verification passed");

    // Get all quiz attempts that need marking
    const attemptsToMark = await getCollection(DatabaseCollections.QuizAttempt)
        .where("endTime", "!=", null)
        .where("pass", "==", null)
        .get()
        .then((snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as QuizAttemptDocument)))
        .catch((err) => {
            logger.info(`Error getting short answer questions: ${err}`);
            throw new HttpsError("internal", `Error getting short answer questions: ${err}`);
        });

    logger.info(`Successfully retrieved ${attemptsToMark.length} quiz attempts with short answer questions to mark`);

    // Get all course names (may have duplicates, so use a set to get unique values for efficiency)
    const courseNames: { [key: string]: string } = {};
    await Promise.all([...new Set(attemptsToMark.map((attempt) => attempt.courseId))].map((courseId) =>
        getDocData(DatabaseCollections.Course, courseId).then((course) => courseNames[courseId] = course.name)
    ));

    logger.info(`Successfully retrieved course data for ${Object.keys(courseNames).length} courses`);

    // Get all usernames (same as above with possible duplicates)
    const userNames: { [key: string]: string } = {};
    await Promise.all([...new Set(attemptsToMark.map((attempt) => attempt.userId))].map((userId) =>
        getDocData(DatabaseCollections.User, userId).then((user) => userNames[userId] = user.name)
    ));

    logger.info(`Successfully retrieved user data for ${Object.keys(userNames).length} users`);

    return attemptsToMark.map((quizAttempt) => {

        if (quizAttempt.endTime === null) {
            throw new HttpsError("internal", `Quiz attempt ${quizAttempt.id} is still active (no end time)`);
        }

        return {
            courseId: quizAttempt.courseId,
            courseName: courseNames[quizAttempt.courseId],
            userId: quizAttempt.userId,
            userName: userNames[quizAttempt.userId],
            quizAttemptId: quizAttempt.id,
            timestamp: Math.floor(quizAttempt.endTime.toMillis() / 1000),
        };
    });
});

/**
 * Gets a specific quiz attempt to mark
 */
const getQuizAttempt = onCall(async (request) => {

    logger.info(`Entering getQuizToMark for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    const schema = object({
        quizAttemptId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema & admin verification passed");

    const allAttempts = await getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("quizAttemptId", "==", request.data.quizAttemptId)
        .get()
        .then((snapshot) => {
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as QuizQuestionAttemptDocument));
        })
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });

    const courseInfo = await getDocData(DatabaseCollections.Course, allAttempts[0].courseId) as CourseDocument;
    const userInfo = await getDocData(DatabaseCollections.User, allAttempts[0].userId) as UserDocument;
    const quizAttemptData = await getDocData(DatabaseCollections.QuizAttempt, request.data.quizAttemptId) as QuizAttemptDocument;

    const attemptData = await Promise.all(allAttempts.map((attempt) =>
        getDocData(DatabaseCollections.QuizQuestion, attempt.questionId)
            .then((doc) => ({
                id: attempt.id,
                question: doc.question,
                response: attempt.response,
                marks: doc.marks,
                marksAchieved: attempt.marksAchieved,
                type: doc.type,
                ...(doc.type === "mc") && { answers: doc.answers },
            }))
    ))
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });

    return {
        courseName: courseInfo.name,
        learnerName: userInfo.name,
        saQuestions: attemptData.filter((attempt) => attempt.type === "sa"),
        otherQuestions: attemptData.filter((attempt) => attempt.type !== "sa"),
        score: quizAttemptData.score,
    };
});

/**
 * Marks a quiz attempt's short answer questions
 */
const markQuizAttempt = onCall(async (request) => {

    await verifyIsAdmin(request);

    const schema = object({
        quizAttemptId: string().length(DOCUMENT_ID_LENGTH).required(),
        responses: array().of(
            object({
                id: string().length(DOCUMENT_ID_LENGTH).required(),
                marksAchieved: number().min(0).max(20).required(),
            }).required().noUnknown(true)
        ).required().min(1),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            throw new HttpsError('invalid-argument', err);
        });

    const { quizAttemptId, responses } = request.data;

    const questionAttempts: QuizQuestionAttemptDocument[] = await getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("quizAttemptId", "==", quizAttemptId)
        .where("marksAchieved", "==", null)
        .get()
        .then((snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as QuizQuestionAttemptDocument)))
        .catch((err) => {
            throw new HttpsError("internal", `Error getting quiz question attempts: ${err}`);
        });

    // Verify input response ids match with the required questions to mark
    if (questionAttempts.length !== responses.length) {
        throw new HttpsError("invalid-argument", `Number of responses (${responses.length}) does not match number of questions ${questionAttempts.length}`);
    }

    responses.forEach((response: { id: string, marksAchieved: number }) => {
        const questionData = questionAttempts.find((qa) => qa.id === response.id);
        if (!questionData) {
            throw new HttpsError("not-found", `Question attempt with ID ${response.id} not found`);
        } // @ts-ignore
        if (response.marksAchieved > questionData.maxMarks) {
            throw new HttpsError("invalid-argument", `Marks achieved (${response.marksAchieved}) exceeds maximum marks (${questionData.maxMarks})`);
        }
    });

    // Update the question attempts and question stats
    const updatePromises: Promise<any>[] = [];

    updatePromises.push(responses.map((response: { id: string, marksAchieved: number }) =>
        updateDoc(DatabaseCollections.QuizQuestionAttempt, response.id, { marksAchieved: response.marksAchieved })
    ));

    updatePromises.push(responses.map((response: { id: string, marksAchieved: number }) => {
        const updateData = {
            "stats.numAttempts": firestore.FieldValue.increment(1),
        }; // @ts-ignore
        updateData[`stats.distribution.${response.marksAchieved}`] = firestore.FieldValue.increment(1);

        return updatePromises.push(updateDoc(DatabaseCollections.QuizQuestion, response.id, updateData));
    }));

    await Promise.all(updatePromises);

    // Update status of the quiz & course attempt
    return updateQuizStatus(quizAttemptId);
});

export { updateQuizQuestions, getQuizResponses, startQuiz, submitQuiz, getQuiz, getQuizzesToMark, getQuizAttempt, markQuizAttempt };
