import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
    DatabaseCollections,
    getCollection,
    getDoc,
    shuffleArray,
    verifyIsAdmin,
    verifyIsAuthenticated
} from "../helpers/helpers";
import { logger } from "firebase-functions";
import { array, number, object, string } from "yup";
import { firestore } from "firebase-admin";
import FieldValue = firestore.FieldValue;

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

    const dbCollection = getCollection(DatabaseCollections.QuizQuestion);
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
        if (updateType === "new" || updateType === "update") updatePromises.push(dbCollection.add({ courseId, ...update, active: true, stats: defaultStats }));
        if (updateType === "update" || updateType === "delete") updatePromises.push(dbCollection.doc(update.id).update({ active: false }));
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

    const courseData = await getDoc(DatabaseCollections.Course, request.data.courseId)
        .get()
        .then((doc) => {
            if (!doc.exists || !doc.data()) {
                throw new HttpsError("not-found", `Course with ID ${request.data.courseId} not found`);
            } // @ts-ignore
            if (!doc.data().quiz) {
                throw new HttpsError("not-found", `Course with ID ${request.data.courseId} does not have a quiz`);
            }
            return doc.data();
        })
        .catch((err) => {
            logger.info(`Error getting course data: ${err}`);
            throw new HttpsError("internal", `Error getting course data: ${err}`);
        });

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

    if (!request.data.quizAttemptId) {
        throw new HttpsError("invalid-argument", "Invalid request: 'quizAttemptId' is required");
    }

    const quizAttemptId = request.data;

    // Verify the quiz attempt exists
    const quizAttemptRef = await getCollection(DatabaseCollections.QuizAttempt)
        .where("quizAttemptId", "==", quizAttemptId)
        .where("endTime", "==", null)
        .get();

    // Verify the quiz attempt has been completed
    if (!quizAttemptRef.empty) {
        logger.info(`Quiz attempt ${quizAttemptId} is not completed.`)
        return [];
    }

    // Retrieve the respective quiz question attempt objects if the quiz attempt is completed
    const quizQuestionAttempts = await getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("quizAttemptId", "==", quizAttemptId)
        .get();

    if (quizQuestionAttempts.empty) {
        logger.info(`No responses found for quiz attempt ${quizAttemptId}`);
        return [];
    } else {
        return quizQuestionAttempts.docs.map(doc => ({
            id: doc.id, ...doc.data()
        }));
    }

});

/**
 * Returns the quiz data and starts the quiz timer
 */
const startQuiz = onCall(async (request) => {

    logger.info(`Starting quiz for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    verifyIsAuthenticated(request);

    const schema = object({
        courseId: string().required().length(20),
    }).noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    // @ts-ignore
    const userId: string = request.auth?.uid;

    const attemptId = await getCollection(DatabaseCollections.CourseAttempt)
        .where("userId", "==", userId)
        .where("courseId", "==", request.data.courseId)
        .where("endTime", "==", null)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                logger.error(`No active course attempt found for course ${request.data.courseId}`);
                throw new HttpsError("not-found", `No active course attempt found for course ${request.data.courseId}`);
            }
            if (snapshot.size > 1) {
                logger.error(`Multiple active course attempts found for course ${request.data.courseId}`);
                throw new HttpsError("failed-precondition", `Multiple active course attempts found for course ${request.data.courseId}`);
            }
            return snapshot.docs[0].id;
        });

    return getCollection(DatabaseCollections.QuizAttempt)
        .add({
            userId: userId,
            courseId: request.data.courseId,
            courseAttemptId: attemptId,
            startTime: FieldValue.serverTimestamp(),
            endTime: null,
        })
        .then(() => "Successfully started quiz")
        .catch((err) => {
            logger.error(`Error starting quiz: ${err}`);
            throw new HttpsError('internal', `Error starting quiz}`);
        });
});

/**
 * Pass in the quiz responses and the quiz is marked, returning if the user passed or failed
 */
const submitQuiz = onCall(async (request) => {

    logger.info(`Submitting quiz for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    verifyIsAuthenticated(request);

    const schema = object({
        courseId: string().required(),
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

    const { courseId, responses } = request.data;

    // Verify quiz attempt is all good
    const attemptId = await getCollection(DatabaseCollections.QuizAttempt)
        .where("courseId", "==", courseId)
        .where("userId", "==", request.auth?.uid)
        .where("endTime", "==", null)
        .get()
        .then((snapshot) => {
            if (snapshot.size === 0) {
                throw new HttpsError("not-found", `No active quiz attempt found for course ${courseId}`);
            }
            if (snapshot.size > 1) {
                throw new HttpsError("failed-precondition", `Multiple active quiz attempts found for course ${courseId}`);
            }

            const attempt = snapshot.docs[0];
            if (!attempt.exists || !attempt.data()) {
                throw new HttpsError("not-found", `No active quiz attempt found for course ${courseId}`);
            }
            // Start time + max quiz time + 10 seconds (to account for API call time, etc.), all in milliseconds
            const maxEndTime = (attempt.data().startTime.toMillis()) + (attempt.data().maxTime * 60 * 1000) + (10 * 1000);
            if (maxEndTime < Date.now()) {
                throw new HttpsError("failed-precondition", `Quiz attempt for course ${courseId} has expired`);
            }

            return attempt.id;
        });

    const promises: Promise<any>[] = [];

    // Mark the quiz and update question stats
    await getCollection(DatabaseCollections.QuizQuestion)
        .where("active", "==", true)
        .where("courseId", "==", courseId)
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
                }

                const markedResponse = {
                    userId: request.auth?.uid,
                    courseId: courseId,
                    questionId: response.questionId,
                    quizAttemptId: attemptId,
                    response: userResponse,
                    marksAchieved: marks,
                };

                // Add question attempt to database
                promises.push(
                    getCollection(DatabaseCollections.QuizQuestionAttempt)
                        .add(markedResponse)
                        .catch((err) => {
                            logger.info(`Error adding quiz question attempt: ${err}`);
                            throw new HttpsError("internal", `Error adding quiz question attempt: ${err}`);
                        })
                );

                // Update question stats
                if (marks !== null) {
                    promises.push(
                        getDoc(DatabaseCollections.QuizQuestion, question.id)
                            .update({
                                "stats.numAttempts": FieldValue.increment(1),
                                "stats.totalScore": FieldValue.increment(marks),
                            })
                            .catch((err) => {
                                logger.info(`Error updating question stats: ${err}`);
                                throw new HttpsError("internal", `Error updating question stats: ${err}`);
                            })
                    );
                }
            }
        })
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });

    await Promise.all(promises).catch((err) => {
        logger.info(`Error adding marked questions: ${err}`);
        throw new HttpsError("internal", `Error adding marked questions: ${err}`);
    });

    // Update quiz attempt
    return getDoc(DatabaseCollections.QuizAttempt, attemptId)
        .update({ endTime: FieldValue.serverTimestamp() })
        .then(() => "Successfully submitted quiz")
        .catch((err) => {
            logger.info(`Error submitting quiz attempt: ${err}`);
            throw new HttpsError("internal", `Error submitting quiz attempt: ${err}`);
        });
});

/**
 * Returns a list of quiz attempts that need marking
 */
const getQuizzesToMark = onCall(async (request) => {

    logger.info(`Entering getQuestionsToMark for user ${request.auth?.uid}`);

    await verifyIsAdmin(request);

    const schema = object({}).noUnknown(true);

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

    const courseNames = {};
    await Promise.all([...new Set(attemptsToMark.map((attempt) => attempt.split("|")[0]))].map((courseId) =>
        getDoc(DatabaseCollections.Course, courseId)
            .get() // @ts-ignore
            .then((course) => courseNames[courseId] = course.data().name)
            .catch((err) => {
                logger.info(`Error getting course data: ${err}`);
                throw new HttpsError("internal", `Error getting course data: ${err}`);
            })
    ));

    logger.info(`Successfully retrieved course data for ${Object.keys(courseNames).length} courses`);

    const userNames = {};
    await Promise.all([...new Set(attemptsToMark.map((attempt) => attempt.split("|")[1]))].map((userId) =>
        getDoc(DatabaseCollections.User, userId)
            .get() // @ts-ignore
            .then((user) => userNames[userId] = user.data().name)
            .catch((err) => {
                logger.info(`Error getting user data: ${err}`);
                throw new HttpsError("internal", `Error getting user data: ${err}`);
            })
    ));

    logger.info(`Successfully retrieved user data for ${Object.keys(userNames).length} users`);

    const attemptTimestamps = {};
    await Promise.all([...new Set(attemptsToMark.map((attempt) => attempt.split("|")[2]))].map((quizAttemptId) =>
        getDoc(DatabaseCollections.QuizAttempt, quizAttemptId)
            .get() // @ts-ignore
            .then((attempt) => attemptTimestamps[quizAttemptId] = attempt.data().endTime)
            .catch((err) => {
                logger.info(`Error getting quiz attempt data: ${err}`);
                throw new HttpsError("internal", `Error getting quiz attempt data: ${err}`);
            })
    ));

    logger.info(`Successfully retrieved quiz attempt data for ${Object.keys(attemptTimestamps).length} attempts`);

    return attemptsToMark.map((question) => {

        const [courseId, userId, quizAttemptId] = question.split("|");

        return {
            courseId, // @ts-ignore
            courseName: courseNames[courseId],
            userId, // @ts-ignore
            userName: userNames[userId], // @ts-ignore
            timestamp: attemptTimestamps[quizAttemptId].toMillis() / 1000,
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
    }).noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema & admin verification passed");

    const attempts = await getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("quizAttemptId", "==", request.data.quizAttemptId)
        .where("marksAchieved", "==", null)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                throw new HttpsError("not-found", `No quiz questions found for quiz attempt ${request.data.quizAttemptId}`);
            }
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        })
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });

    return Promise.all(attempts.map((attempt) => // @ts-ignore
        getDoc(DatabaseCollections.QuizQuestion, attempt.questionId)
            .get()
            .then((doc) => {
                if (!doc.exists || !doc.data()) { // @ts-ignore
                    throw new HttpsError("not-found", `Question with ID ${attempt.questionId} not found`);
                }
                return {
                    id: attempt.id, // @ts-ignore
                    question: doc.data().question, // @ts-ignore
                    response: attempt.response, // @ts-ignore
                    marks: doc.data().marks,
                }
            })
            .catch((err) => {
                logger.info(`Error getting quiz questions: ${err}`);
                throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
            })
    ))
        .then((result) => result)
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });
});

export { updateQuizQuestions, getQuizResponses, startQuiz, submitQuiz, getQuiz, getQuizzesToMark, getQuizToMark };
