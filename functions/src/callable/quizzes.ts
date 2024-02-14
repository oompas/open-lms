import { onCall } from "firebase-functions/v2/https";
import { verifyIsAdmin, verifyIsAuthenticated } from "../helpers/helpers";

/**
 * Adds a quiz for a given course
 */
const addQuiz = onCall(async (request) => {

    await verifyIsAdmin(request);

    // Check out addCourse endpoint - basically same logic, just different values
});

/**
 * Updates the quiz for a given course
 *
 * Note: old questions (deleted/updated) are kept in the database
 */
const updateQuiz = onCall(async (request) => {

    await verifyIsAdmin(request);

    // There are 3 cases to consider:
    // 1. New question: pass in new question object. A new question is created
    // 2. Updated question: pass in new question object plus the id of the old object. A new question is created and
    // the old one is deactivated
    // 3. Deleted question: pass in the id of the old question. The old question is deactivated
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
