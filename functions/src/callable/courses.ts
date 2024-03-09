import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
    DatabaseCollections,
    getCollection,
    getDoc,
    sendEmail,
    verifyIsAdmin,
    verifyIsAuthenticated
} from "../helpers/helpers";
import { logger } from "firebase-functions";
import { boolean, number, object, string } from 'yup';
import { firestore } from "firebase-admin";
import FieldValue = firestore.FieldValue;

/**
 * The ID for an enrolled course is the user & course ID concatenated so:
 * -No query is needed to check it, can just get the document through an ID
 * -No duplicate enrollments are possible
 * The enrollment document will also have these IDs in the document if individual queries are needed
 */
const enrolledCourseId = (userId: string, courseId: string) => `${userId}|${courseId}`;

/**
 * Adds a course with the given data:
 * -name
 * -description
 * -link
 * -minTime (in minutes)
 * -maxQuizAttempts
 * -quizTimeLimit (in minutes)
 * -active
 *
 * And a new course is returned
 */
const addCourse = onCall(async (request) => {

    logger.info(`Entering addCourse for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    logger.info("Administrative permission verification passed");

    const schema = object({
        name: string().required().min(1, "Name must be non-empty").max(50, "Name can't be over 50 characters long"),
        description: string().required(),
        link: string().url().required(),
        minTime: number().integer().positive().nullable(),
    });

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    return getCollection(DatabaseCollections.Course)
        // @ts-ignore
        .add({ userID: request.auth.uid, quiz: null, ...request.data })
        .then((doc) => doc.id)
        .catch((err) => { throw new HttpsError("internal", `Error adding new course: ${err}`) });
});

/**
 * Publishes the course with the given ID (set 'active' to true)
 */
const publishCourse = onCall(async (request) => {

        logger.info(`Entering publishCourse for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

        await verifyIsAdmin(request);

        logger.info("Administrative permission verification passed");

        const schema = object({
            courseId: string().required(),
        });

        await schema.validate(request.data, { strict: true })
            .catch((err) => {
                logger.error(`Error validating request: ${err}`);
                throw new HttpsError('invalid-argument', err);
            });

        logger.info("Schema verification passed");

        return getDoc(DatabaseCollections.Course, request.data.courseId)
            .update({ active: true })
            .then(() => "Course published successfully")
            .catch((err) => { throw new HttpsError("internal", `Error publishing course: ${err}`) });
});

/**
 * Unpublishes the course with the given ID (set 'active' to false)
 */
const unPublishCourse = onCall(async (request) => {

        logger.info(`Entering unPublishCourse for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

        await verifyIsAdmin(request);

        logger.info("Administrative permission verification passed");

        const schema = object({
            courseId: string().required(),
        });

        await schema.validate(request.data, { strict: true })
            .catch((err) => {
                logger.error(`Error validating request: ${err}`);
                throw new HttpsError('invalid-argument', err);
            });

        logger.info("Schema verification passed");

        return getDoc(DatabaseCollections.Course, request.data.courseId)
            .update({ active: false })
            .then(() => "Course unpublished successfully")
            .catch((err) => { throw new HttpsError("internal", `Error unpublishing course: ${err}`) });
});

/**
 * Updates an existing course's data (excluding quiz data)
 */
const updateCourse = onCall(async (request) => {

    logger.info(`Entering updateCourse for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    await verifyIsAdmin(request);

    logger.info("Administrative permission verification passed");

    const schema = object({
        courseId: string().required(),
        name: string().nullable().min(1, "Name must be non-empty").max(50, "Name can't be over 50 characters long"),
        description: string().nullable(),
        link: string().url().nullable(),
        minTime: number().integer().positive().nullable(),
    });

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    return getDoc(DatabaseCollections.Course, request.data.courseId)
        .update(request.data)
        .then(() => "Course updated successfully")
        .catch((err) => { throw new HttpsError("internal", `Error updating course: ${err}`) });
});

/**
 * Gets a list of all active courses the user hasn't completed, with their:
 * -name
 * -description
 * -enrolled status for the requesting user
 */
const getAvailableCourses = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth.uid;

    return getCollection(DatabaseCollections.Course)
        .where("active", "==", true)
        .get()
        .then(async (courses) => {

            const allCourses = [];

            for (let course of courses.docs) {

                const courseEnrolled = await getDoc(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, course.id))
                    .get()
                    .then((doc) => doc.exists)
                    .catch((error) => { throw new HttpsError("internal", `Error getting course enrollment: ${error}`) });

                let courseAttempt = undefined;
                if (courseEnrolled) {
                    courseAttempt = await getCollection(DatabaseCollections.CourseAttempt)
                        .where("userId", "==", request.auth?.uid)
                        .where("courseId", "==", course.id)
                        .get()
                        .then((docs) => docs.empty ? null : docs.docs[0].data())
                        .catch((error) => {
                            logger.error(`Error getting course attempts: ${error}`);
                            throw new HttpsError("internal", `Error getting courses, please try again later`);
                        });
                }

                /*
                 * Statuses:
                 * 1 - Not enrolled
                 * 2 - Enrolled, not started
                 * 3 - In progress
                 * 4 - Failed
                 * 5 - Passed
                 *
                 * TODO: Make an enum or something for this (+ on front-end)
                 */
                let status;
                if (!courseEnrolled) {
                    status = 1;
                } else if (courseAttempt === null ) {
                    status = 2;
                } else if (courseAttempt?.pass === null) {
                    status = 3;
                } else if (courseAttempt?.pass === false) {
                    status = 4;
                } else if (courseAttempt?.pass === true) {
                    status = 5;
                } else {
                    throw new HttpsError("internal", "Course is in an invalid state - can't get status");
                }

                const courseData = {
                    id: course.id,
                    name: course.data().name,
                    description: course.data().description,
                    status: status,
                };

                allCourses.push(courseData);
            }

            return allCourses;
        })
        .catch((error) => {
            logger.error(`Error getting active courses: ${error}`);
            throw new HttpsError("internal", `Error getting courses, please try again later`);
        });
});

/**
 * Gets the given information for the specified quiz:
 * -courseId
 * -name
 * -description
 * -link
 * -minTime
 * -maxQuizAttempts
 * -quizTimeLimit
 */
const getCourseInfo = onCall((request) => {

    logger.info(`Entering getCourseInfo for user ${request.auth?.uid} with payload ${JSON.stringify(request.data)}`);

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    const schema = object({
        courseId: string().required().length(20),
        withQuiz: boolean().required(),
    });

    schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    return getDoc(DatabaseCollections.Course, request.data.courseId)
        .get()
        .then(async (course) => {
            if (!course.exists) {
                logger.error(`Error: document '/Course/${request.data.courseId}/' does not exist`);
                throw new HttpsError("invalid-argument", `Course with ID '${request.data.courseId}' does not exist`);
            }

            const docData = course.data();
            if (!docData) {
                logger.error(`Error: document '/Course/${request.data.courseId}/' exists, but has no data`);
                throw new HttpsError("internal", "Error: document data corrupted");
            }

            /**
             * withQuiz is for the course editor, so it returns the quiz data (including answers, so admin-only)
             * Otherwise, it returns the course with the status and start time for the requesting user (course page)
             */
            if (!request.data.withQuiz) {

                if (!docData.active) {
                    throw new HttpsError("invalid-argument", "Cannot view inactive course");
                }

                const courseAttempt = await getCollection(DatabaseCollections.CourseAttempt)
                    .where("userId", "==", request.auth?.uid)
                    .where("courseId", "==", request.data.courseId)
                    .get()
                    .then((docs) => docs.empty ? null : docs.docs[0].data())
                    .catch((error) => {
                        logger.error(`Error getting course attempts: ${error}`);
                        throw new HttpsError("internal", `Error getting courses, please try again later`);
                    });

                const courseEnrolled = await getDoc(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, request.data.courseId))
                    .get()
                    .then((doc) => doc.exists)
                    .catch((error) => { throw new HttpsError("internal", `Error getting course enrollment: ${error}`) });

                let status;
                if (!courseEnrolled) {
                    status = 1;
                } else if (courseAttempt === null ) {
                    status = 2;
                } else if (courseAttempt?.pass === null) {
                    status = 3;
                } else if (courseAttempt?.pass === false) {
                    status = 4;
                } else if (courseAttempt?.pass === true) {
                    status = 5;
                } else {
                    throw new HttpsError("internal", "Course is in an invalid state - can't get status");
                }

                return {
                    courseId: course.id,
                    name: docData.name,
                    description: docData.description,
                    link: docData.link,
                    minTime: docData.minTime,
                    quiz: docData.quiz,
                    status: status,
                    startTime: courseAttempt?.startTime._seconds ?? null,
                };

            } else {

                await verifyIsAdmin(request); // This returns quiz answers for course editing, so admin-only

                let quizQuestions = null;
                if (docData.quiz) {
                    quizQuestions = await getCollection(DatabaseCollections.QuizQuestion)
                        .where("courseId", "==", request.data.courseId)
                        .get()
                        .then((docs) => docs.docs.map((doc) => doc.data()))
                        .catch((error) => {
                            logger.error(`Error checking if course has quiz questions: ${error}`);
                            throw new HttpsError('internal', "Error getting course quiz, please try again later");
                        });
                }

                return {
                    courseId: course.id,
                    active: docData.active,
                    name: docData.name,
                    description: docData.description,
                    link: docData.link,
                    minTime: docData.minTime,
                    quiz: docData.quiz,
                    quizQuestions: quizQuestions,
                };
            }
        })
        .catch((error) => {
            logger.error(`Error getting document '/Course/${request.data.courseId}/': ${error}`);
            throw new HttpsError("internal", "Error getting course data, please try again later");
        });
});

/**
 * Enrolls the requesting user in the specified course
 */
const courseEnroll = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    // Ensure a valid course ID is passed in
    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to enroll in");
    }
    await getDoc(DatabaseCollections.Course, request.data.courseId).get()
        .then((doc) => {
            if (!doc.exists) {
                logger.error(`Course with ID '${request.data.courseId}' does not exist`);
                throw new HttpsError('invalid-argument', `Course with ID '${request.data.courseId}' does not exist`);
            }
        })
        .catch((error) => {
            logger.error(`Error checking if course exists: ${error}`);
            throw new HttpsError('internal', "Error enrolling in course, please try again later");
        });

    return getDoc(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, request.data.courseId))
        .set({ userId: uid, courseId: request.data.courseId })
        .then(() => "Successfully enrolled in course")
        .catch((error) => {
            logger.error(`Error enrolling in course ${request.data.courseId}: ${error}`);
            throw new HttpsError("internal", "Error enrolling in course, please try again later");
        });
});

/**
 * Unenrolls the requesting user from the specified course
 */
const courseUnenroll = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    // Ensure a valid course ID is passed in
    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to unenroll from");
    }

    return getDoc(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, request.data.courseId))
        .delete()
        .then(() => "Successfully unenrolled from course")
        .catch((error) => {
            logger.error(`Error unenrolling from course ${request.data.courseId}: ${error}`);
            throw new HttpsError("internal", "Error unenrolling from course, please try again later");
        });
});

/**
 * The requesting users starts a course attempt
 */
const startCourse = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // @ts-ignore
    const uid: string = request.auth?.uid;

    // Verify the user in enrolled in the course
    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to start");
    }
    await getDoc(DatabaseCollections.EnrolledCourse, enrolledCourseId(uid, request.data.courseId))
        .get()
        .then((doc) => {
            if (!doc.exists) { // @ts-ignore
                logger.error(`No course enrollment with course ID '${request.data.courseId}' and user ID '${request.auth.uid}' exists`);
                throw new HttpsError('invalid-argument', `You are not enrolled in this course`);
            }
        })
        .catch((error) => {
            logger.error(`Error checking if user is enrolled in course: ${error}`);
            throw new HttpsError('internal', "Error starting course, please try again later");
        });

    const courseAttempt = {
        userId: request.auth?.uid,
        courseId: request.data.courseId,
        startTime: FieldValue.serverTimestamp(),
        endTime: null,
        pass: null,
    }

    return getCollection(DatabaseCollections.CourseAttempt)
        .add(courseAttempt)
        .then((result) => result.get().then((doc) => doc?.data()?.startTime._seconds ))
        .catch((error) => {
            logger.error(`Error starting course ${request.data.courseId}: ${error}`);
            throw new HttpsError("internal", "Error enrolling in course, please try again later");
        });
});

/**
 * Sends feedback for a course to the course creator
 */
const sendCourseFeedback = onCall(async (request) => {

    verifyIsAuthenticated(request);

    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a courseId");
    }
    if (!request.data.feedback || typeof request.data.feedback !== 'string') {
        throw new HttpsError('invalid-argument', "Must provide feedback");
    }

    // @ts-ignore
    const userInfo: { name: string, email: string, uid: string } = await getDoc(DatabaseCollections.User, request.auth.uid)
        .get() // @ts-ignore
        .then((user) => ({ name: user.data().name, email: user.data().email, uid: user.id }))
        .catch((error) => { // @ts-ignore
            logger.error(`Error getting user (${request.auth.uid}): ${error}`);
            throw new HttpsError("internal", "Error sending course feedback, please try again later");
        });

    const courseInfo = await getDoc(DatabaseCollections.Course, request.data.courseId)
        .get() // @ts-ignore
        .then((course) => ({ name: course.data().name, creator: course.data().creator }))
        .catch((error) => {
            logger.error(`Error getting course info (${request.data.courseId}): ${error}`);
            throw new HttpsError("internal", "Error sending course feedback, please try again later");
        });

    const subject = `Open LMS user feedback for course ${courseInfo.name}`;
    const content = `User ${userInfo.name} (${userInfo.email}) has sent the following feedback for the course 
                                ${courseInfo.name}:<br/> ${request.data.feedback}`;
    return sendEmail(courseInfo.creator, subject, content, "sending course feedback");
});

export { addCourse, publishCourse, unPublishCourse, updateCourse, getAvailableCourses, getCourseInfo, courseEnroll, courseUnenroll, startCourse, sendCourseFeedback };
