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
                marks: number().optional(),
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

        /**
         * New question: add to the collection
         * Update question: deactivate old question, add new question
         * Delete question: deactivate question
         */
        if (updateType === "new" || updateType === "update") updatePromises.push(dbCollection.add({ courseId, ...update, active: true, numAttempts: 0, totalScore: 0 }));
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
        .then((snapshot) => snapshot.size)
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

            return { // @ts-ignore
                courseName: courseData.name, // @ts-ignore
                attempt: quizAttempts, // @ts-ignore
                maxAttempts: courseData.quiz.maxAttempts, // @ts-ignore
                timeLimit: courseData.quiz.timeLimit,
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

    if (!request.data.courseAttemptId) {
        throw new HttpsError("invalid-argument", "Invalid request: 'courseAttemptId' is required");
    }

    const courseAttemptId = request.data;
    const userId = request.auth?.uid;

    // Verifying there's no in-progress quiz attempt
    const quizAttemptCollection = getCollection(DatabaseCollections.QuizAttempt);
    const existingAttemptQuery = await quizAttemptCollection
        .where("courseAttemptId", "==", courseAttemptId)
        .where("endTime", "==", null)
        .get();

    if (!existingAttemptQuery.empty) {
        logger.error(`User ${userId} already has a quiz attempt in progress under ${courseAttemptId}`);
        throw new HttpsError('already-exists', `User ${userId} already has a quiz attempt in progress.`);
    }

    return quizAttemptCollection.add({
        courseAttemptId: courseAttemptId,
        startTime: FieldValue.serverTimestamp(),
    });
});

/**
 * Pass in the quiz responses and the quiz is marked, returning if the user passed or failed
 */
const submitQuiz = onCall(async (request) => {

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
            if (attempt.data().startTime.toMillis() + attempt.data().maxTime * 60 * 1000 < Date.now()) {
                throw new HttpsError("failed-precondition", `Quiz attempt for course ${courseId} has expired`);
            }

            return attempt.id;
        });

    // Mark the quiz and update question stats
    const questionStatUpdates: Promise<any>[] = [];
    const markedResponses = await getCollection(DatabaseCollections.QuizQuestion)
        .where("active", "==", true)
        .where("courseId", "==", courseId)
        .get()
        .then((snapshot) => {
            const questions: any[] = snapshot.docs;
            if (!questions || questions.length === 0) {
                throw new HttpsError("not-found", `No quiz questions found for course ${request.data.courseId}`);
            }
            if (questions.length !== responses.length) {
                throw new HttpsError("invalid-argument", `Invalid request: number of responses does not match number of questions`);
            }

            const markedResponses = [];
            for (const response of responses) {
                const question = questions.find((q) => q.id === response.questionId);
                if (!question) {
                    throw new HttpsError("not-found", `Question with ID ${response.questionId} not found`);
                }

                let marks;
                if (question.type === "mc" || question.type === "tf") {
                    marks = question.data().correctAnswer === response.answer ? question.data().marks : 0;
                } else { // TODO: Short answer
                    marks = question.data().marks;
                }

                markedResponses.push({
                    questionId: response.questionId,
                    question: question.data().question,
                    response: response.answer,
                    correctAnswer: question.data().correctAnswer,
                    marks: marks,
                });

                questionStatUpdates.push(
                    getDoc(DatabaseCollections.QuizQuestion, question.id)
                        .update({
                            numAttempts: FieldValue.increment(1),
                            totalScore: FieldValue.increment(marks),
                        })
                        .catch((err) => {
                            logger.info(`Error updating question stats: ${err}`);
                            throw new HttpsError("internal", `Error updating question stats: ${err}`);
                        })
                );
            }
            return markedResponses;
        })
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });

    await Promise.all(questionStatUpdates).catch((err) => {
        logger.info(`Error updating question stats: ${err}`);
        throw new HttpsError("internal", `Error updating question stats: ${err}`);
    });

    // Update quiz attempt
    return getDoc(DatabaseCollections.QuizAttempt, attemptId)
        .update({
            endTime: FieldValue.serverTimestamp(),
            responses: markedResponses,
        })
        .then(() => "Successfully submitted quiz")
        .catch((err) => {
            logger.info(`Error submitting quiz attempt: ${err}`);
            throw new HttpsError("internal", `Error submitting quiz attempt: ${err}`);
        });
});

export { updateQuizQuestions, getQuizResponses, startQuiz, submitQuiz, getQuiz };
