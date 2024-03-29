import { onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { auth } from "../helpers/setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { DatabaseCollections, getCollection } from "../helpers/database";

/**
 * Admin permissions are updated by a developer editing the user document in firestore
 */
const updateAdminPermissions = onDocumentUpdated(`${DatabaseCollections.User}/{userId}`, (event) => {

    // @ts-ignore
    const docAfter = event.data.after.data();
    const permissions: { admin?: true, developer?: true } = { // Developers are automatically admins
        ...((("admin" in docAfter && docAfter.admin === true) || ("developer" in docAfter && docAfter.developer === true)) && { admin: true }),
        ...("developer" in docAfter && docAfter.developer === true && { developer: true }),
    };

    const userId = event.params.userId;
    return auth.setCustomUserClaims(userId, permissions)
        .then(() => logger.log(`Successfully set user permissions ${JSON.stringify(permissions)} for user ${userId}`))
        .catch((err) => {
            logger.error(`Error setting user permissions (${JSON.stringify(permissions)}) for user ${userId}: ${err}`);
            throw new HttpsError("internal", "Error setting user permissions");
        });
});

/**
 * When a course is deleted, delete all related data for it (quiz questions, enrollments, attempts, quiz attempts)
 */
const onCourseDeleted = onDocumentDeleted(`${DatabaseCollections.Course}/{courseId}`, async (event) => {

    const collectionsToDelete = [
        DatabaseCollections.QuizQuestion,
        DatabaseCollections.EnrolledCourse,
        DatabaseCollections.CourseAttempt,
        DatabaseCollections.QuizAttempt,
        DatabaseCollections.QuizQuestionAttempt,
        DatabaseCollections.ReportedCourse,
    ];

    const docsToDelete: Promise<any>[] = [];
    for (const collection of collectionsToDelete) {
        const docs = await getCollection(collection)
            .where("courseId", "==", event.params.courseId)
            .get()
            .then((snapshot) => snapshot.docs.map((doc) => doc.ref.delete()))
            .catch((err) => {
                logger.error(`Error deleting documents from collection ${collection} for course ${event.params.courseId}: ${err}`);
                throw new HttpsError("internal", "Error deleting documents");
            });

        docsToDelete.concat(docs);
    }

    return Promise.all(docsToDelete)
        .then(() => logger.log(`Successfully deleted ${docsToDelete.length} documents related to course ${event.params.courseId}`))
        .catch((err) => {
            logger.error(`Error deleting documents related to course ${event.params.courseId}: ${err}`);
            throw new HttpsError("internal", "Error deleting documents");
        });
});

export { updateAdminPermissions, onCourseDeleted };
