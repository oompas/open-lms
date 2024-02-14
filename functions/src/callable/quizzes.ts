import { onCall } from "firebase-functions/v2/https";
import { verifyIsAdmin, verifyIsAuthenticated } from "../helpers/helpers";

/**
 * Adds a quiz for a given course
 */
const addQuiz = onCall(async (request) => {

    await verifyIsAdmin(request);

    // TODO: Update the quiz by adding the new questions (don't delete the old questions!)
});

/**
 * Updates the quiz for a given course
 *
 * Note: old questions (deleted/updated) are kept in the database
 */
const updateQuiz = onCall(async (request) => {

    await verifyIsAdmin(request);
});

/**
 * Gets the responses for each question for a specific course attempt
 */
const getQuizResponses = onCall(async (request) => {

    await verifyIsAdmin(request);

    // TODO: Get the course attempt object and return the relevant info
});

/**
 * Returns the quiz data and starts the quiz timer
 */
const startQuiz = onCall((request) => {

    verifyIsAuthenticated(request);

    // TODO: Start a quiz attempt & return the questions
});

/**
 * Pass in the quiz responses and the quiz is marked, returning if the user passed or failed
 */
const submitQuiz = onCall((request) => {

    verifyIsAuthenticated(request);

    // TODO: Verify the timer is ok (allow a few extra seconds for response time), mark the quiz and return pass/fail
});

export { addQuiz, updateQuiz, getQuizResponses, startQuiz, submitQuiz };
