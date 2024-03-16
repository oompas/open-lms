import {HttpsError, onCall} from "firebase-functions/v2/https";
import {
    DatabaseCollections,
    getCollection,
    shuffleArray,
    verifyIsAdmin,
    verifyIsAuthenticated
} from "../helpers/helpers";
import {logger} from "firebase-functions";
import {firestore} from "firebase-admin";
import {array, number, object, string} from "yup";
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
                correctAnswer: number().optional(),
            })
        ).min(1),
    });

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
            keys = ["question", "type", "answers", "correctAnswer"];
        } else if (update.type === "tf") {
            keys = ["question", "type", "correctAnswer"];
        } else if (update.type === "sa") {
            keys = ["question", "type"];
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
        if (updateType === "new" || updateType === "update") updatePromises.push(dbCollection.add({ courseId, ...update, active: true, numAttempts: 0, numCorrect: 0 }));
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

    verifyIsAuthenticated(request);

    if (!request.data.courseId) {
        throw new HttpsError("invalid-argument", "Invalid request: 'courseId' is required");
    }

    return getCollection(DatabaseCollections.QuizQuestion)
        .where("courseId", "==", request.data.courseId)
        .where("active", "==", true)
        .get()
        .then((snapshot) => shuffleArray(snapshot.docs.map((doc) => {
            const question = {
                id: doc.id,
                type: doc.data().type,
                question: doc.data().question,
            };

            if (doc.data().type === "mc") { // @ts-ignore
                question["answers"] = doc.data().answers;
            }

            return question;
        })))
        .catch((err) => {
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`)
        });
});

/**
 * Gets the responses for each question for a specific quiz attempt
 */
const getQuizResponses = onCall(async (request) => {

    await verifyIsAdmin(request);

    const schema = object({
        quizAttemptId: string().required(),
    });

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`)
            throw new HttpsError('invalid-argument', err);
        });
    logger.info("Schema verification passed");

    const quizAttemptId = request.data;

    // Verify the quiz attempt isn't in progress
    const quizAttemptRef = await getCollection(DatabaseCollections.QuizAttempt)
        .doc(quizAttemptId)
        .get();

    if (!quizAttemptRef.exists) {
        logger.error(`Quiz attempt ${quizAttemptId} does not exist.`)
    }

    // Verify the quiz attempt has been completed
    // @ts-ignore
    if (!quizAttemptRef.data().endTime) {
        logger.info(`Quiz attempt ${quizAttemptId} is not completed.`)
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
        courseAttemptId: string().required(),
    })

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });
    logger.info("Schema verification passed");

    const courseAttemptId = request.data;
    const userId = request.auth?.uid;

    // Verifying there's no in-progress quiz attempt
    const quizAttemptCollection = getCollection(DatabaseCollections.QuizAttempt);
    const existingAttemptQuery = await quizAttemptCollection
        .where("userId", "==", userId)
        .where("courseAttemptId", "==", courseAttemptId)
        .where("endTime", "==", "null")
        .get();

    if (!existingAttemptQuery.empty) {
        logger.error(`User ${userId} already has a quiz attempt in progress under ${courseAttemptId}`);
        throw new HttpsError('already-exists', `User ${userId} already has a quiz attempt in progress.`);
    }

    return quizAttemptCollection.add({
        userId: userId,
        courseAttemptId: courseAttemptId,
        startTime: FieldValue.serverTimestamp(),
    });
});

/**
 * Pass in the quiz responses and the quiz is marked, returning if the user passed or failed
 */
const submitQuiz = onCall((request) => {

    verifyIsAuthenticated(request);

    /*
    const schema = object({
        quizAttemptId: string().required(),
        responses: array().of(
            object({
                questionId: string().required(),
                answer: string().required(),
            })
        ).required(),
    });

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

     */
    // TODO: Verify the timer is ok (allow a few extra seconds for response time), mark the quiz and return pass/fail
});

export { updateQuizQuestions, getQuizResponses, startQuiz, submitQuiz, getQuiz };
