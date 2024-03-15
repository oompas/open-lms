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
            const questions: any[] = snapshot.docs;
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

                let marks;
                if (question.type === "mc" || question.type === "tf") {
                    marks = question.data().correctAnswer === response.answer ? question.data().marks : 0;
                } else {
                    // Short answer: must be marked by an admin
                    marks = null;
                }

                const markedResponse = {
                    userId: request.auth?.uid,
                    courseId: courseId,
                    questionId: response.questionId,
                    question: question.data().question,
                    type: question.data().type,
                    response: response.answer,
                    possibleMarks: question.data().marks,
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
                promises.push(
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

export { updateQuizQuestions, getQuizResponses, startQuiz, submitQuiz, getQuiz };
