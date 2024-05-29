import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
    DOCUMENT_ID_LENGTH,
    shuffleArray,
    verifyIsAdmin,
    verifyIsLearner
} from "../helpers/helpers";
import { logger } from "firebase-functions";
import { array, number, object, string } from "yup";
import { firestore } from "firebase-admin";
import { updateQuizStatus } from "./helpers";
import QuizAttempt from "../database/QuizAttempt";
import CourseAttempt from "../database/CourseAttempt";
import Course from "../database/Course";
import QuizQuestion from "../database/QuizQuestion";
import QuizQuestionAttempt from "../database/QuizQuestionAttempt";
import User from "../database/User";

/**
 * Gets the quiz questions for a specific course
 */
const getQuiz = onCall(async (request) => {

    logger.info(`Retrieving quiz questions for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsLearner(request);

    const schema = object({
        quizAttemptId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    const quizAttempt = await QuizAttempt.getDocumentById(request.data.quizAttemptId);
    const courseAttempt = await CourseAttempt.getDocumentById(quizAttempt.courseAttemptId);
    const courseData = await Course.getDocumentById(quizAttempt.courseId);

    // Verify the course & quiz is still active, the course has valid quiz data and the time limit hasn't been passed
    if (courseAttempt.endTime !== null) {
        logger.error(`Course attempt with ID ${quizAttempt.courseAttemptId} is already completed`);
        throw new HttpsError("failed-precondition", `Course attempt with ID ${quizAttempt.courseAttemptId} is already completed`);
    }
    if (!courseData.quiz) {
        logger.error(`Course ${courseAttempt.courseId} does not have a quiz`);
        throw new HttpsError("not-found", `Course ${courseAttempt.courseId} does not have a quiz`);
    }
    if (quizAttempt.endTime !== null) {
        logger.error(`Quiz attempt with ID ${request.data.quizAttemptId} is already completed`);
        throw new HttpsError("failed-precondition", `Quiz attempt with ID ${request.data.quizAttemptId} is already completed`);
    }

    await quizAttempt.checkExpired();

    if (courseData.quiz.timeLimit && Date.now() > quizAttempt.startTime.toMillis() + (courseData.quiz.timeLimit * 60 * 1000)) {

        // If the attempt has expired -> fail the attempt
        const quizAttemptUpdate = {
            endTime: firestore.FieldValue.serverTimestamp(),
            pass: false,
            score: 0,
        };
        await updateDoc(DatabaseCollections.QuizAttempt, request.data.quizAttemptId, quizAttemptUpdate);

        // If this was the last quiz attempt, fail the course attempt
        if (courseData.quiz.maxAttempts) {
            const quizAttempts = await QuizAttempt.collection
                .where("courseId", "==", courseAttempt.courseId)
                .where("userId", "==", request.auth?.uid)
                .get()
                .then((snapshot) => {
                    if (snapshot.empty) {
                        logger.error(`No quiz attempts found for course ${courseAttempt.courseId}`);
                        throw new HttpsError("not-found", `No quiz attempts found for course ${courseAttempt.courseId}`);
                    }
                    return snapshot.docs;
                })
                .catch((err) => {
                    logger.info(`Error getting quiz attempts: ${err}`);
                    throw new HttpsError("internal", `Error getting quiz attempts: ${err}`);
                });

            if (quizAttempts.length >= courseData.quiz.maxAttempts) {
                const updateCourseAttempt = {
                    endTime: firestore.FieldValue.serverTimestamp(),
                    pass: false,
                };
                await updateDoc(DatabaseCollections.CourseAttempt, courseAttempt.getId(), updateCourseAttempt);
            }
        }

        return "Invalid";
    }

    const quizAttempts = await QuizAttempt.collection
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

    return QuizQuestion.collection
        .where("courseId", "==", courseAttempt.courseId)
        .get()
        .then((snapshot) => {

            if (snapshot.empty) {
                throw new HttpsError("not-found", `No quiz questions found for course ${courseAttempt.courseId}`);
            }

            const questions = snapshot.docs.map((doc) => {
                const question = {
                    id: doc.id,
                    type: doc.data().type,
                    question: doc.data().question,
                    marks: doc.data().marks,
                    order: doc.data().order,
                };

                if (doc.data().type === "mc") { // @ts-ignore
                    question["answers"] = doc.data().answers;
                }

                return question;
            });

            if (questions[0].order) {
                questions.sort((a, b) => a.order - b.order);
            } else {
                shuffleArray(questions);
            }

            // @ts-ignore
            const startTime = Math.floor(quizAttempts.find((doc) => !doc.data().endTime).data().startTime.toMillis() / 1000);
            return { // @ts-ignore
                courseName: courseData.name,
                numAttempts: quizAttempts.length,
                maxAttempts: courseData.quiz?.maxAttempts,
                timeLimit: courseData.quiz?.timeLimit,
                startTime: startTime,
                questions: questions,
            }
        })
        .catch((err) => {
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`)
        });
});

/**
 * Returns the quiz data and starts the quiz timer
 */
const startQuiz = onCall(async (request) => {

    logger.info(`Starting quiz for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsLearner(request);

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
    const courseAttempt = await CourseAttempt.getDocumentById(courseAttemptId);

    const courseId = courseAttempt.courseId;
    const courseData = await Course.getDocumentById(courseId);

    const lastQuizAttempt = await QuizAttempt.collection
        .where("courseId", "==", courseId)
        .where("userId", "==", request.auth?.uid)
        .orderBy("startTime", "desc")
        .limit(1)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                return null;
            }
            return QuizAttempt.fromFirestore(snapshot.docs[0]);
        })
        .catch((err) => {
            logger.error(`Error getting quiz attempts: ${err}`);
            throw new HttpsError("internal", `Error getting quiz attempts: ${err}`);
        });

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

    // Verify the user doesn't have an active quiz attempt
    if (lastQuizAttempt && lastQuizAttempt.endTime === null) {
        logger.error(`User has an active quiz attempt for course ${courseId}: ${lastQuizAttempt.getId()}`);
        throw new HttpsError("failed-precondition", `You have an active quiz attempt for course ${courseId}`);
    }

    // Verify the user doesn't have a quiz attempt awaiting marking
    if (lastQuizAttempt && lastQuizAttempt.pass === null) {
        logger.error(`User has a quiz attempt awaiting marking for course ${courseId}: ${lastQuizAttempt.getId()}`);
        throw new HttpsError("failed-precondition", `You have a quiz attempt awaiting marking for course ${courseId}`);
    }

    const quizAttempt = {
        userId: request.auth?.uid,
        courseId: courseAttempt.courseId,
        courseAttemptId: courseAttemptId,
        startTime: firestore.FieldValue.serverTimestamp(),
        endTime: null,
        pass: null,
        score: null,
    };
    return new QuizAttempt(quizAttempt).addToFirestore(false);
});

/**
 * Pass in the quiz responses and the quiz is marked, returning if the user passed or failed
 */
const submitQuiz = onCall(async (request) => {

    logger.info(`Submitting quiz for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsLearner(request);

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

    const { quizAttemptId, responses } = request.data; // @ts-ignore
    const uid: string = request.auth.uid;

    const quizAttempt = await QuizAttempt.getDocumentById(quizAttemptId);
    if (quizAttempt.endTime !== null) {
        logger.error(`Quiz attempt with ID ${quizAttemptId} is already completed`);
        throw new HttpsError("failed-precondition", `Quiz attempt with ID ${quizAttemptId} is already completed`);
    }

    const courseData = await Course.getDocumentById(quizAttempt.courseId);
    if (courseData.quiz?.timeLimit) {
        // Start time + max quiz time + 10 seconds (to account for API call time, etc.), all in milliseconds
        const maxEndTime = (quizAttempt.startTime.toMillis()) + (courseData.quiz?.timeLimit * 60 * 1000) + (10 * 1000);
        if (maxEndTime < Date.now()) {
            throw new HttpsError("failed-precondition", `Quiz attempt for course ${quizAttempt.courseId} has expired`);
        }
    }

    // Get all quiz questions for this quiz
    const quizQuestions = await QuizQuestion.collection
        .where("courseId", "==", quizAttempt.courseId)
        .get()
        .then((snapshot) => {
            // Verify questions are valid
            const questions: any[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
            // Multiple choice or true/false questions can be automatically marked
            if (question.type === "mc" || question.type === "tf") {
                userResponse = Number(response.answer);
                marks = question.correctAnswer === userResponse ? question.marks : 0;
            } else {
                userResponse = response.answer;
                marks = null; // Short answer questions need to be manually marked
            }
        }

        // Add question attempt to database
        const markedResponse = {
            userId: uid,
            courseId: quizAttempt.courseId,
            questionId: question.id,
            courseAttemptId: quizAttempt.courseAttemptId,
            quizAttemptId: quizAttemptId,
            response: userResponse,
            marksAchieved: marks,
            maxMarks: question.marks,
            timestamp: firestore.Timestamp.now(),
        };
        updatePromises.push(new QuizQuestionAttempt(markedResponse).addToFirestore(false));

        // Update question stats if the user answered the question & it was marked (no short answer question yet)
        if (marks !== null && userResponse) {
            const answer = (question.answers ?? ["True", "False"])[userResponse];
            const updateData = {
                "stats.numAttempts": firestore.FieldValue.increment(1),
                "stats.totalScore": firestore.FieldValue.increment(marks),
                [`stats.answers.${answer}`]: firestore.FieldValue.increment(1),
            };

            updatePromises.push(updateDoc(DatabaseCollections.QuizQuestion, question.id, updateData));
        }
    }

    await Promise.all(updatePromises);

    return updateQuizStatus(quizAttemptId, null);
});

/**
 * Gets a specific quiz attempt to mark or view
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

    const allAttempts = await QuizQuestionAttempt.collection
        .where("quizAttemptId", "==", request.data.quizAttemptId)
        .get()
        .then((snapshot) => snapshot.docs.map((doc) => QuizQuestionAttempt.fromFirestore(doc)))
        .catch((err) => {
            logger.info(`Error getting quiz questions: ${err}`);
            throw new HttpsError("internal", `Error getting quiz questions: ${err}`);
        });

    const courseInfo = await Course.getDocumentById(allAttempts[0].courseId);
    const userInfo = await User.getDocumentById(allAttempts[0].userId);
    const quizAttemptData = await QuizAttempt.getDocumentById(request.data.quizAttemptId);

    const attemptData = await Promise.all(allAttempts.map((attempt) =>
        QuizQuestion.getDocumentById(attempt.questionId)
            .then((doc: QuizQuestion) => ({
                questionAttemptId: attempt.getId(),
                question: doc.question,
                response: attempt.response,
                correctAnswer: doc.correctAnswer,
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
        completionTime: quizAttemptData.endTime?.seconds,
        saQuestions: attemptData.filter((attempt) => attempt.type === "sa"),
        otherQuestions: attemptData.filter((attempt) => attempt.type !== "sa"),
        score: quizAttemptData.score,
        markingInfo: quizAttemptData.markerInfo,
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
                questionAttemptId: string().length(DOCUMENT_ID_LENGTH).required(),
                marksAchieved: number().min(0).max(20).required(),
            }).required().noUnknown(true)
        ).required().min(1),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            throw new HttpsError('invalid-argument', err);
        });

    // @ts-ignore
    const uid: string = request.auth?.uid;
    const { quizAttemptId, responses } = request.data;

    const questionAttempts = await QuizQuestionAttempt.collection
        .where("quizAttemptId", "==", quizAttemptId)
        .where("marksAchieved", "==", null)
        .get()
        .then((snapshot) => snapshot.docs.map((doc) => QuizQuestionAttempt.fromFirestore(doc)))
        .catch((err) => {
            throw new HttpsError("internal", `Error getting quiz question attempts: ${err}`);
        });

    // Verify input response ids match with the required questions to mark
    if (questionAttempts.length !== responses.length) {
        throw new HttpsError("invalid-argument", `Number of responses (${responses.length}) does not match number of questions ${questionAttempts.length}`);
    }

    responses.forEach((response: { questionAttemptId: string, marksAchieved: number }) => {
        const questionData = questionAttempts.find((qa) => qa.getId() === response.questionAttemptId);
        if (!questionData) {
            throw new HttpsError("not-found", `Question attempt with ID ${response.questionAttemptId} not found`);
        }
        if (response.marksAchieved > questionData.maxMarks) {
            throw new HttpsError("invalid-argument", `Marks achieved (${response.marksAchieved}) exceeds maximum marks (${questionData.maxMarks})`);
        }
    });

    // Update the question attempts and question stats
    const updatePromises: Promise<any>[] = [];

    updatePromises.push(responses.map((response: { questionAttemptId: string, marksAchieved: number }) =>
        updateDoc(DatabaseCollections.QuizQuestionAttempt, response.questionAttemptId, { marksAchieved: response.marksAchieved })
    ));

    updatePromises.push(responses.map((response: { questionAttemptId: string, marksAchieved: number }) => {
        const updateData = {
            "stats.numAttempts": firestore.FieldValue.increment(1),
            "stats.totalScore": firestore.FieldValue.increment(response.marksAchieved),
            [`stats.distribution.${response.marksAchieved}`]: firestore.FieldValue.increment(1),
        };

        const questionData = questionAttempts.find((qa) => qa.id === response.questionAttemptId);
        return updatePromises.push(updateDoc(DatabaseCollections.QuizQuestion, questionData?.questionId, updateData));
    }));

    await Promise.all(updatePromises);

    logger.info(`Successfully marked ${responses.length} questions for quiz attempt ${quizAttemptId}`);

    // Update status of the quiz & course attempt
    return updateQuizStatus(quizAttemptId, uid);
});

export { startQuiz, submitQuiz, getQuiz, getQuizAttempt, markQuizAttempt };
