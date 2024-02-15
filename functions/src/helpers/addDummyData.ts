import { HttpsError, onCall } from "firebase-functions/v2/https";
import { DatabaseCollections, getCollection, verifyIsAdmin } from "./helpers";
import { logger } from "firebase-functions";

/**
 * Cleans the database (excluding users and emails)
 */
const cleanDatabase = onCall(async (request) => {

    await verifyIsAdmin(request);

    const collectionsToClean = [];

    const coursesToClean = await getCollection(DatabaseCollections.Course)
        .listDocuments()
        .then((docs) => docs.map((doc) => doc.delete()))
        .catch((err) => { throw new HttpsError('internal', `Error cleaning all courses: ${err}`); });
    collectionsToClean.push(coursesToClean);

    await Promise.all(collectionsToClean)
        .then(() => logger.info("Database successfully cleaned"))
        .catch((err) => { throw new HttpsError('internal', `Error cleaning database: ${err}`); })
});

export { cleanDatabase };
