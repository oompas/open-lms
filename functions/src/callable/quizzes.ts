import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
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
    getCollection, getDocData, updateDoc, addDoc, QuizQuestionAttemptDocument, UserDocument,
} from "../helpers/database";

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
        if (update.type === "sa") defaultStats["distribution"] = new Array(update.marks + 1).fill(0);

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
        courseId: string().required(),
    });

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const courseData = await getDocData(DatabaseCollections.Course, request.data.courseId) as CourseDocument;
    if (!courseData.quiz) {
        throw new HttpsError("not-found", `Course ${request.data.courseId} does not have a quiz`);
    }

    const quizAttempts = await getCollection(DatabaseCollections.QuizAttempt)
        .where("courseId", "==", request.data.courseId)
        .where("userId", "==", request.auth?.uid)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                logger.error(`No quiz attempts found for course ${request.data.courseId}`);
                throw new HttpsError("not-found", `No quiz attempts found for course ${request.data.courseId}`);
            }
            if (!snapshot.docs.find((doc) => !doc.data().endTime)) {
                logger.error(`No active quiz attempts found for course ${request.data.courseId}`);
                throw new HttpsError("not-found", `No active quiz attempts found for course ${request.data.courseId}`);
            }
            return snapshot.docs;
        })
        .catch((err) => {
            logger.info(`Error getting quiz attempts: ${err}`);
            throw new HttpsError("internal", `Error getting quiz attempts: ${err}`);
        });

    return getCollection(DatabaseCollections.QuizQuestion)
        .where("courseId", "==", request.data.courseId)
        .where("active", "==", true)
        .get()
        .then((snapshot) => {

            if (snapshot.empty) {
                throw new HttpsError("not-found", `No quiz questions found for course ${request.data.courseId}`);
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

    // Verify the user hasn't used all their quiz attempts
    if (courseData.quiz?.maxAttempts) {
        await getCollection(DatabaseCollections.QuizAttempt)
            .where("courseAttemptId", "==", courseAttemptId)
            .get()
            .then((snapshot) => {
                if (courseData.quiz?.maxAttempts && snapshot.size >= courseData.quiz.maxAttempts) {
                    logger.error(`Max number of quiz attempts reached for course ${courseId}`);
                    throw new HttpsError("failed-precondition", `Max number of quiz attempts reached for course ${courseId}`);
                }
            })
            .catch((err) => {
                logger.error(`Error getting quiz attempts: ${err}`);
                throw new HttpsError("internal", `Error getting quiz attempts: ${err}`);
            });
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
        .where("userId", "==", request.auth?.uid)
        .where("courseId", "==", courseId)
        .where("courseAttemptId", "==", courseAttemptId)
        .get()
        .then((snapshot) => {
            if (snapshot.docs.find((doc) => doc.data().endTime === null)) {
                logger.error(`User has a quiz attempt in progress for course ${courseId}`);
                throw new HttpsError("failed-precondition", `You have a quiz attempt in progress for course ${courseId}`);
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

    const promises: Promise<any>[] = [];

    // Mark the quiz and update question stats
    const marksAchieved = await getCollection(DatabaseCollections.QuizQuestion)
        .where("active", "==", true)
        .where("courseId", "==", quizAttempt.courseId)
        .get()
        .then((snapshot) => {

            // Verify questions are valid
            const questions: any[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            if (!questions || questions.length === 0) {
                throw new HttpsError("not-found", `No quiz questions found for course ${request.data.courseId}`);
            }
            if (questions.length !== responses.length) {
                throw new HttpsError("invalid-argument", `Invalid request: number of responses does not match number of questions`);
            }

            // Mark each question & create promises
            let totalMarks: number | null = 0;
            for (const response of responses) {
                const question = questions.find((q) => q.id === response.questionId);
                if (!question) {
                    throw new HttpsError("not-found", `Question with ID ${response.questionId} not found`);
                }

                let marks = null; // Default for short answer (need to be marked)
                let userResponse = response.answer;
                if (question.type === "mc" || question.type === "tf") {
                    userResponse = Number(response.answer);
                    marks = question.correctAnswer === userResponse ? question.marks : 0;
                    if (totalMarks !== null) totalMarks += marks;
                } else {
                    totalMarks = null;
                }

                const markedResponse = {
                    userId: request.auth?.uid,
                    courseId: quizAttempt.courseId,
                    questionId: response.questionId,
                    quizAttemptId: quizAttemptId,
                    response: userResponse,
                    marksAchieved: marks,
                };

                // Add question attempt to database
                promises.push(addDoc(DatabaseCollections.QuizQuestionAttempt, markedResponse));

                // Update question stats
                if (marks !== null) {
                    const updateData = {
                        "stats.numAttempts": firestore.FieldValue.increment(1),
                        "stats.totalScore": firestore.FieldValue.increment(marks),
                    };
                    promises.push(updateDoc(DatabaseCollections.QuizQuestion, question.id, updateData));
                }
            }

            return totalMarks;
        })
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });

    // Check if quiz passed
    let pass: boolean | null = null;
    if (marksAchieved !== null) {
        // If there's no minimum score, they pass by default. Otherwise, verify their score is at least the threshold
        pass = courseData.quiz?.minScore === null || marksAchieved >= (courseData.quiz?.minScore ?? 0);

        const courseAttempt = await getDocData(DatabaseCollections.CourseAttempt, quizAttempt.courseAttemptId) as CourseAttemptDocument;

        // If this is the first quiz attempt or the user previously failed and now passed, update the pass status of
        // the course attempt (quiz attempt pass status will also be updated below)
        if (courseAttempt.pass === null || (!courseAttempt.pass && pass)) {
            promises.push(updateDoc(DatabaseCollections.CourseAttempt, quizAttempt.courseAttemptId, { pass: pass }));
        } else if (courseAttempt.pass) { // This shouldn't happen, doing a quiz again after passing
            logger.error(`Course attempt with ID ${quizAttempt.courseAttemptId} has already passed, quiz shouldn't be happening`);
            throw new HttpsError("failed-precondition", `Course attempt with ID ${quizAttempt.courseAttemptId} has already passed`);
        }
    }

    await Promise.all(promises).catch((err) => {
        logger.info(`Error adding marked questions: ${err}`);
        throw new HttpsError("internal", `Error adding marked questions: ${err}`);
    });

    return updateDoc(DatabaseCollections.QuizAttempt, quizAttemptId, { endTime: firestore.FieldValue.serverTimestamp(), pass: pass });
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

    // Get all quiz attempts that need marking (filter multiple questions from an attempt down to one object)
    const attemptsToMark = await getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("marksAchieved", "==", null)
        .get()
        .then((snapshot) => [...new Set(snapshot.docs.map((doc) => `${doc.data().courseId}|${doc.data().userId}|${doc.data().quizAttemptId}`))])
        .catch((err) => {
            logger.info(`Error getting short answer questions: ${err}`);
            throw new HttpsError("internal", `Error getting short answer questions: ${err}`);
        });

    logger.info(`Successfully retrieved ${attemptsToMark.length} quiz attempts with short answer questions to mark`);

    const courseNames: { [key: string]: string } = {};
    await Promise.all([...new Set(attemptsToMark.map((attempt) => attempt.split("|")[0]))].map((courseId) =>
        getDocData(DatabaseCollections.Course, courseId).then((course) => courseNames[courseId] = course.data().name)
    ));

    logger.info(`Successfully retrieved course data for ${Object.keys(courseNames).length} courses`);

    const userNames: { [key: string]: string } = {};
    await Promise.all([...new Set(attemptsToMark.map((attempt) => attempt.split("|")[1]))].map((userId) =>
        getDocData(DatabaseCollections.User, userId).then((user) => userNames[userId] = user.data().name)
    ));

    logger.info(`Successfully retrieved user data for ${Object.keys(userNames).length} users`);

    const attemptTimestamps: { [key: string]: firestore.Timestamp } = {};
    await Promise.all([...new Set(attemptsToMark.map((attempt) => attempt.split("|")[2]))].map((quizAttemptId) =>
        getDocData(DatabaseCollections.QuizAttempt, quizAttemptId).then((attempt) => attemptTimestamps[quizAttemptId] = attempt.data().endTime)
    ));

    logger.info(`Successfully retrieved quiz attempt data for ${Object.keys(attemptTimestamps).length} attempts`);

    return attemptsToMark.map((question) => {

        const [courseId, userId, quizAttemptId] = question.split("|");

        return {
            courseId,
            courseName: courseNames[courseId],
            userId,
            userName: userNames[userId],
            quizAttemptId: quizAttemptId,
            timestamp: attemptTimestamps[quizAttemptId].toMillis(),
        };
    });
});

/**
 * Gets a specific quiz attempt to mark
 */
const getQuizToMark = onCall(async (request) => {

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
            if (!snapshot.docs.find((doc) => doc.data().marksAchieved === null)) {
                throw new HttpsError("not-found", `No unmarked short answer quiz questions found for quiz attempt ${request.data.quizAttemptId}`);
            }
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() as QuizQuestionAttemptDocument }));
        })
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });

    const courseInfo = await getDocData(DatabaseCollections.Course, allAttempts[0].courseId) as CourseDocument;
    const userInfo = await getDocData(DatabaseCollections.User, allAttempts[0].userId) as UserDocument;

    const attemptData = await Promise.all(allAttempts.map((attempt) =>
        getDocData(DatabaseCollections.QuizQuestion, attempt.questionId)
            .then((doc) => ({
                id: attempt.id,
                question: doc.data().question,
                response: attempt.response,
                marks: doc.data().marks,
                marksAchieved: attempt.marksAchieved,
                type: doc.data().type,
                ...(doc.data().type === "mc") && { answers: doc.data().answers },
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
    };
});

export { updateQuizQuestions, getQuizResponses, startQuiz, submitQuiz, getQuiz, getQuizzesToMark, getQuizToMark };
