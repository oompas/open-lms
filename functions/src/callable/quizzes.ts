import {onCall} from "firebase-functions/v2/https";
import {DatabaseCollections, getCollection, verifyIsAdmin, verifyIsAuthenticated} from "../helpers/helpers";
import {logger} from "firebase-functions";
import {array, number, object, string} from "yup";
import {HttpsError} from "firebase-functions/lib/v2/providers/https";

/**
 * Adds a quiz for a course with the given data:
 * -courseId
 *
 * array of quiz questions and answers; map it to it's own object; add it to the
 * QuizQuestion database collection
 *
 * input array of 10 quiz questions (questions, answers, etc); construct 10 objects with
 * the question, possible responses, correct responses, active (default if adding a question),
 * courseId; end of function add all of these objects to the QuizQuestion collection
 *
 * essentially creating n objects where n is the # of questions;
 * put correctAnswers in questions object, set active to true (cause it's adding the initial questions)
 *
 * if ever working on multiple objects in the database (like quiz questions) that don't depend on each other
 * use promise.all so they all they run at the same time and save a BUNCH of time
 * ^ this is used in auth.ts for getUserProfile
 */
const addQuiz = onCall(async (request) => {

    logger.info(`Entering addQuiz for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    logger.info("Administrative permission verification passed")

    const schema = object({
        courseId: string().required(),
        questions: array().of(
            object({
                question: string().required(),
                answers: array().of(string().required()).min(2),
                correctAnswer: number().required(),
            })
        ).min(1).max(99),
    })

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const { courseId, questions } = request.data;

    const quizQuestionCollection = getCollection(DatabaseCollections.QuizQuestion);
    // @ts-ignore
    const addQuestions = questions.map((question) =>
        quizQuestionCollection.add({ courseId, ...question, numAttempts: 0, numCorrect: 0, active: true})
    );

    return Promise.all(addQuestions)
        .then(docs => docs.map(doc => doc.id))
        .catch((err) => { throw new HttpsError("internal", `Error adding new quiz question: ${err}`) });
});

/**
 * Updates the quiz for a given course
 *
 * Note: old questions (deleted/updated) are kept in the database
 */
const updateQuiz = onCall(async (request) => {

    logger.info(`Entering updateQuiz with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    // There are 3 cases to consider:
    // 1. New question: pass in new question object. A new question is created
    // 2. Updated question: pass in new question object plus the id of the old object. A new question is created and
    // the old one is deactivated
    //      ^^ problems arising to potential ordering of the questions? perhaps new attribute or something
    //      to set question ordering
    // 3. Deleted question: pass in the id of the old question. The old question is deactivated

    const schema = object({
        courseId: string().required(),
        updates: array().of(
            object({
                questionId: string().optional(),
                questions: object({
                    question: string().optional(),
                    answers: array().of(string()).min(2).optional(),
                    correctAnswer: number().optional(),
                }).optional(),
            })
        ).min(1),
    });

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
    });

    logger.info("Schema verification passed");

    const { courseId, updates } = request.data;
    const quizQuestionCollection = getCollection(DatabaseCollections.QuizQuestion);

    // @ts-ignore
    const updatePromises = updates.map((update) => {
        if (update.questionId && update.questions) {
            // Case 2: Updated question
            const deactivateOld = quizQuestionCollection.doc(update.questionId).update({ active: false });
            const addNew = quizQuestionCollection.add({ courseId, ...update.questions, active: true });
            return Promise.all([deactivateOld, addNew])
        } else if (update.questionId) {
            // Case 3: Deleted question
            return quizQuestionCollection.doc(update.questionId).update({ active: false });
        } else if (update.questions) {
            // Case 1: New question
            return quizQuestionCollection.add({ courseId, ...update.questions, active: true });
        }
    });

    return Promise.all(updatePromises)
        .then((results) => results.map((result) => Array.isArray(result) ? result[1].id : 'Updated'))
        .catch((err) => { throw new HttpsError("internal", `Error updating quiz question: ${err}`) });
});

/**
 * Gets the responses for each question for a specific quiz attempt
 */
const getQuizResponses = onCall(async (request) => {

    await verifyIsAdmin(request);

    /*
    const schema = object({
        courseId: string().required(),
        userId: string().required(),
    });
     */

    // TODO: Get the course attempt object and return the relevant info
});

/**
 * Returns the quiz data and starts the quiz timer
 */
const startQuiz = onCall(async (request) => {

    // can't use await without making this an async function
    // however, it's a quiz, so it can't be async so IDK
    // what to do instead
    verifyIsAuthenticated(request);

    /*
    const schema = object({
        courseId: string().required(),
    });
    // need to grab quizId from the course via courseId, for now I just put it as a string


    await schema.validate((request.data)
        // need to figure out how to know if the schema has been validated before
        // going into the rest of the logic
        .then(validationCheck) = > {
    }
     */
    /*
    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    // I believe request.auth.uid is because of me coding this like an async function
    // but without the awaits, so it thinks it can skip around potentially?
    const { courseId } = request.data;
    const quizStartInfo = {
        userId: request.auth.uid,
        courseId: courseId,
        quizId: quizId,
        startTime: Timestamp.now(),
    }

     */
    // TODO: Start a quiz attempt & return the questions
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

export { addQuiz, updateQuiz, getQuizResponses, startQuiz, submitQuiz };
