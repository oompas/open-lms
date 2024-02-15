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
 * Adds a course with the given data:
 * -name
 * -description
 * -link
 * -minTime
 * -maxQuizAttempts
 * -quizTimeLimit
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
        link: string().required(),
        minTime: number().required().integer().positive(),
        maxQuizAttempts: number().required().integer().positive(),
        quizTimeLimit: number().required().integer().positive(),
        active: boolean().required()
    });

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    logger.info("Schema verification passed");

    return getCollection(DatabaseCollections.Course)
        // @ts-ignore
        .add({ userID: request.auth.uid, ...request.data })
        .then((doc) => doc.id)
        .catch((err) => { throw new HttpsError("internal", `Error adding new course: ${err}`) });
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
    const uid = request.auth.uid;

    // Get completed course IDs to exclude from the result
    // @ts-ignore
    const userCourses: { courseId: string, pass: boolean }[] = await getCollection(DatabaseCollections.CourseAttempt)
        .where("userId", "==", uid)
        .get()
        .then((docs) => docs.docs.map((doc) => doc.data()))
        .catch((error) => {
            logger.error(`Error getting course attempts: ${error}`);
            throw new HttpsError("internal", `Error getting courses, please try again later`);
        });

    // Return all active & uncompleted courses
    return getCollection(DatabaseCollections.Course)
        .get()
        .then((courses) => {
            return courses.docs
                .map((doc) => {
                    const courseEnrolled = userCourses.filter((course) => course.courseId === doc.id);
                    return {
                        id: doc.id,
                        name: doc.data().name,
                        description: doc.data().description,
                        enrolled: courseEnrolled.length > 0,
                        pass: courseEnrolled.length === 0 ? null : courseEnrolled[0].pass,
                    }
                });
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

    verifyIsAuthenticated(request);

    if (typeof request.data.courseId !== 'string' || request.data.courseId.length !== 20) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to get course info");
    }

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

            const courseAttempt = await getCollection(DatabaseCollections.CourseAttempt)
                .where("userId", "==", request.auth?.uid)
                .where("courseId", "==", request.data.courseId)
                .get()
                .then((docs) => docs.empty ? null : docs.docs[0].data())
                .catch((error) => {
                    logger.error(`Error getting course attempts: ${error}`);
                    throw new HttpsError("internal", `Error getting courses, please try again later`);
                });

            const courseEnrolled = await getDoc(DatabaseCollections.EnrolledCourse, request.auth?.uid + "|" + request.data.courseId)
                .get()
                .then((doc) => doc.exists)
                .catch((error) => { throw new HttpsError("internal", `Error getting course enrollment: ${error}`) });

            return {
                courseId: course.id,
                name: docData.name,
                description: docData.description,
                link: docData.link,
                minTime: docData.minTime,
                maxQuizAttempts: docData.maxQuizAttempts,
                quizTimeLimit: docData.quizTimeLimit,
                completed: courseAttempt?.pass ?? null,
                enrolled: courseEnrolled,
                startTime: courseAttempt?.startTime ?? null,
            };
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

    return getDoc(DatabaseCollections.EnrolledCourse, request.auth?.uid + "|" + request.data.courseId)
        .set({})
        .then(() => "Successfully enrolled in course")
        .catch((error) => {
            logger.error(`Error enrolling in course ${request.data.courseId}: ${error}`);
            throw new HttpsError("internal", "Error enrolling in course, please try again later");
        });
});

/**
 * The requesting users starts a course attempt
 */
const startCourse = onCall(async (request) => {

    verifyIsAuthenticated(request);

    // Verify the user in enrolled in the course
    if (!request.data.courseId) {
        throw new HttpsError('invalid-argument', "Must provide a course ID to start");
    }
    await getDoc(DatabaseCollections.EnrolledCourse, request.auth?.uid + "|" + request.data.courseId)
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
        .then(() => "Successfully started course")
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

export { addCourse, getAvailableCourses, getCourseInfo, courseEnroll, startCourse, sendCourseFeedback };
