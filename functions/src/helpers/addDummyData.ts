import { HttpsError, onCall } from "firebase-functions/v2/https";
import { verifyIsAdmin } from "./helpers";
import { logger } from "firebase-functions";
import { DatabaseCollections, getCollection } from "./database";

/**
 * Cleans the database (excluding users and emails)
 */
const cleanDatabase = onCall(async (request) => {

    await verifyIsAdmin(request);

    const collections = Object.values(DatabaseCollections).filter((collection) => collection !== DatabaseCollections.User);

    const promises = [];
    for (let collection of collections) {
        const docToClean = await getCollection(collection)
            .listDocuments()
            .then((docs) => docs.map((doc) => doc.delete()))
            .catch((err) => { throw new HttpsError('internal', `Error getting all documents in collection '${collection}': ${err}`); });

        promises.push(docToClean);
    }

    await Promise.all(promises)
        .then(() => logger.info(`Successfully cleaned ${promises.length} documents`))
        .catch((err) => { throw new HttpsError('internal', `Error cleaning database: ${err}`); })
});

export { cleanDatabase };
