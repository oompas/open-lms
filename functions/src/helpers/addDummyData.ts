import { HttpsError, onCall } from "firebase-functions/v2/https";
import { DatabaseCollections, getCollection, verifyIsAdmin } from "./helpers";
import { logger } from "firebase-functions";

/**
 * Cleans the database (excluding users and emails)
 */
const cleanDatabase = onCall(async (request) => {

    await verifyIsAdmin(request);

    const collectionsToClean = [];

    const collections = [
        DatabaseCollections.Course,
        DatabaseCollections.EnrolledCourse,
        DatabaseCollections.CourseAttempt,
        DatabaseCollections.QuizQuestion,
        DatabaseCollections.QuizAttempt,
    ];

    for (let collection of collections) {
        const docToClean = await getCollection(collection)
            .listDocuments()
            .then((docs) => docs.map((doc) => doc.delete()))
            .catch((err) => { throw new HttpsError('internal', `Error getting all documents in collection '${collection}': ${err}`); });
        collectionsToClean.push(docToClean);
    }

    await Promise.all(collectionsToClean)
        .then(() => logger.info("Database successfully cleaned"))
        .catch((err) => { throw new HttpsError('internal', `Error cleaning database: ${err}`); })
});

export { cleanDatabase };
