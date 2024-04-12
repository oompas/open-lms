import { db } from "../setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/lib/v2/providers/https";
import { firestore } from "firebase-admin";

abstract class DatabaseObject {

    private readonly id: string;

    protected constructor(id: string) {
        this.id = id;
    }

    public getId(): string {
        return this.id;
    }

    /**
     * Returns the database document as a JSON object with document data & id
     */
    abstract getObject(noId?: boolean): object;

    /**
     * Adds the object to Firestore as a new object
     * @param id (Optional) The ID of the document
     */
    protected abstract addtoFirestore(id?: string): Promise<string>;

    // Gets all documents in specified collection
    protected static _getAllDocs = (collectionName: string): Promise<firestore.QueryDocumentSnapshot[]> => {
        return db.collection(collectionName)
            .get()
            .then((result) => result.docs)
            .catch(err => {
                logger.error(`Error getting documents from collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${collectionName}'`);
            });
    }

    // Helper function, allows child classes to specify their own collection name
    protected _addToFirestore = (collectionName: string, id?: string): Promise<string> => {
        if (id) {
            return db.collection(collectionName)
                .doc(id)
                .set(this.getObject(true))
                .then(() => id)
                .catch((err) => {
                    logger.error(`Error setting document in collection '${collectionName}': ${err}`);
                    throw new HttpsError("internal", `Error setting document in collection '${collectionName}'`);
                });
        }

        return db.collection(collectionName)
            .add(this.getObject(true))
            .then((doc) => doc.id)
            .catch((err) => {
                logger.error(`Error adding document to collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error adding document to collection '${collectionName}'`);
            });
    }
}

export { DatabaseObject };
